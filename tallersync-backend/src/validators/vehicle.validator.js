const Joi = require('joi')
const { validate } = require('./auth.validator')

const createVehicleSchema = Joi.object({
  brand: Joi.string().min(2).max(80).required().messages({
    'string.min': 'La marca debe tener al menos 2 caracteres',
    'any.required': 'La marca es requerida'
  }),
  model: Joi.string().min(1).max(80).required().messages({
    'any.required': 'El modelo es requerido'
  }),
  year: Joi.number().integer().min(1970).max(new Date().getFullYear() + 1).required().messages({
    'number.min': 'El año debe ser mayor a 1970',
    'any.required': 'El año es requerido'
  }),
  plate: Joi.string().min(3).max(20).required().messages({
    'any.required': 'La placa es requerida'
  }),
  color: Joi.string().max(40).optional().allow('')
})

const updateVehicleSchema = Joi.object({
  brand: Joi.string().min(2).max(80),
  model: Joi.string().min(1).max(80),
  year: Joi.number().integer().min(1970).max(new Date().getFullYear() + 1),
  plate: Joi.string().min(3).max(20),
  color: Joi.string().max(40).allow('')
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar'
})

module.exports = { createVehicleSchema, updateVehicleSchema, validate }
