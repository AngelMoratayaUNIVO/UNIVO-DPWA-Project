const VehicleService = require('../services/vehicle.service')
const { createVehicleSchema, updateVehicleSchema, validate } = require('../validators/vehicle.validator')

const VehicleController = {

  // GET /api/vehicles
  async getAll(req, res, next) {
    try {
      const vehicles = await VehicleService.getAll(req.user)
      res.json({ success: true, data: { vehicles } })
    } catch (err) {
      next(err)
    }
  },

  // GET /api/vehicles/:id
  async getById(req, res, next) {
    try {
      const vehicle = await VehicleService.getById(req.params.id, req.user)
      res.json({ success: true, data: { vehicle } })
    } catch (err) {
      next(err)
    }
  },

  // POST /api/vehicles
  async create(req, res, next) {
    try {
      const data = validate(createVehicleSchema, req.body)
      const vehicle = await VehicleService.create(data, req.user)
      res.status(201).json({
        success: true,
        message: 'Vehículo registrado exitosamente',
        data: { vehicle }
      })
    } catch (err) {
      next(err)
    }
  },

  // PUT /api/vehicles/:id
  async update(req, res, next) {
    try {
      const fields = validate(updateVehicleSchema, req.body)
      const vehicle = await VehicleService.update(req.params.id, fields, req.user)
      res.json({
        success: true,
        message: 'Vehículo actualizado exitosamente',
        data: { vehicle }
      })
    } catch (err) {
      next(err)
    }
  },

  // DELETE /api/vehicles/:id  (solo admin)
  async delete(req, res, next) {
    try {
      const result = await VehicleService.delete(req.params.id)
      res.json({ success: true, message: result.message })
    } catch (err) {
      next(err)
    }
  }
}

module.exports = VehicleController
