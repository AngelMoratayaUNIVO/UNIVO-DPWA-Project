const express = require('express')
const cors = require('cors')

const authRoutes        = require('./routes/auth.routes')
const vehicleRoutes     = require('./routes/vehicle.routes')
const workOrderRoutes   = require('./routes/workOrder.routes')
const appointmentRoutes = require('./routes/appointment.routes')
const quoteRoutes       = require('./routes/quote.routes')
const errorHandler      = require('./middlewares/errorHandler')

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'TallerSync API corriendo', env: process.env.NODE_ENV })
})

app.use('/api/auth',         authRoutes)
app.use('/api/vehicles',     vehicleRoutes)
app.use('/api/work-orders',  workOrderRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/quotes',       quoteRoutes)

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta ${req.method} ${req.path} no existe` })
})

app.use(errorHandler)

module.exports = app
