const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1] // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requerido' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { id, email, role }
    next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado' })
  }
}

// Solo permite acceso a admins (taller)
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Acceso restringido a administradores' })
  }
  next()
}

module.exports = { authMiddleware, adminOnly }
