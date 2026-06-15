import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ts_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const url = err.config?.url || ''
    // Solo redirigir a /login si el 401 viene de una ruta protegida,
    // no del intento de login/register en sí mismo
    if (err.response?.status === 401 && !url.startsWith('/auth/')) {
      localStorage.removeItem('ts_token')
      localStorage.removeItem('ts_user')
      window.location.href = '/login'
    }
    return Promise.reject(err.response?.data || { message: 'Error de conexión con el servidor' })
  }
)

export default api
