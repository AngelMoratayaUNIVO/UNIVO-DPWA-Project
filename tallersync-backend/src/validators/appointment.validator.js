const Joi = require('joi')
const { validate } = require('./auth.validator')

const createAppointmentSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID del vehículo no es un UUID válido',
    'any.required': 'El vehículo es requerido'
  }),
  requested_date: Joi.date().iso().greater('now').required().messages({
    'date.greater': 'La fecha debe ser en el futuro',
    'date.iso': 'Formato de fecha inválido (usa ISO 8601)',
    'any.required': 'La fecha es requerida'
  }),
  notes: Joi.string().max(500).optional().allow('')
})

const updateAppointmentSchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected').messages({
    'any.only': 'Estado inválido. Valores permitidos: pending, approved, rejected'
  }),
  requested_date: Joi.date().iso().greater('now').messages({
    'date.greater': 'La fecha debe ser en el futuro',
    'date.iso': 'Formato de fecha inválido (usa ISO 8601)'
  }),
  notes: Joi.string().max(500).allow('')
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar'
})

module.exports = { createAppointmentSchema, updateAppointmentSchema, validate }
