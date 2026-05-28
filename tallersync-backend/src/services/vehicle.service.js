const VehicleModel = require('../models/vehicle.model')

const VehicleService = {

  // Listar vehículos según rol
  async getAll(user) {
    // Admin ve todos; cliente solo ve los suyos
    const ownerId = user.role === 'client' ? user.id : null
    return VehicleModel.findAll({ ownerId })
  },

  // Obtener un vehículo (con control de acceso)
  async getById(id, user) {
    const vehicle = await VehicleModel.findById(id)

    if (!vehicle) {
      const err = new Error('Vehículo no encontrado')
      err.status = 404
      throw err
    }

    // Cliente solo puede ver sus propios vehículos
    if (user.role === 'client' && vehicle.owner_id !== user.id) {
      const err = new Error('No tienes permiso para ver este vehículo')
      err.status = 403
      throw err
    }

    return vehicle
  },

  // Crear vehículo
  async create(data, user) {
    // Si el admin registra un vehículo debe enviar owner_id,
    // si es cliente se asigna automáticamente a sí mismo
    const owner_id = user.role === 'admin'
      ? (data.owner_id || user.id)
      : user.id

    // Verificar placa duplicada
    const existing = await VehicleModel.findByPlate(data.plate)
    if (existing) {
      const err = new Error(`Ya existe un vehículo con la placa ${data.plate}`)
      err.status = 409
      throw err
    }

    return VehicleModel.create({ ...data, owner_id })
  },

  // Actualizar vehículo
  async update(id, fields, user) {
    const vehicle = await VehicleModel.findById(id)

    if (!vehicle) {
      const err = new Error('Vehículo no encontrado')
      err.status = 404
      throw err
    }

    // Cliente solo puede editar sus propios vehículos
    if (user.role === 'client' && vehicle.owner_id !== user.id) {
      const err = new Error('No tienes permiso para editar este vehículo')
      err.status = 403
      throw err
    }

    // Si se cambia la placa, verificar que no esté en uso por otro vehículo
    if (fields.plate && fields.plate !== vehicle.plate) {
      const existing = await VehicleModel.findByPlate(fields.plate)
      if (existing) {
        const err = new Error(`Ya existe un vehículo con la placa ${fields.plate}`)
        err.status = 409
        throw err
      }
    }

    return VehicleModel.update(id, fields)
  },

  // Eliminar vehículo (solo admin)
  async delete(id) {
    const vehicle = await VehicleModel.findById(id)

    if (!vehicle) {
      const err = new Error('Vehículo no encontrado')
      err.status = 404
      throw err
    }

    await VehicleModel.delete(id)
    return { message: 'Vehículo eliminado correctamente' }
  }
}

module.exports = VehicleService
