const supabase = require('../config/supabase')

const AppointmentModel = {

  async findAll({ clientId = null } = {}) {
    let query = supabase
      .from('appointments')
      .select(`
        *,
        client:users(id, full_name, email, phone),
        vehicle:vehicles(id, brand, model, year, plate)
      `)
      .order('requested_date', { ascending: true })

    if (clientId) query = query.eq('client_id', clientId)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:users(id, full_name, email, phone),
        vehicle:vehicles(id, brand, model, year, plate)
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create({ client_id, vehicle_id, requested_date, notes }) {
    const { data, error } = await supabase
      .from('appointments')
      .insert({ client_id, vehicle_id, requested_date, notes, status: 'pending' })
      .select(`
        *,
        client:users(id, full_name, email, phone),
        vehicle:vehicles(id, brand, model, year, plate)
      `)
      .single()

    if (error) throw error
    return data
  },

  async update(id, fields) {
    const { data, error } = await supabase
      .from('appointments')
      .update(fields)
      .eq('id', id)
      .select(`
        *,
        client:users(id, full_name, email, phone),
        vehicle:vehicles(id, brand, model, year, plate)
      `)
      .single()

    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  }
}

module.exports = AppointmentModel
