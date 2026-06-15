import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import DevTools from './components/DevTools'

import Login    from './pages/auth/Login'
import Register from './pages/auth/Register'

import AdminDashboard  from './pages/admin/Dashboard'
import WorkOrders      from './pages/admin/WorkOrders'
import Vehicles        from './pages/admin/Vehicles'
import AdminApts       from './pages/admin/Appointments'
import AdminQuotes     from './pages/admin/Quotes'

import ClientDashboard from './pages/client/Dashboard'
import MyVehicles      from './pages/client/MyVehicles'
import MyAppointments  from './pages/client/MyAppointments'
import MyQuotes        from './pages/client/MyQuotes'

function LoadingScreen() {
  return (
    <div className="loading-page">
      <div className="spinner" />
      <span>Cargando TallerSync...</span>
    </div>
  )
}

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/cliente/dashboard'} replace />
  }
  return children
}

function AdminLayout({ children }) {
  return (
    <RequireAuth role="admin">
      <Layout>{children}</Layout>
    </RequireAuth>
  )
}

function ClientLayout({ children }) {
  return (
    <RequireAuth role="client">
      <Layout>{children}</Layout>
    </RequireAuth>
  )
}

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user)   return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/cliente/dashboard'} replace />
}

export default function App() {
  return (
    <>
    <Routes>
      {/* Raíz */}
      <Route path="/" element={<RootRedirect />} />

      {/* Auth */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin */}
      <Route path="/admin/dashboard"    element={<AdminLayout><AdminDashboard /></AdminLayout>} />
      <Route path="/admin/ordenes"      element={<AdminLayout><WorkOrders /></AdminLayout>} />
      <Route path="/admin/vehiculos"    element={<AdminLayout><Vehicles /></AdminLayout>} />
      <Route path="/admin/citas"        element={<AdminLayout><AdminApts /></AdminLayout>} />
      <Route path="/admin/cotizaciones" element={<AdminLayout><AdminQuotes /></AdminLayout>} />
      <Route path="/admin"              element={<Navigate to="/admin/dashboard" replace />} />

      {/* Cliente */}
      <Route path="/cliente/dashboard"    element={<ClientLayout><ClientDashboard /></ClientLayout>} />
      <Route path="/cliente/vehiculos"    element={<ClientLayout><MyVehicles /></ClientLayout>} />
      <Route path="/cliente/citas"        element={<ClientLayout><MyAppointments /></ClientLayout>} />
      <Route path="/cliente/cotizaciones" element={<ClientLayout><MyQuotes /></ClientLayout>} />
      <Route path="/cliente"              element={<Navigate to="/cliente/dashboard" replace />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    <DevTools />
    </>
  )
}
