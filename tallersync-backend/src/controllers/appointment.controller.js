const AppointmentService = require('../services/appointment.service')
const { createAppointmentSchema, updateAppointmentSchema, validate } = require('../validators/appointment.validator')

const AppointmentController = {

  // GET /api/appointments
  async getAll(req, res, next) {
    try {
      const appointments = await AppointmentService.getAll(req.user)
      res.json({ success: true, data: { appointments } })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/appointments/:id
  async getById(req, res, next) {
    try {
      const appointment = await AppointmentService.getById(req.params.id, req.user)
      res.json({ success: true, data: { appointment } })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/appointments  (cliente y admin)
  async create(req, res, next) {
    try {
      const data = validate(createAppointmentSchema, req.body)
      const appointment = await AppointmentService.create(data, req.user)
      res.status(201).json({
        success: true,
        message: 'Cita solicitada exitosamente',
        data: { appointment }
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/appointments/:id
  async update(req, res, next) {
    try {
      const fields = validate(updateAppointmentSchema, req.body)
      const appointment = await AppointmentService.update(req.params.id, fields, req.user)
      res.json({
        success: true,
        message: 'Cita actualizada exitosamente',
        data: { appointment }
      })
    } catch (err) {
      next(err)
    }
  },

  // DELETE /api/appointments/:id  (solo admin)
  async delete(req, res, next) {
    try {
      const result = await AppointmentService.delete(req.params.id)
      res.json({ success: true, message: result.message })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = AppointmentController
