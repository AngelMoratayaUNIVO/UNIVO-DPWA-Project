const QuoteModel = require('../models/quote.model')
const WorkOrderModel = require('../models/workOrder.model')

const QuoteService = {

  // Admin ve todas; cliente filtra por sus órdenes
  async getAll(user, { workOrderId } = {}) {
    const quotes = await QuoteModel.findAll({ workOrderId })

    if (user.role === 'client') {
      return quotes.filter(
        q => q.work_order?.vehicle?.owner?.id === user.id
      )
    }

    return quotes
  },

  async getById(id, user) {
    const quote = await QuoteModel.findById(id)

    if (!quote) {
      const err = new Error('Cotización no encontrada')
      err.status = 404
      throw err
    }

    if (user.role === 'client' &&
        quote.work_order?.vehicle?.owner?.id !== user.id) {
      const err = new Error('No tienes permiso para ver esta cotización')
      err.status = 403
      throw err
    }

    return quote
  },

  // Solo admin crea cotizaciones
  async create({ work_order_id, items }) {
    const order = await WorkOrderModel.findById(work_order_id)

    if (!order) {
      const err = new Error('Orden de trabajo no encontrada')
      err.status = 404
      throw err
    }

    const quote = await QuoteModel.create({ work_order_id, items })

    // Sincronizar el costo total en la orden de trabajo
    await WorkOrderModel.update(work_order_id, { total_cost: quote.total })

    return quote
  },

  // Admin actualiza ítems o cambia estado
  // Cliente solo puede aprobar o rechazar (status: approved | rejected)
  async update(id, fields, user) {
    const quote = await QuoteModel.findById(id)

    if (!quote) {
      const err = new Error('Cotización no encontrada')
      err.status = 404
      throw err
    }

    if (user.role === 'client') {
      if (quote.work_order?.vehicle?.owner?.id !== user.id) {
        const err = new Error('No tienes permiso para modificar esta cotización')
        err.status = 403
        throw err
      }
      // Cliente solo puede aprobar o rechazar
      const allowed = ['approved', 'rejected']
      if (fields.status && !allowed.includes(fields.status)) {
        const err = new Error('Solo puedes aprobar o rechazar la cotización')
        err.status = 403
        throw err
      }
      if (fields.items) {
        const err = new Error('No tienes permiso para modificar los ítems')
        err.status = 403
        throw err
      }
    }

    const updated = await QuoteModel.update(id, fields)

    // Si se actualizaron ítems, sincronizar costo en la orden
    if (fields.items) {
      await WorkOrderModel.update(quote.work_order_id, { total_cost: updated.total })
    }

    return updated
  }
}

module.exports = QuoteService
