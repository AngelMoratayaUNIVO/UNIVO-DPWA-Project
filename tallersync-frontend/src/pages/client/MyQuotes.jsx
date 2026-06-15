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

export default function MyQuotes() {
  const [quotes,  setQuotes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/quotes')
      .then(res => setQuotes(res.data.quotes || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = q => {
    setSelected(q)
    setError('')
    setShowDetail(true)
  }

  const respond = async status => {
    setSaving(true); setError('')
    try {
      await api.put(`/quotes/${selected.id}`, { status })
      load()
      setShowDetail(false)
    } catch (err) {
      setError(err.message || 'Error al responder')
    } finally {
      setSaving(false)
    }
  }

  const filtered = filter === 'all' ? quotes : quotes.filter(q => q.status === filter)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mis Cotizaciones</h1>
          <p>Revisa y aprueba las cotizaciones del taller</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {['all','sent','approved','rejected'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'sent' ? 'Por Revisar' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
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
              <p>El taller aún no ha enviado cotizaciones para tus vehículos.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
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
                  <tr key={q.id} style={q.status === 'sent' ? { background: 'rgba(100,181,246,0.04)' } : {}}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {q.work_order?.vehicle?.brand} {q.work_order?.vehicle?.model}
                      </div>
                      <div className="td-muted">{q.work_order?.vehicle?.plate}</div>
                    </td>
                    <td className="td-muted">{(q.items || []).length} ítem(s)</td>
                    <td style={{ fontWeight: 700, color: 'var(--blue-light)' }}>{fmtMoney(q.total)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={q.status} type="quote" />
                        {q.status === 'sent' && (
                          <span style={{ fontSize: 10, color: 'var(--status-pending)', fontWeight: 600 }}>
                            REQUIERE ACCIÓN
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="td-muted">{fmt(q.created_at)}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openDetail(q)}>
                        {q.status === 'sent' ? 'Revisar' : 'Ver detalle'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title="Cotización del Taller"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cerrar</button>
            {selected?.status === 'sent' && (
              <>
                <button className="btn btn-danger" onClick={() => respond('rejected')} disabled={saving}>
                  Rechazar
                </button>
                <button className="btn btn-success" onClick={() => respond('approved')} disabled={saving}>
                  Aprobar
                </button>
              </>
            )}
          </>
        }
      >
        {selected && (
          <>
            {error && <div className="form-error">{error}</div>}

            {selected.status === 'sent' && (
              <div style={{
                background: 'rgba(100,181,246,0.1)',
                border: '1px solid rgba(100,181,246,0.3)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
                fontSize: 13,
                color: 'var(--blue-light)'
              }}>
                El taller ha enviado esta cotización para tu aprobación.
                Revisa los detalles y decide si aceptas o rechazas.
              </div>
            )}

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
            <p className="section-title">Servicios y Costos</p>
            <div className="quote-items-list">
              {(selected.items || []).map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 13
                }}>
                  <span>{item.description}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fmtMoney(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="quote-total">
              <span style={{ fontWeight: 700 }}>Total a Pagar</span>
              <span className="quote-total-amount" style={{ fontSize: 22 }}>{fmtMoney(selected.total)}</span>
            </div>
          </>
        )}
      </Modal>
    </>
  )
}
