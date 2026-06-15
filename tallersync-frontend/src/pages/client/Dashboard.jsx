import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/client'
import StatusBadge from '../../components/StatusBadge'
import ProgressBar from '../../components/ProgressBar'
import Icon from '../../components/Icon'

function fmtMoney(val) { return `$${Number(val || 0).toFixed(2)}` }
function fmt(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ClientDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders,  setOrders]  = useState([])
  const [apts,    setApts]    = useState([])
  const [quotes,  setQuotes]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/work-orders'),
      api.get('/appointments'),
      api.get('/quotes'),
    ]).then(([wo, ap, q]) => {
      setOrders(wo.data.orders || [])
      setApts(ap.data.appointments || [])
      setQuotes(q.data.quotes || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  const active   = orders.filter(o => o.status !== 'done')
  const done     = orders.filter(o => o.status === 'done').length
  const pendApts = apts.filter(a => a.status === 'pending').length
  const pendQ    = quotes.filter(q => q.status === 'sent').length

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>Bienvenido, {user?.full_name?.split(' ')[0]}</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Aquí puedes ver el estado de tus vehículos</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--accent': 'var(--blue-primary)' }}>
          <span className="stat-label">Órdenes Activas</span>
          <span className="stat-value">{active.length}</span>
          <span className="stat-sub">Vehículos en taller</span>
          <Icon name="icon-settings-2" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--status-done)' }}>
          <span className="stat-label">Finalizadas</span>
          <span className="stat-value">{done}</span>
          <span className="stat-sub">Vehículos entregados</span>
          <Icon name="icon-circle-check" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--status-pending)' }}>
          <span className="stat-label">Citas Pendientes</span>
          <span className="stat-value">{pendApts}</span>
          <span className="stat-sub">En espera de respuesta</span>
          <Icon name="icon-calendar" size={32} className="stat-icon" />
        </div>
        <div className="stat-card" style={{ '--accent': 'var(--blue-light)' }}>
          <span className="stat-label">Cotizaciones por Revisar</span>
          <span className="stat-value">{pendQ}</span>
          <span className="stat-sub">Requieren tu aprobación</span>
          <Icon name="icon-clipboard" size={32} className="stat-icon" />
        </div>
      </div>

      {/* Órdenes activas */}
      {active.length > 0 && (
        <div className="card mb-4">
          <div className="card-header">
            <h3>Mis Vehículos en Taller</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cliente/vehiculos')}>
              Ver todos
            </button>
          </div>
          <div style={{ padding: '12px 0' }}>
            {active.map(o => (
              <div
                key={o.id}
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/cliente/vehiculos')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {o.vehicle?.brand} {o.vehicle?.model} {o.vehicle?.year}
                    </div>
                    <div className="td-muted">{o.vehicle?.plate} · {o.vehicle?.color}</div>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <ProgressBar value={o.progress_pct} status={o.status} />
                <div className="flex justify-between mt-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span>Ingreso: {fmt(o.created_at)}</span>
                  {o.estimated_hours && <span>Tiempo estimado: {o.estimated_hours}h</span>}
                  <span style={{ fontWeight: 600, color: 'var(--blue-light)' }}>
                    Costo: {fmtMoney(o.total_cost)}
                  </span>
                </div>
                {o.notes && (
                  <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Notas: {o.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cotizaciones pendientes */}
      {pendQ > 0 && (
        <div className="card" style={{ borderColor: 'rgba(100,181,246,0.3)' }}>
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="icon-triangle-alert" size={16} />
              Cotizaciones por Aprobar
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/cliente/cotizaciones')}>
              Ver cotizaciones
            </button>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Tienes {pendQ} cotización(es) enviadas por el taller que requieren tu aprobación o rechazo.
            </p>
          </div>
        </div>
      )}

      {active.length === 0 && pendQ === 0 && (
        <div className="empty-state">
          <Icon name="icon-car" size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <h4>Todo al día</h4>
          <p>No tienes vehículos actualmente en el taller.</p>
        </div>
      )}
    </>
  )
}
