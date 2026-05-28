const Joi = require('joi')
const { validate } = require('./auth.validator')

const VALID_STATUSES = ['waiting', 'diagnosis', 'repair', 'testing', 'done']

const createWorkOrderSchema = Joi.object({
  vehicle_id: Joi.string().uuid().required().messages({
    'string.uuid': 'El ID del vehículo no es un UUID válido',
    'string.guid': 'El ID del vehículo no es un UUID válido',
    'any.required': 'El vehículo es requerido'
  }),
  estimated_hours: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional().allow('')
})

const updateWorkOrderSchema = Joi.object({
  status: Joi.string().valid(...VALID_STATUSES).messages({
    'any.only': `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`
  }),
  progress_pct: Joi.number().integer().min(0).max(100).messages({
    'number.min': 'El progreso no puede ser menor a 0',
    'number.max': 'El progreso no puede ser mayor a 100'
  }),
  estimated_hours: Joi.number().min(0),
  total_cost: Joi.number().min(0),
  notes: Joi.string().max(1000).allow('')
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar'
})

const addHistorySchema = Joi.object({
  comment: Joi.string().min(1).max(500).required().messages({
    'any.required': 'El comentario es requerido',
    'string.min': 'El comentario no puede estar vacío'
  })
})

module.exports = { createWorkOrderSchema, updateWorkOrderSchema, addHistorySchema, validate }
