const Joi = require('joi')

const registerSchema = Joi.object({
  full_name: Joi.string().min(3).max(150).required().messages({
    'string.min': 'El nombre debe tener al menos 3 caracteres',
    'any.required': 'El nombre es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'any.required': 'El correo es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  phone: Joi.string().max(20).optional().allow(''),
  role: Joi.string().valid('admin', 'client').default('client')
})

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Correo electrónico inválido',
    'any.required': 'El correo es requerido'
  }),
  password: Joi.string().min(1).required().messages({
    'string.empty': 'La contraseña es requerida',
    'any.required': 'La contraseña es requerida'
  })
})

// Helper: valida y lanza error con status 400 si falla
const validate = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false })
  if (error) {
    const messages = error.details.map(d => d.message)
    const err = new Error(messages.join(', '))
    err.status = 400
    throw err
  }
  return value
}

module.exports = { registerSchema, loginSchema, validate }
