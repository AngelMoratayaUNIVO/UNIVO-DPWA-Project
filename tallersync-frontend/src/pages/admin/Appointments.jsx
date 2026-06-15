import { useState, useEffect, useCallback } from 'react'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleString('es-SV', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export default function Appointments() {
  const [apts,    setApts]    = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    api.get('/appointments')
      .then(res => setApts(res.data.appointments || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const openDetail = apt => {
    setSelected(apt)
    setError('')
    setShowDetail(true)
  }

  const changeStatus = async status => {
    setSaving(true); setError('')
    try {
      await api.put(`/appointments/${selected.id}`, { status })
      load()
      setShowDetail(false)
    } catch (err) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('¿Eliminar esta cita?')) return
    try {
      await api.delete(`/appointments/${id}`)
      load()
    } catch (err) {
      alert(err.message || 'No se pudo eliminar')
    }
  }

  const filtered = filter === 'all' ? apts : apts.filter(a => a.status === filter)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Gestión de Citas</h1>
          <p>Aprueba, rechaza y administra las citas solicitadas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {['all','pending','approved','rejected'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="table-wrapper">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <Icon name="icon-calendar" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
              <h4>Sin citas</h4>
              <p>No hay citas para el filtro seleccionado.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Fecha Solicitada</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.client?.full_name || '—'}</div>
                      <div className="td-muted">{a.client?.email}</div>
                    </td>
                    <td>
                      <div>{a.vehicle?.brand} {a.vehicle?.model}</div>
                      <div className="td-muted">{a.vehicle?.plate}</div>
                    </td>
                    <td>{fmt(a.requested_date)}</td>
                    <td className="td-muted" style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.notes || '—'}
                    </td>
                    <td><StatusBadge status={a.status} type="appointment" /></td>
                    <td className="td-muted">{fmt(a.created_at)}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => openDetail(a)}>Gestionar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.id)}>Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal detalle */}
      <Modal
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title="Gestionar Cita"
        footer={
          selected?.status === 'pending' ? (
            <>
              <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cerrar</button>
              <button className="btn btn-danger" onClick={() => changeStatus('rejected')} disabled={saving}>
                Rechazar
              </button>
              <button className="btn btn-success" onClick={() => changeStatus('approved')} disabled={saving}>
                Aprobar
              </button>
            </>
          ) : (
            <button className="btn btn-ghost" onClick={() => setShowDetail(false)}>Cerrar</button>
          )
        }
      >
        {selected && (
          <>
            {error && <div className="form-error">{error}</div>}
            <div className="detail-field">
              <div className="field-label">Cliente</div>
              <div className="field-value">{selected.client?.full_name} — {selected.client?.email}</div>
            </div>
            <div className="detail-field">
              <div className="field-label">Vehículo</div>
              <div className="field-value">
                {selected.vehicle?.brand} {selected.vehicle?.model} {selected.vehicle?.year} — {selected.vehicle?.plate}
              </div>
            </div>
            <div className="detail-field">
              <div className="field-label">Fecha Solicitada</div>
              <div className="field-value">{fmt(selected.requested_date)}</div>
            </div>
            <div className="detail-field">
              <div className="field-label">Estado</div>
              <div className="field-value"><StatusBadge status={selected.status} type="appointment" /></div>
            </div>
            {selected.notes && (
              <div className="detail-field">
                <div className="field-label">Notas del Cliente</div>
                <div className="field-value">{selected.notes}</div>
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="form-success mt-3">
                Esta cita está pendiente de aprobación. Usa los botones para aprobar o rechazar.
              </div>
            )}
          </>
        )}
      </Modal>
    </>
  )
}
