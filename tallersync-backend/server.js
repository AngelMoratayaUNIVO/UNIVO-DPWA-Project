require('dotenv').config()
const app = require('./src/app')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`✓ TallerSync API corriendo en http://localhost:${PORT}`)
  console.log(`✓ Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`✓ Health check: http://localhost:${PORT}/health`)
})
