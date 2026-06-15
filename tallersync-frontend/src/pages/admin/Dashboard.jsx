import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'
import Modal from '../../components/Modal'
import Icon from '../../components/Icon'

const EMPTY_ADMIN = { full_name: '', email: '', phone: '', password: '' }

function CreateAdminModal({ open, onClose }) {
  const [form, setForm] = useState(EMPTY_ADMIN)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const [success, setSuccess] = useState('')

  const reset = () => { setForm(EMPTY_ADMIN); setError(''); setSuccess('') }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setSaving(true); setError(''); setSuccess('')
    try {
      await api.post('/auth/register', { ...form, role: 'admin' })
      setSuccess(`Administrador "${form.full_name}" creado exitosamente.`)
      setForm(EMPTY_ADMIN)
    } catch (err) {
      setError(err.message || 'Error al crear administrador')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Crear Cuenta de Administrador"
      footer={
        <>
          <button className="btn btn-ghost" onClick={handleClose}>Cerrar</button>
          {!success && (
            <button className="btn btn-primary" form="form-create-admin" type="submit" disabled={saving}>
              {saving ? 'Creando...' : 'Crear Administrador'}
            </button>
          )}
        </>
      }
    >
      {error   && <div className="form-error">{error}</div>}
      {success && <div className="form-success">{success}</div>}
      {!success && (
        <form id="form-create-admin" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input type="text" className="form-control" placeholder="Nombre del técnico/administrador"
              value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input type="email" className="form-control" placeholder="admin@taller.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" className="form-control" placeholder="7777-7777"
                value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
          </div>
          <div className="form-group">
            <label>Contraseña Temporal</label>
            <input type="password" className="form-control" placeholder="Mínimo 6 caracteres"
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          </div>
        </form>
      )}
    </Modal>
  )
}

function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtMoney(val) {
  return `$${Number(val || 0).toFixed(2)}`
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [orders, setOrders]   = useState([])
  const [apts, setApts]       = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateAdmin, setShowCreateAdmin] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/work-orders'),
      api.get('/appointments'),
      api.get('/vehicles'),
    ]).then(([wo, ap, ve]) => {
      setOrders(wo.data.orders || [])
      setApts(ap.data.appointments || [])
      setVehicles(ve.data.vehicles || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="spinner-wrap"><div className="spinner" /></div>
  )

  const statOrders   = orders.length
  const inProgress   = orders.filter(o => !['done','waiting'].includes(o.status)).length
  const done         = orders.filter(o => o.status === 'done').length
  const pending_apts = apts.filter(a => a.status === 'pending').length
  const recent       = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
  const pendingApts  = apts.filter(a => a.status === 'pending').slice(0, 5)

  return (
    <>
      <CreateAdminModal open={showCreateAdmin} onClose={() => setShowCreateAdmin(false)} />

      {/* Barra de acciones */}
      <div className="flex justify-between items-center mb-6">
        <div />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowCreateAdmin(true)}
          title="Crear una nueva cuenta de administrador para el taller"
        >
          <Icon name="icon-user-plus" size={14} style={{ marginRight: 6 }} />
          Crear Administrador
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': 'var(--blue-primary)' }}>
          <span className="stat-label">Órdenes Totales</span>
          <span className="stat-value">{statOrders}</span>
          <span className="stat-sub">En el sistema</span>
          <Icon name="icon-wrench" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--status-diagnosis)' }}>
          <span className="stat-label">En Proceso</span>
          <span className="stat-value">{inProgress}</span>
          <span className="stat-sub">Actualmente en taller</span>
          <Icon name="icon-settings-2" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--status-done)' }}>
          <span className="stat-label">Completadas</span>
          <span className="stat-value">{done}</span>
          <span className="stat-sub">Vehículos entregados</span>
          <Icon name="icon-circle-check" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--status-pending)' }}>
          <span className="stat-label">Citas Pendientes</span>
          <span className="stat-value">{pending_apts}</span>
          <span className="stat-sub">Por aprobar</span>
          <Icon name="icon-calendar" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--blue-light)' }}>
          <span className="stat-label">Vehículos Registrados</span>
          <span className="stat-value">{vehicles.length}</span>
          <span className="stat-sub">Total en sistema</span>
          <Icon name="icon-car" size={32} className="stat-icon" />
        </div>
      </div>

      <div className="detail-grid">
        {/* Órdenes recientes */}
        <div className="card">
          <div className="card-header">
            <h3>Órdenes Recientes</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/ordenes')}>
              Ver todas
            </button>
          </div>
          <div className="table-wrapper">
            {recent.length === 0 ? (
              <div className="empty-state">
                <Icon name="icon-clipboard" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
                <h4>Sin órdenes</h4>
                <p>No hay órdenes de trabajo registradas.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vehículo</th>
                    <th>Estado</th>
                    <th>Progreso</th>
                    <th>Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(o => (
                    <tr
                      key={o.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate('/admin/ordenes')}
                    >
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {o.vehicle?.brand} {o.vehicle?.model}
                        </div>
                        <div className="td-muted">{o.vehicle?.plate}</div>
                      </td>
                      <td><StatusBadge status={o.status} /></td>
                      <td style={{ width: 120 }}>
                        <ProgressBar value={o.progress_pct} showLabel={false} status={o.status} />
                        <span className="text-sm text-muted">{o.progress_pct}%</span>
                      </td>
                      <td>{fmtMoney(o.total_cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Citas pendientes */}
        <div className="card">
          <div className="card-header">
            <h3>Citas por Aprobar</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/admin/citas')}>
              Ver todas
            </button>
          </div>
          <div className="table-wrapper">
            {pendingApts.length === 0 ? (
              <div className="empty-state">
                <Icon name="icon-calendar" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
                <h4>Sin citas pendientes</h4>
                <p>Todas las citas han sido procesadas.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Fecha solicitada</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApts.map(a => (
                    <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/citas')}>
                      <td>{a.client?.full_name || '—'}</td>
                      <td className="td-muted">{a.vehicle?.brand} {a.vehicle?.model}</td>
                      <td className="td-muted">{fmt(a.requested_date)}</td>
                      <td><StatusBadge status={a.status} type="appointment" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
