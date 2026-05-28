const WorkOrderModel = require('../models/workOrder.model')
const VehicleModel = require('../models/vehicle.model')

const WorkOrderService = {

  async getAll(user) {
    const ownerId = user.role === 'client' ? user.id : null
    return WorkOrderModel.findAll({ ownerId })
  },

  async getById(id, user) {
    const order = await WorkOrderModel.findById(id)

    if (!order) {
      const err = new Error('Orden de trabajo no encontrada')
      err.status = 404
      throw err
    }

    // Cliente solo puede ver órdenes de sus propios vehículos
    if (user.role === 'client' && order.vehicle?.owner?.id !== user.id) {
      const err = new Error('No tienes permiso para ver esta orden')
      err.status = 403
      throw err
    }

    return order
  },

  // Solo admin puede crear órdenes de trabajo
  async create({ vehicle_id, estimated_hours, notes }, user) {
    // Verificar que el vehículo existe
    const vehicle = await VehicleModel.findById(vehicle_id)
    if (!vehicle) {
      const err = new Error('Vehículo no encontrado')
      err.status = 404
      throw err
    }

    const order = await WorkOrderModel.create({ vehicle_id, estimated_hours, notes })

    // Registrar creación en historial
    await WorkOrderModel.addHistory({
      work_order_id: order.id,
      changed_by: user.id,
      old_status: null,
      new_status: 'waiting',
      comment: 'Orden de trabajo creada'
    })

    return order
  },

  // Solo admin puede actualizar el estado y progreso
  async update(id, fields, user) {
    const order = await WorkOrderModel.findById(id)

    if (!order) {
      const err = new Error('Orden de trabajo no encontrada')
      err.status = 404
      throw err
    }

    const oldStatus = order.status
    const newStatus = fields.status

    const updated = await WorkOrderModel.update(id, fields)

    // Si cambió el estado, registrarlo en historial automáticamente
    if (newStatus && newStatus !== oldStatus) {
      await WorkOrderModel.addHistory({
        work_order_id: id,
        changed_by: user.id,
        old_status: oldStatus,
        new_status: newStatus,
        comment: `Estado actualizado de "${oldStatus}" a "${newStatus}"`
      })
    }

    return updated
  },

  // Agregar comentario manual al historial (admin)
  async addComment(id, { comment }, user) {
    const order = await WorkOrderModel.findById(id)

    if (!order) {
      const err = new Error('Orden de trabajo no encontrada')
      err.status = 404
      throw err
    }

    return WorkOrderModel.addHistory({
      work_order_id: id,
      changed_by: user.id,
      old_status: order.status,
      new_status: order.status,
      comment
    })
  },

  // Ver historial — admin ve todo, cliente solo sus órdenes
  async getHistory(id, user) {
    const order = await WorkOrderModel.findById(id)

    if (!order) {
      const err = new Error('Orden de trabajo no encontrada')
      err.status = 404
      throw err
    }

    if (user.role === 'client' && order.vehicle?.owner?.id !== user.id) {
      const err = new Error('No tienes permiso para ver este historial')
      err.status = 403
      throw err
    }

    return WorkOrderModel.getHistory(id)
  }
}

module.exports = WorkOrderService
