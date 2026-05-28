const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const UserModel = require('../models/user.model')

const AuthService = {

  async register({ full_name, email, password, phone, role }) {
    // Verificar si el email ya existe
    const existing = await UserModel.findByEmail(email)
    if (existing) {
      const err = new Error('Este correo ya está registrado')
      err.status = 409
      throw err
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10)

    // Crear usuario
    const user = await UserModel.create({ email, password_hash, full_name, phone, role })

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    return { user, token }
  },

  async login({ email, password }) {
    // Buscar usuario
    const user = await UserModel.findByEmail(email)
    if (!user) {
      const err = new Error('Credenciales incorrectas')
      err.status = 401
      throw err
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatch) {
      const err = new Error('Credenciales incorrectas')
      err.status = 401
      throw err
    }

    // Generar token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    // No devolver password_hash al cliente
    const { password_hash, ...safeUser } = user

    return { user: safeUser, token }
  },

  async getMe(userId) {
    const user = await UserModel.findById(userId)
    if (!user) {
      const err = new Error('Usuario no encontrado')
      err.status = 404
      throw err
    }
    return user
  }
}

module.exports = AuthService
