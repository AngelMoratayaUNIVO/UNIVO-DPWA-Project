const express = require('express')
const router = express.Router()
const AuthController = require('../controllers/auth.controller')
const { authMiddleware } = require('../middlewares/auth')

// POST /api/auth/register
router.post('/register', AuthController.register)

// POST /api/auth/login
router.post('/login', AuthController.login)

// GET /api/auth/me  — protegida, requiere JWT
router.get('/me', authMiddleware, AuthController.me)

module.exports = router
