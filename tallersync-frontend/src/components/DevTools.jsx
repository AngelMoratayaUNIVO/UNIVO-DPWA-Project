import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/client'

const PRESETS = [
  { label: 'Admin',   email: 'admin@tallersync.com',   password: 'admin123',   role: 'admin',  color: '#58a6ff' },
  { label: 'Cliente', email: 'cliente@tallersync.com', password: 'cliente123', role: 'client', color: '#3fb950' },
]

const S = {
  wrap:    { position: 'fixed', bottom: 20, right: 20, zIndex: 9999, fontFamily: 'Inter, monospace', fontSize: 12 },
  panel:   { background: '#0d1117', border: '1px solid #30363d', borderRadius: 10, width: 290, marginBottom: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.7)', overflow: 'hidden' },
  head:    { background: '#161b22', padding: '10px 14px', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  body:    { padding: 14 },
  section: { color: '#8b949e', fontSize: 10, marginBottom: 6, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  box:     { background: '#161b22', border: '1px solid #30363d', borderRadius: 6, padding: '8px 10px', marginBottom: 12, fontSize: 11 },
  input:   { background: '#0d1117', border: '1px solid #30363d', borderRadius: 5, padding: '6px 8px', color: '#e6edf3', fontSize: 11, outline: 'none', width: '100%' },
  btnBase: { padding: '6px 0', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, border: '1px solid transparent', transition: 'opacity 0.15s', width: '100%' },
  pill:    { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 20, color: '#58a6ff', cursor: 'pointer', fontSize: 12, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '0.04em', transition: 'background 0.15s' },
}

export default function DevTools() {
  const { user, login, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(null)  // 'admin' | 'client' | 'custom' | 'create_admin' | 'create_client'
  const [msg, setMsg]         = useState({ text: '', ok: true })
  const [custom, setCustom]   = useState({ email: '', password: '' })

  const showMsg = (text, ok = true) => setMsg({ text, ok })

  const quickLogin = async (email, password, key) => {
    setLoading(key); setMsg({ text: '', ok: true })
    try {
      const u = await login(email, password)
      showMsg(`✓ Sesión iniciada como ${u.role}`)
      navigate(u.role === 'admin' ? '/admin/dashboard' : '/cliente/dashboard')
    } catch (err) {
      showMsg(`✗ ${err.message || 'Error'}`, false)
    } finally {
      setLoading(null)
    }
  }

  // Crea la cuenta de prueba si no existe, luego hace login
  const createAndLogin = async (preset) => {
    const key = `create_${preset.role}`
    setLoading(key); setMsg({ text: '', ok: true })
    try {
      // Intentar registrar primero (falla silenciosamente si ya existe)
      try {
        await api.post('/auth/register', {
          full_name: preset.role === 'admin' ? 'Admin Test' : 'Cliente Test',
          email:    preset.email,
          password: preset.password,
          role:     preset.role,
        })
      } catch {
        // Ya existe → continúa con el login
      }
      const u = await login(preset.email, preset.password)
      showMsg(`✓ Cuenta lista. Sesión como ${u.role}`)
      navigate(u.role === 'admin' ? '/admin/dashboard' : '/cliente/dashboard')
    } catch (err) {
      showMsg(`✗ ${err.message || 'Error al crear cuenta'}`, false)
    } finally {
      setLoading(null)
    }
  }

  const handleCustomLogin = async e => {
    e.preventDefault()
    await quickLogin(custom.email, custom.password, 'custom')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    showMsg('Sesión cerrada')
  }

  const isLoading = key => loading === key

  return (
    <div style={S.wrap}>
      {open && (
        <div style={S.panel}>
          {/* Header */}
          <div style={S.head}>
            <span style={{ fontWeight: 700, color: '#58a6ff', letterSpacing: '0.02em' }}>DEV TOOLS</span>
            <span style={{ color: '#8b949e', fontSize: 10 }}>{import.meta.env.MODE}</span>
          </div>

          <div style={S.body}>
            {/* Sesión actual */}
            <div style={{ ...S.box, marginBottom: 12 }}>
              <div style={{ color: '#8b949e', marginBottom: 4, fontSize: 10, fontWeight: 700 }}>SESIÓN ACTUAL</div>
              {user ? (
                <>
                  <span style={{ color: user.role === 'admin' ? '#58a6ff' : '#3fb950', fontWeight: 700 }}>
                    [{user.role.toUpperCase()}]
                  </span>{' '}
                  <span style={{ color: '#e6edf3' }}>{user.full_name}</span>
                  <div style={{ color: '#8b949e', marginTop: 2 }}>{user.email}</div>
                </>
              ) : (
                <span style={{ color: '#8b949e' }}>Sin sesión activa</span>
              )}
            </div>

            {/* Cuentas de prueba */}
            <div style={{ marginBottom: 12 }}>
              <div style={S.section}>Cuentas de Prueba</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                {PRESETS.map(p => (
                  <button
                    key={p.role}
                    disabled={!!loading}
                    onClick={() => quickLogin(p.email, p.password, p.role)}
                    style={{
                      ...S.btnBase,
                      background: `${p.color}14`,
                      borderColor: `${p.color}40`,
                      color: p.color,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {isLoading(p.role) ? '...' : ''} {p.label}
                  </button>
                ))}
              </div>
              {/* Crear + login si la cuenta no existe */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PRESETS.map(p => (
                  <button
                    key={`create-${p.role}`}
                    disabled={!!loading}
                    onClick={() => createAndLogin(p)}
                    style={{
                      ...S.btnBase,
                      background: '#21262d',
                      borderColor: '#30363d',
                      color: '#8b949e',
                      fontSize: 10,
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {isLoading(`create_${p.role}`) ? '...' : '+'} Crear {p.label}
                  </button>
                ))}
              </div>
              <div style={{ color: '#484f58', fontSize: 10, marginTop: 6, lineHeight: 1.4 }}>
                Si la cuenta no existe, "Crear" la registra y hace login automáticamente.
              </div>
            </div>

            {/* Login personalizado */}
            <div style={{ marginBottom: 12 }}>
              <div style={S.section}>Login Personalizado</div>
              <form onSubmit={handleCustomLogin} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={custom.email}
                  onChange={e => setCustom(p => ({ ...p, email: e.target.value }))}
                  style={S.input}
                  required
                />
                <input
                  type="password"
                  placeholder="contraseña"
                  value={custom.password}
                  onChange={e => setCustom(p => ({ ...p, password: e.target.value }))}
                  style={S.input}
                  required
                />
                <button
                  type="submit"
                  disabled={!!loading}
                  style={{ ...S.btnBase, background: '#21262d', borderColor: '#30363d', color: '#e6edf3', opacity: loading ? 0.6 : 1 }}
                >
                  {isLoading('custom') ? 'Ingresando...' : 'Ingresar →'}
                </button>
              </form>
            </div>

            {/* Navegación */}
            <div style={{ marginBottom: 12 }}>
              <div style={S.section}>Navegación Rápida</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                {[
                  { label: 'Panel Admin',   path: '/admin/dashboard' },
                  { label: 'Órdenes',       path: '/admin/ordenes' },
                  { label: 'Vehículos',     path: '/admin/vehiculos' },
                  { label: 'Citas',         path: '/admin/citas' },
                  { label: 'Panel Cliente', path: '/cliente/dashboard' },
                  { label: 'Cotizaciones',  path: '/cliente/cotizaciones' },
                ].map(n => (
                  <button
                    key={n.path}
                    onClick={() => navigate(n.path)}
                    style={{ ...S.btnBase, background: '#21262d', borderColor: '#30363d', color: '#8b949e', padding: '5px 0', fontSize: 10 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#e6edf3'}
                    onMouseLeave={e => e.currentTarget.style.color = '#8b949e'}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout */}
            {user && (
              <button
                onClick={handleLogout}
                style={{ ...S.btnBase, background: 'rgba(248,81,73,0.1)', borderColor: 'rgba(248,81,73,0.3)', color: '#f85149' }}
              >
                Cerrar Sesión
              </button>
            )}

            {/* Mensaje de estado */}
            {msg.text && (
              <div style={{
                marginTop: 8, padding: '6px 8px',
                background: msg.ok ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                border: `1px solid ${msg.ok ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                borderRadius: 5, color: msg.ok ? '#3fb950' : '#f85149', fontSize: 11,
              }}>
                {msg.text}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{ ...S.pill, background: open ? '#21262d' : '#0d1117' }}
        title="Herramientas de desarrollo"
      >
        <span>DEV</span>
        <span style={{ fontSize: 9, color: '#8b949e' }}>{open ? '▼' : '▲'}</span>
      </button>
    </div>
  )
}
