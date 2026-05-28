const supabase = require('../config/supabase')

const WorkOrderModel = {

  // Listar órdenes — admin ve todas, cliente solo las de sus vehículos
  async findAll({ ownerId = null } = {}) {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        vehicle:vehicles(
          id, brand, model, year, plate, color,
          owner:users(id, full_name, email, phone)
        )
      `)
      .order('created_at', { ascending: false })

    // Filtrar por propietario del vehículo si es cliente
    if (ownerId) {
      query = query.eq('vehicle.owner_id', ownerId)
    }

    const { data, error } = await query
    if (error) throw error

    // Supabase no filtra relaciones profundas en .select(), lo hacemos en JS
    if (ownerId) {
      return data.filter(wo => wo.vehicle?.owner?.id === ownerId)
    }
    return data
  },

  // Obtener una orden por ID con toda su info
  async findById(id) {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        vehicle:vehicles(
          id, brand, model, year, plate, color,
          owner:users(id, full_name, email, phone)
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  // Crear orden de trabajo
  async create({ vehicle_id, estimated_hours, notes }) {
    const { data, error } = await supabase
      .from('work_orders')
      .insert({ vehicle_id, estimated_hours, notes, status: 'waiting', progress_pct: 0 })
      .select(`
        *,
        vehicle:vehicles(
          id, brand, model, year, plate,
          owner:users(id, full_name, email)
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Actualizar campos de la orden
  async update(id, fields) {
    const { data, error } = await supabase
      .from('work_orders')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        vehicle:vehicles(
          id, brand, model, year, plate,
          owner:users(id, full_name, email)
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  // Registrar entrada en historial
  async addHistory({ work_order_id, changed_by, old_status, new_status, comment }) {
    const { data, error } = await supabase
      .from('service_history')
      .insert({ work_order_id, changed_by, old_status, new_status, comment })
      .select('*')
      .single()

    if (error) throw error
    return data
  },

  // Obtener historial completo de una orden
  async getHistory(workOrderId) {
    const { data, error } = await supabase
      .from('service_history')
      .select(`
        *,
        changed_by_user:users(id, full_name, role)
      `)
      .eq('work_order_id', workOrderId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}

module.exports = WorkOrderModel
