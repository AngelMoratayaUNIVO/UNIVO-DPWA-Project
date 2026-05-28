const QuoteService = require('../services/quote.service')
const { createQuoteSchema, updateQuoteSchema, validate } = require('../validators/quote.validator')

const QuoteController = {

  // GET /api/quotes?work_order_id=xxx
  async getAll(req, res, next) {
    try {
      const { work_order_id } = req.query
      const quotes = await QuoteService.getAll(req.user, { workOrderId: work_order_id })
      res.json({ success: true, data: { quotes } })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/quotes/:id
  async getById(req, res, next) {
    try {
      const quote = await QuoteService.getById(req.params.id, req.user)
      res.json({ success: true, data: { quote } })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/quotes  (solo admin)
  async create(req, res, next) {
    try {
      const data = validate(createQuoteSchema, req.body)
      const quote = await QuoteService.create(data)
      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: { quote }
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/quotes/:id  (admin: todo | cliente: solo status approved/rejected)
  async update(req, res, next) {
    try {
      const fields = validate(updateQuoteSchema, req.body)
      const quote = await QuoteService.update(req.params.id, fields, req.user)
      res.json({
        success: true,
        message: 'Cotización actualizada exitosamente',
        data: { quote }
      })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = QuoteController
