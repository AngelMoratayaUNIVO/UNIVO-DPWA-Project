const Joi = require('joi')
const { validate } = require('./auth.validator')

const quoteItemSchema = Joi.object({
  description: Joi.string().min(1).max(200).required().messages({
    'any.required': 'La descripción del ítem es requerida'
  }),
  price: Joi.number().min(0).required().messages({
    'any.required': 'El precio del ítem es requerido',
    'number.min': 'El precio no puede ser negativo'
  })
})

const createQuoteSchema = Joi.object({
  work_order_id: Joi.string().uuid().required().messages({
    'string.guid': 'El ID de la orden no es un UUID válido',
    'any.required': 'La orden de trabajo es requerida'
  }),
  items: Joi.array().items(quoteItemSchema).min(1).required().messages({
    'array.min': 'La cotización debe tener al menos un ítem',
    'any.required': 'Los ítems son requeridos'
  })
})

const updateQuoteSchema = Joi.object({
  items: Joi.array().items(quoteItemSchema).min(1).messages({
    'array.min': 'La cotización debe tener al menos un ítem'
  }),
  status: Joi.string().valid('draft', 'sent', 'approved', 'rejected').messages({
    'any.only': 'Estado inválido. Valores permitidos: draft, sent, approved, rejected'
  })
}).min(1).messages({
  'object.min': 'Debes enviar al menos un campo para actualizar'
})

module.exports = { createQuoteSchema, updateQuoteSchema, validate }
