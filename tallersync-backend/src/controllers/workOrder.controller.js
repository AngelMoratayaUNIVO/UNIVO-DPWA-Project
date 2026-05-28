const WorkOrderService = require('../services/workOrder.service')
const {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  addHistorySchema,
  validate
} = require('../validators/workOrder.validator')

const WorkOrderController = {

  // GET /api/work-orders
  async getAll(req, res, next) {
    try {
      const orders = await WorkOrderService.getAll(req.user)
      res.json({ success: true, data: { orders } })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/work-orders/:id
  async getById(req, res, next) {
    try {
      const order = await WorkOrderService.getById(req.params.id, req.user)
      res.json({ success: true, data: { order } })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/work-orders  (solo admin)
  async create(req, res, next) {
    try {
      const data = validate(createWorkOrderSchema, req.body)
      const order = await WorkOrderService.create(data, req.user)
      res.status(201).json({
        success: true,
        message: 'Orden de trabajo creada exitosamente',
        data: { order }
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/work-orders/:id  (solo admin)
  async update(req, res, next) {
    try {
      const fields = validate(updateWorkOrderSchema, req.body)
      const order = await WorkOrderService.update(req.params.id, fields, req.user)
      res.json({
        success: true,
        message: 'Orden actualizada exitosamente',
        data: { order }
      })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/work-orders/:id/comments  (solo admin)
  async addComment(req, res, next) {
    try {
      const data = validate(addHistorySchema, req.body)
      const entry = await WorkOrderService.addComment(req.params.id, data, req.user)
      res.status(201).json({
        success: true,
        message: 'Comentario agregado al historial',
        data: { entry }
      })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/work-orders/:id/history
  async getHistory(req, res, next) {
    try {
      const history = await WorkOrderService.getHistory(req.params.id, req.user)
      res.json({ success: true, data: { history } })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = WorkOrderController
