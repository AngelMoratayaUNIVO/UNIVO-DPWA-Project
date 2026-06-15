import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icon from './Icon'

const ADMIN_NAV = [
  { to: '/admin/dashboard',    icon: 'icon-layout-dashboard', label: 'Panel Principal' },
  { to: '/admin/ordenes',      icon: 'icon-wrench',           label: 'Órdenes de Trabajo' },
  { to: '/admin/vehiculos',    icon: 'icon-car',              label: 'Vehículos' },
  { to: '/admin/citas',        icon: 'icon-calendar',         label: 'Citas' },
  { to: '/admin/cotizaciones', icon: 'icon-clipboard',        label: 'Cotizaciones' },
]

const CLIENT_NAV = [
  { to: '/cliente/dashboard',    icon: 'icon-home',      label: 'Mi Panel' },
  { to: '/cliente/vehiculos',    icon: 'icon-car',       label: 'Mis Vehículos' },
  { to: '/cliente/citas',        icon: 'icon-calendar',  label: 'Mis Citas' },
  { to: '/cliente/cotizaciones', icon: 'icon-clipboard', label: 'Mis Cotizaciones' },
]

const PAGE_TITLES = {
  '/admin/dashboard':    'Panel Principal',
  '/admin/ordenes':      'Órdenes de Trabajo',
  '/admin/vehiculos':    'Gestión de Vehículos',
  '/admin/citas':        'Gestión de Citas',
  '/admin/cotizaciones': 'Cotizaciones',
  '/cliente/dashboard':    'Mi Panel',
  '/cliente/vehiculos':    'Mis Vehículos',
  '/cliente/citas':        'Mis Citas',
  '/cliente/cotizaciones': 'Mis Cotizaciones',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = user?.role === 'admin' ? ADMIN_NAV : CLIENT_NAV
  const pageTitle = PAGE_TITLES[location.pathname] || 'TallerSync'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <Icon name="icon-wrench" size={20} />
          </div>
          <div className="sidebar-logo-text">
            <h2>TallerSync</h2>
            <span>{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menú</div>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <Icon name={item.icon} size={16} className="nav-item-icon" style={{ opacity: 0.75 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(user?.full_name)}</div>
            <div className="user-details">
              <span className="user-name">{user?.full_name}</span>
              <span className="user-role">{user?.email}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <Icon name="icon-log-out" size={13} style={{ marginRight: 6 }} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{pageTitle}</span>
          <div className="topbar-right">
            <span className={`badge badge-${user?.role}`}>
              {user?.role === 'admin' ? 'Admin' : 'Cliente'}
            </span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  )
}
