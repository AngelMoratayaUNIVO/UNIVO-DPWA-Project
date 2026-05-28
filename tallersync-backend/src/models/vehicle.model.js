const supabase = require('../config/supabase')

const VehicleModel = {

  // Obtener todos los vehículos (admin ve todos, cliente solo los suyos)
  async findAll({ ownerId = null } = {}) {
    let query = supabase
      .from('vehicles')
      .select(`
        *,
        owner:users(id, full_name, email, phone)
      `)
      .order('created_at', { ascending: false })

    if (ownerId) query = query.eq('owner_id', ownerId)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Obtener un vehículo por ID
  async findById(id) {
    const { data, error } = await supabase
      .from('vehicles')
      .select(`
        *,
        owner:users(id, full_name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  // Buscar por placa
  async findByPlate(plate) {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate', plate)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  // Crear vehículo
  async create({ owner_id, brand, model, year, plate, color }) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert({ owner_id, brand, model, year, plate, color })
      .select(`
        *,
        owner:users(id, full_name, email, phone)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Actualizar vehículo
  async update(id, fields) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(fields)
      .eq('id', id)
      .select(`
        *,
        owner:users(id, full_name, email, phone)
      `)
      .single()

    if (error) throw error
    return data
  },

  // Eliminar vehículo
  async delete(id) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}

module.exports = VehicleModel
