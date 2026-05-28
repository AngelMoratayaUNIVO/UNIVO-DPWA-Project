const express = require('express')
const router = express.Router()
const QuoteController = require('../controllers/quote.controller')
const { authMiddleware, adminOnly } = require('../middlewares/auth')

router.use(authMiddleware)

// GET  /api/quotes             → admin: todas | cliente: solo las suyas
// GET  /api/quotes?work_order_id=xxx → filtrar por orden
router.get('/', QuoteController.getAll)

// GET  /api/quotes/:id
router.get('/:id', QuoteController.getById)

// POST /api/quotes             → solo admin
router.post('/', adminOnly, QuoteController.create)

// PUT  /api/quotes/:id         → admin: ítems y estado | cliente: solo approved/rejected
router.put('/:id', QuoteController.update)

module.exports = router
