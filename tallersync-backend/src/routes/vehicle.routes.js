const express = require('express')
const router = express.Router()
const VehicleController = require('../controllers/vehicle.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth')

// Todas las rutas requieren estar autenticado
router.use(authMiddleware)

// GET  /api/vehicles        → admin: todos | cliente: solo los suyos
router.get('/', VehicleController.getAll)

// GET  /api/vehicles/:id    → admin: cualquiera | cliente: solo los suyos
router.get('/:id', VehicleController.getById)

// POST /api/vehicles        → admin y cliente pueden registrar vehículos
router.post('/', VehicleController.create)

// PUT  /api/vehicles/:id    → admin: cualquiera | cliente: solo los suyos
router.put('/:id', VehicleController.update)

// DELETE /api/vehicles/:id  → solo admin
router.delete('/:id', adminOnly, VehicleController.delete)

module.exports = router
