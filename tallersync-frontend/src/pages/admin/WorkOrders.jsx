import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(val) {
  return `$${Number(val || 0).toFixed(2)}`
}

const STATUS_OPTS = [
  { value: 'waiting',   label: 'En Espera' },
  { value: 'diagnosis', label: 'Diagnóstico' },
  { value: 'repair',    label: 'En Reparación' },
  { value: 'testing',   label: 'En Pruebas' },
  { value: 'done',      label: 'Finalizado' },
]

const EMPTY_CREATE = { vehicle_id: '', estimated_hours: '', notes: '' }
const EMPTY_UPDATE = { status: 'waiting', progress_pct: 0, total_cost: '' }

export default function WorkOrders() {
  const [orders,   setOrders]   = useState([])
  const [vehicles, setVehicles] = useState([])
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)

  const [showCreate,  setShowCreate]  = useState(false)
  const [showDetail,  setShowDetail]  = useState(false)
  const [createForm,  setCreateForm]  = useState(EMPTY_CREATE)
  const [updateForm,  setUpdateForm]  = useState(EMPTY_UPDATE)
  const [comment,     setComment]     = useState('')
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/work-orders'),
      api.get('/vehicles'),
    ]).then(([wo, ve]) => {
      setOrders(wo.data.orders || [])
      setVehicles(ve.data.vehicles || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = async order => {
    setSelected(order)
    setUpdateForm({
      status:       order.status,
      progress_pct: order.progress_pct,
      total_cost:   order.total_cost || '',
    })
    setComment('')
    setError('')
    const hist = await api.get(`/work-orders/${order.id}/history`)
    setHistory(hist.data.history || [])
    setShowDetail(true)
  }

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.post('/work-orders', {
        vehicle_id:      createForm.vehicle_id,
        estimated_hours: createForm.estimated_hours ? Number(createForm.estimated_hours) : undefined,
        notes:           createForm.notes || undefined
      })
      setShowCreate(false)
      setCreateForm(EMPTY_CREATE)
      load()
    } catch (err) {
      setError(err.message || 'Error al crear la orden')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async e => {
    e.preventDefault()
    setSaving(true); setError('')
    try {
      await api.put(`/work-orders/${selected.id}`, {
        status:       updateForm.status,
        progress_pct: Number(updateForm.progress_pct),
        total_cost:   updateForm.total_cost ? Number(updateForm.total_cost) : undefined,
      })
      load()
      const updated = await api.get(`/work-orders/${selected.id}`)
      setSelected(updated.data.order)
      const hist = await api.get(`/work-orders/${selected.id}/history`)
      setHistory(hist.data.history || [])
    } catch (err) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleComment = async e => {
    e.preventDefault()
    if (!comment.trim()) return
    setSaving(true)
    try {
      await api.post(`/work-orders/${selected.id}/comments`, { comment })
      setComment('')
      const hist = await api.get(`/work-orders/${selected.id}/history`)
      setHistory(hist.data.history || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const filtered = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Órdenes de Trabajo</h1>
          <p>Gestiona y monitorea el progreso de los vehículos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError('') }}>
          + Nueva Orden
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {[{ value: 'all', label: 'Todas' }, ...STATUS_OPTS].map(s => (
          <button
            key={s.value}
            className={`btn btn-sm ${filterStatus === s.value ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilterStatus(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="icon-wrench" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <h4>Sin órdenes</h4>
              <p>No hay órdenes de trabajo para el filtro seleccionado.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Progreso</th>
                  <th>Horas Est.</th>
                  <th>Costo Total</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.vehicle?.brand} {o.vehicle?.model} {o.vehicle?.year}</div>
                      <div className="td-muted">{o.vehicle?.plate}</div>
                    </td>
                    <td>{o.vehicle?.owner?.full_name || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td style={{ width: 140 }}>
                      <ProgressBar value={o.progress_pct} status={o.status} />
                    </td>
                    <td className="td-muted">{o.estimated_hours ? `${o.estimated_hours}h` : '—'}</td>
                    <td>{fmtMoney(o.total_cost)}</td>
                    <td className="td-muted">{fmt(o.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(o)}>
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear orden */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva Orden de Trabajo"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
            <button className="btn btn-primary" form="form-create-order" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear Orden'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form id="form-create-order" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Vehículo</label>
            <select
              className="form-control"
              value={createForm.vehicle_id}
              onChange={e => setCreateForm(p => ({ ...p, vehicle_id: e.target.value }))}
              required
            >
              <option value="">Selecciona un vehículo...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} {v.year} — {v.plate} ({v.owner?.full_name})
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Horas Estimadas</label>
            <input
              type="number"
              step="0.5"
              min="0"
              className="form-control"
              placeholder="Ej: 4.5"
              value={createForm.estimated_hours}
              onChange={e => setCreateForm(p => ({ ...p, estimated_hours: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <label>Notas de Ingreso</label>
            <textarea
              className="form-control"
              placeholder="Descripción del problema reportado..."
              value={createForm.notes}
              onChange={e => setCreateForm(p => ({ ...p, notes: e.target.value }))}
            />
          </div>
        </form>
      </Modal>

      {/* Modal detalle / editar */}
      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={selected ? `Orden — ${selected.vehicle?.brand} ${selected.vehicle?.model} (${selected.vehicle?.plate})` : ''}
        size="modal-lg"
      >
        {selected && (
          <>
            {error && <div className="form-error">{error}</div>}

            <div className="detail-grid">
              {/* Info del vehículo */}
              <div>
                <p className="section-title">Información del Vehículo</p>
                <div className="detail-field">
                  <div className="field-label">Vehículo</div>
                  <div className="field-value">{selected.vehicle?.brand} {selected.vehicle?.model} {selected.vehicle?.year}</div>
                </div>
                <div className="detail-field">
                  <div className="field-label">Placa</div>
                  <div className="field-value">{selected.vehicle?.plate}</div>
                </div>
                <div className="detail-field">
                  <div className="field-label">Propietario</div>
                  <div className="field-value">{selected.vehicle?.owner?.full_name || '—'}</div>
                </div>
                <div className="detail-field">
                  <div className="field-label">Estado Actual</div>
                  <div className="field-value"><StatusBadge status={selected.status} /></div>
                </div>
                <div className="mt-3">
                  <ProgressBar value={selected.progress_pct} status={selected.status} />
                </div>

                <div className="divider" />

                <p className="section-title">Actualizar Orden</p>
                <form onSubmit={handleUpdate}>
                  <div className="form-group">
                    <label>Estado</label>
                    <select
                      className="form-control"
                      value={updateForm.status}
                      onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))}
                    >
                      {STATUS_OPTS.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Progreso: {updateForm.progress_pct}%</label>
                    <input
                      type="range"
                      className="range-input"
                      min="0"
                      max="100"
                      value={updateForm.progress_pct}
                      onChange={e => setUpdateForm(p => ({ ...p, progress_pct: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Costo Total</label>
                    <div className="input-with-prefix">
                      <span className="input-prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-control"
                        placeholder="0.00"
                        value={updateForm.total_cost}
                        onChange={e => setUpdateForm(p => ({ ...p, total_cost: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </form>
              </div>

              {/* Historial */}
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
                          <div className="history-meta">
                            {h.changed_by_user?.full_name || 'Sistema'} ·{' '}
                            {new Date(h.created_at).toLocaleString('es-SV')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="divider" />

                <p className="section-title">Agregar Nota</p>
                <form onSubmit={handleComment} className="flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Escribe una nota..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    required
                  />
                  <button type="submit" className="btn btn-ghost btn-sm" disabled={saving}>
                    Agregar
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
