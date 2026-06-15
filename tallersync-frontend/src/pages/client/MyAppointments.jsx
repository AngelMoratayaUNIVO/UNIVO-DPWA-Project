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

function toLocalInput(date) {
  if (!date) return ''
  const d = new Date(date)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export default function MyAppointments() {
  const [apts,     setApts]     = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [vehicleId, setVehicleId] = useState('')
  const [date,      setDate]     = useState('')
  const [notes,     setNotes]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [filter,   setFilter]   = useState('all')

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      api.get('/appointments'),
      api.get('/vehicles'),
    ]).then(([ap, ve]) => {
      setApts(ap.data.appointments || [])
      setVehicles(ve.data.vehicles || [])
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async e => {
    e.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/appointments', {
        vehicle_id:     vehicleId,
        requested_date: new Date(date).toISOString(),
        notes:          notes || undefined
      })
      setSuccess('¡Cita solicitada exitosamente! El taller la revisará pronto.')
      setVehicleId(''); setDate(''); setNotes('')
      setShowCreate(false)
      load()
    } catch (err) {
      setError(err.message || 'Error al solicitar cita')
    } finally {
      setSaving(false)
    }
  }

  const cancelApt = async id => {
    if (!confirm('¿Cancelar esta cita?')) return
    try {
      await api.put(`/appointments/${id}`, { status: 'rejected' })
      load()
    } catch (err) {
      alert(err.message || 'No se pudo cancelar')
    }
  }

  const filtered = filter === 'all' ? apts : apts.filter(a => a.status === filter)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mis Citas</h1>
          <p>Agenda y consulta el estado de tus citas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowCreate(true); setError(''); setSuccess('') }}>
          + Solicitar Cita
        </button>
      </div>

      {success && <div className="form-success mb-4">{success}</div>}

      <div className="flex gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
        {['all','pending','approved','rejected'].map(s => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Todas' : s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobadas' : 'Canceladas'}
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
              <p>No tienes citas registradas. ¡Solicita una!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Fecha Solicitada</th>
                  <th>Notas</th>
                  <th>Estado</th>
                  <th>Registrada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.vehicle?.brand} {a.vehicle?.model}</div>
                      <div className="td-muted">{a.vehicle?.plate}</div>
                    </td>
                    <td>{fmt(a.requested_date)}</td>
                    <td className="td-muted" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {a.notes || '—'}
                    </td>
                    <td><StatusBadge status={a.status} type="appointment" /></td>
                    <td className="td-muted">{fmt(a.created_at)}</td>
                    <td>
                      {a.status === 'pending' && (
                        <button className="btn btn-danger btn-sm" onClick={() => cancelApt(a.id)}>
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Solicitar Cita"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancelar</button>
            <button className="btn btn-primary" form="form-apt" type="submit" disabled={saving}>
              {saving ? 'Enviando...' : 'Solicitar Cita'}
            </button>
          </>
        }
      >
        {error && <div className="form-error">{error}</div>}
        <form id="form-apt" onSubmit={handleCreate}>
          <div className="form-group">
            <label>Vehículo</label>
            <select
              className="form-control"
              value={vehicleId}
              onChange={e => setVehicleId(e.target.value)}
              required
            >
              <option value="">Selecciona tu vehículo...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.plate}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha y Hora Deseada</label>
            <input
              type="datetime-local"
              className="form-control"
              value={date}
              min={toLocalInput(new Date())}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Motivo / Notas</label>
            <textarea
              className="form-control"
              placeholder="Describe el motivo de la cita..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </Modal>
    </>
  )
}
