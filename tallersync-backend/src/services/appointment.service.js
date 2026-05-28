const AppointmentModel = require('../models/appointment.model')
const VehicleModel = require('../models/vehicle.model')

const AppointmentService = {

  async getAll(user) {
    const clientId = user.role === 'client' ? user.id : null
    return AppointmentModel.findAll({ clientId })
  },

  async getById(id, user) {
    const appointment = await AppointmentModel.findById(id)

    if (!appointment) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }

    if (user.role === 'client' && appointment.client_id !== user.id) {
      const err = new Error('No tienes permiso para ver esta cita')
      err.status = 403
      throw err
    }

    return appointment
  },

  // Cliente crea su propia cita
  async create({ vehicle_id, requested_date, notes }, user) {
    const vehicle = await VehicleModel.findById(vehicle_id)

    if (!vehicle) {
      const err = new Error('Vehículo no encontrado')
      err.status = 404
      throw err
    }

    // Cliente solo puede agendar sus propios vehículos
    if (user.role === 'client' && vehicle.owner_id !== user.id) {
      const err = new Error('No puedes agendar una cita para un vehículo que no es tuyo')
      err.status = 403
      throw err
    }

    const client_id = user.role === 'client' ? user.id : vehicle.owner_id

    return AppointmentModel.create({ client_id, vehicle_id, requested_date, notes })
  },

  // Admin aprueba, rechaza o reprograma — cliente puede cancelar (→ rejected) la suya
  async update(id, fields, user) {
    const appointment = await AppointmentModel.findById(id)

    if (!appointment) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }

    if (user.role === 'client') {
      if (appointment.client_id !== user.id) {
        const err = new Error('No tienes permiso para modificar esta cita')
        err.status = 403
        throw err
      }
      // Cliente solo puede cancelar (pasar a rejected), no aprobar
      if (fields.status && fields.status !== 'rejected') {
        const err = new Error('Solo puedes cancelar tu cita')
        err.status = 403
        throw err
      }
    }

    return AppointmentModel.update(id, fields)
  },

  // Solo admin elimina citas
  async delete(id) {
    const appointment = await AppointmentModel.findById(id)

    if (!appointment) {
      const err = new Error('Cita no encontrada')
      err.status = 404
      throw err
    }

    await AppointmentModel.delete(id)
    return { message: 'Cita eliminada correctamente' }
  }
}

module.exports = AppointmentService
