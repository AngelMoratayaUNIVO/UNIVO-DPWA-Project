import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

function fmtMoney(val) { return `$${Number(val || 0).toFixed(2)}` }
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

const EMPTY_ITEM = { description: '', price: '' }

export default function Quotes() {
  const [quotes,  setQuotes]  = useState([])
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState(null)
  const [filter,  setFilter]  = useState('all')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  const [workOrderId, setWorkOrderId] = useState('')
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/quotes'),
      api.get('/work-orders'),
    ]).then(([q, wo]) => {
      setQuotes(q.data.quotes || [])
      setOrders((wo.data.orders || []).filter(o => o.status !== 'done'))
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const total = items.reduce((s, i) => s + (Number(i.price) || 0), 0)

  const addItem    = () => setItems(p => [...p, { ...EMPTY_ITEM }])
  const removeItem = idx => setItems(p => p.filter((_, i) => i !== idx))
  const updateItem = (idx, field, val) =>
    setItems(p => p.map((it, i) => i === idx ? { ...it, [field]: val } : it))

  const handleCreate = async e => {
    e.preventDefault()
    if (items.some(i => !i.description || !i.price)) {
      setError('Completa todos los ítems de la cotización')
      return
    }
    setSaving(true); setError('')
    try {
      const payload = {
        work_order_id: workOrderId,
        items: items.map(i => ({ description: i.description, price: Number(i.price) }))
      }
      const created = await api.post('/quotes', payload)
      // Enviar inmediatamente al cliente
      await api.put(`/quotes/${created.data.quote.id}`, { status: 'sent' })
      setShowCreate(false)
      setWorkOrderId('')
      setItems([{ ...EMPTY_ITEM }])
      load()
    } catch (err) {
      setError(err.message || 'Error al crear cotización')
    } finally {
      setSaving(false)
    }
  }

  const openDetail = q => {
    setSelected(q)
    setError('')
    setShowDetail(true)
  }

  const changeStatus = async status => {
    setSaving(true); setError('')
    try {
      await api.put(`/quotes/${selected.id}`, { status })
      load()
      setShowDetail(false)
    } catch (err) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Cotizaciones</h1>
          <p>Crea y gestiona cotizaciones para las órdenes de trabajo</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError('') }}>
          + Nueva Cotización
        </button>
      </div>

      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {['all','sent','approved','rejected'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'sent' ? 'Enviadas' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="icon-clipboard" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <h4>Sin cotizaciones</h4>
              <p>No hay cotizaciones para el filtro seleccionado.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Orden de Trabajo</th>
                  <th>Vehículo</th>
                  <th>Ítems</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(q => (
                  <tr key={q.id}>
                    <td className="td-muted" style={{ fontFamily: 'monospace', fontSize: 11 }}>
                      {q.work_order_id?.slice(0, 8)}…
                    </td>
                    <td>
                      <div>{q.work_order?.vehicle?.brand} {q.work_order?.vehicle?.model}</div>
                      <div className="td-muted">{q.work_order?.vehicle?.plate}</div>
                    </td>
                    <td className="td-muted">{(q.items || []).length} ítem(s)</td>
                    <td style={{ fontWeight: 600, color: 'var(--blue-light)' }}>{fmtMoney(q.total)}</td>
                    <td><StatusBadge status={q.status} type="quote" /></td>
                    <td className="td-muted">{fmt(q.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(q)}>Ver detalle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal crear cotización */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva Cotización"
        size="modal-lg"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
            <button className="btn btn-primary" form="form-quote" type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Crear y Enviar'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form id="form-quote" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Orden de Trabajo</label>
            <select
              className="form-control"
              value={workOrderId}
              onChange={e => setWorkOrderId(e.target.value)}
              required
            >
              <option value="">Selecciona una orden activa...</option>
              {orders.map(o => (
                <option key={o.id} value={o.id}>
                  {o.vehicle?.brand} {o.vehicle?.model} ({o.vehicle?.plate}) — {o.status}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Ítems / Servicios</span>
              <button type="button" className="btn btn-ghost btn-xs" onClick={addItem}>+ Agregar ítem</button>
            </label>
            <div className="quote-items-list">
              {items.map((item, idx) => (
                <div key={idx} className="quote-item-row">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Descripción del servicio..."
                    value={item.description}
                    onChange={e => updateItem(idx, 'description', e.target.value)}
                    required
                  />
                  <div className="input-with-prefix" style={{ width: 130 }}>
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      placeholder="0.00"
                      value={item.price}
                      onChange={e => updateItem(idx, 'price', e.target.value)}
                      required
                    />
                  </div>
                  {items.length > 1 && (
                    <button type="button" className="btn btn-danger btn-xs" onClick={() => removeItem(idx)}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="quote-total">
              <span>Total Estimado</span>
              <span className="quote-total-amount">{fmtMoney(total)}</span>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal detalle */}
      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title="Detalle de Cotización"
        footer={
          <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cerrar</button>
        }
      >
        {selected && (
          <>
            {error && <div className="form-error">{error}</div>}
            <div className="detail-field">
              <div className="field-label">Vehículo</div>
              <div className="field-value">
                {selected.work_order?.vehicle?.brand} {selected.work_order?.vehicle?.model} — {selected.work_order?.vehicle?.plate}
              </div>
            </div>
            <div className="detail-field">
              <div className="field-label">Estado</div>
              <div className="field-value"><StatusBadge status={selected.status} type="quote" /></div>
            </div>
            <div className="detail-field">
              <div className="field-label">Fecha</div>
              <div className="field-value">{fmt(selected.created_at)}</div>
            </div>

            <div className="divider" />
            <p className="section-title">Ítems</p>
            <div className="quote-items-list">
              {(selected.items || []).map((item, i) => (
                <div key={i} className="quote-item-row">
                  <span style={{ fontSize: 13 }}>{item.description}</span>
                  <span />
                  <span style={{ fontWeight: 600, color: 'var(--blue-light)' }}>{fmtMoney(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="quote-total">
              <span>Total</span>
              <span className="quote-total-amount">{fmtMoney(selected.total)}</span>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
