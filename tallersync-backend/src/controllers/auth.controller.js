const AuthService = require('../services/auth.service')
const { registerSchema, loginSchema, validate } = require('../validators/auth.validator')

const AuthController = {

  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const data = validate(registerSchema, req.body)
      const result = await AuthService.register(data)

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const data = validate(loginSchema, req.body)
      const result = await AuthService.login(data)

      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: result
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/auth/me  (requiere token)
  async me(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user.id)

      res.status(200).json({
        success: true,
        data: { user }
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = AuthController
