const supabase = require('../config/supabase')

const UserModel = {
  // Busca usuario por email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return data || null
  },

  // Busca usuario por ID (sin password_hash)
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, phone, role, created_at')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Crea nuevo usuario
  async create({ email, password_hash, full_name, phone, role }) {
    const { data, error } = await supabase
      .from('users')
      .insert({ email, password_hash, full_name, phone, role })
      .select('id, email, full_name, phone, role, created_at')
      .single()

    if (error) throw error
    return data
  }
}

module.exports = UserModel
