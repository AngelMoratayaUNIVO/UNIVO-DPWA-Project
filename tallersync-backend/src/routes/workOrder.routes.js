const express = require('express')
const router = express.Router()
const WorkOrderController = require('../controllers/workOrder.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth')

// Todas las rutas requieren autenticación
router.use(authMiddleware)

// GET  /api/work-orders          → admin: todas | cliente: solo las de sus vehículos
router.get('/', WorkOrderController.getAll)

// GET  /api/work-orders/:id      → admin: cualquiera | cliente: solo las suyas
router.get('/:id', WorkOrderController.getById)

// POST /api/work-orders          → solo admin
router.post('/', adminOnly, WorkOrderController.create)

// PUT  /api/work-orders/:id      → solo admin (actualiza estado, progreso, costo)
router.put('/:id', adminOnly, WorkOrderController.update)

// GET  /api/work-orders/:id/history   → admin y cliente (cliente solo las suyas)
router.get('/:id/history', WorkOrderController.getHistory)

// POST /api/work-orders/:id/comments  → solo admin
router.post('/:id/comments', adminOnly, WorkOrderController.addComment)

module.exports = router
