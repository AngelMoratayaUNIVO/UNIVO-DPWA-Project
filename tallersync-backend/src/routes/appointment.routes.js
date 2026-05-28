const express = require('express')
const router = express.Router()
const AppointmentController = require('../controllers/appointment.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth')

router.use(authMiddleware)

// GET  /api/appointments      → admin: todas | cliente: solo las suyas
router.get('/', AppointmentController.getAll)

// GET  /api/appointments/:id
router.get('/:id', AppointmentController.getById)

// POST /api/appointments      → cliente y admin pueden crear
router.post('/', AppointmentController.create)

// PUT  /api/appointments/:id  → admin: aprueba/rechaza/reprograma | cliente: solo cancela
router.put('/:id', AppointmentController.update)

// DELETE /api/appointments/:id → solo admin
router.delete('/:id', adminOnly, AppointmentController.delete)

module.exports = router
