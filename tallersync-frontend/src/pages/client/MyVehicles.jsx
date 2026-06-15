import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

function fmtMoney(val) { return `$${Number(val || 0).toFixed(2)}` }
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

const EMPTY = { brand: '', model: '', year: '', plate: '', color: '' }

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([])
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showAdd,  setShowAdd]  = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [history,  setHistory]  = useState([])
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/vehicles'),
      api.get('/work-orders'),
    ]).then(([v, wo]) => {
      setVehicles(v.data.vehicles || [])
      setOrders(wo.data.orders || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const getOrderForVehicle = vehicleId =>
    orders.find(o => o.vehicle_id === vehicleId && o.status !== 'done') || null

  const openDetail = async v => {
    setSelected(v)
    setShowDetail(true)
    const order = getOrderForVehicle(v.id)
    if (order) {
      const hist = await api.get(`/work-orders/${order.id}/history`)
      setHistory(hist.data.history || [])
    } else {
      setHistory([])
    }
  }

  const handleAdd = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/vehicles', { ...form, year: Number(form.year) })
      setShowAdd(false)
      setForm(EMPTY)
      load()
    } catch (err) {
      setError(err.message || 'Error al registrar vehículo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mis Vehículos</h1>
          <p>Consulta el estado y progreso de tus vehículos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowAdd(true); setError('') }}>
          + Registrar Vehículo
        </button>
      </div>

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <Icon name="icon-car" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h4>Sin vehículos registrados</h4>
          <p>Registra tu primer vehículo para hacer seguimiento.</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map(v => {
            const order = getOrderForVehicle(v.id)
            return (
              <div key={v.id} className="vehicle-card" onClick={() => openDetail(v)}>
                <div className="vehicle-card-header">
                  <div>
                    <div className="vehicle-title">{v.brand} {v.model}</div>
                    <div className="vehicle-meta">{v.year} · {v.color || 'Sin color'}</div>
                  </div>
                  <span className="vehicle-plate">{v.plate}</span>
                </div>

                {order ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Estado actual</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <ProgressBar value={order.progress_pct} status={order.status} />
                    <div className="flex justify-between mt-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <span>Costo: {fmtMoney(order.total_cost)}</span>
                      {order.estimated_hours && <span>{order.estimated_hours}h est.</span>}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                    Sin orden activa en este momento
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal registrar vehículo */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Registrar Vehículo"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancelar</button>
            <button className="btn btn-primary" form="form-add-vehicle" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form id="form-add-vehicle" onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group">
              <label>Marca</label>
              <input type="text" className="form-control" placeholder="Toyota"
                value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Modelo</label>
              <input type="text" className="form-control" placeholder="Corolla"
                value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Año</label>
              <input type="number" className="form-control" placeholder="2020" min="1950" max="2027"
                value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Placa</label>
              <input type="text" className="form-control" placeholder="P-123456"
                value={form.plate} onChange={e => setForm(p => ({ ...p, plate: e.target.value.toUpperCase() }))} required />
            </div>
          </div>
          <div className="form-group">
            <label>Color</label>
            <input type="text" className="form-control" placeholder="Rojo"
              value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} />
          </div>
        </form>
      </Modal>

      {/* Modal detalle de vehículo */}
      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected ? `${selected.brand} ${selected.model} — ${selected.plate}` : ''}
        size="modal-lg"
        footer={<button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cerrar</button>}
      >
        {selected && (() => {
          const order = getOrderForVehicle(selected.id)
          return (
            <div className="detail-grid">
              <div>
                <p className="section-title">Datos del Vehículo</p>
                <div className="detail-field"><div className="field-label">Marca / Modelo</div><div className="field-value">{selected.brand} {selected.model}</div></div>
                <div className="detail-field"><div className="field-label">Año</div><div className="field-value">{selected.year}</div></div>
                <div className="detail-field"><div className="field-label">Placa</div><div className="field-value">{selected.plate}</div></div>
                <div className="detail-field"><div className="field-label">Color</div><div className="field-value">{selected.color || '—'}</div></div>

                {order && (
                  <>
                    <div className="divider" />
                    <p className="section-title">Orden Activa</p>
                    <div className="detail-field"><div className="field-label">Estado</div><div className="field-value"><StatusBadge status={order.status} /></div></div>
                    <div className="mt-3"><ProgressBar value={order.progress_pct} status={order.status} /></div>
                    <div className="detail-field mt-3"><div className="field-label">Horas estimadas</div><div className="field-value">{order.estimated_hours ? `${order.estimated_hours}h` : '—'}</div></div>
                    <div className="detail-field"><div className="field-label">Costo total</div><div className="field-value" style={{ fontWeight: 700, color: 'var(--blue-light)' }}>{fmtMoney(order.total_cost)}</div></div>
                    {order.notes && <div className="detail-field"><div className="field-label">Notas</div><div className="field-value">{order.notes}</div></div>}
                  </>
                )}
                {!order && (
                  <div className="form-success mt-3">Este vehículo no tiene una orden activa actualmente.</div>
                )}
              </div>

              {order && (
                <div>
                  <p className="section-title">Historial de Cambios</p>
                  {history.length === 0 ? (
                    <p className="text-muted text-sm">Sin historial registrado.</p>
                  ) : (
                    <div className="history-list">
                      {[...history].reverse().map(h => (
                        <div key={h.id} className="history-item">
                          <div className="history-dot" />
                          <div className="history-content">
                            <div className="history-comment">{h.comment || `Estado → ${h.new_status}`}</div>
                            <div className="history-meta">{fmt(h.created_at)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </>
  )
}
