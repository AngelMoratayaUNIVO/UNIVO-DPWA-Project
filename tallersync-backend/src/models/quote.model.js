const supabase = require('../config/supabase')

const QuoteModel = {

  async findAll({ workOrderId = null } = {}) {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        work_order:work_orders(
          id, status, total_cost,
          vehicle:vehicles(id, brand, model, plate,
            owner:users(id, full_name, email)
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (workOrderId) query = query.eq('work_order_id', workOrderId)

    const { data, error } = await query
    if (error) throw error
    return data
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        work_order:work_orders(
          id, status, total_cost,
          vehicle:vehicles(id, brand, model, plate,
            owner:users(id, full_name, email)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async create({ work_order_id, items }) {
    const total = items.reduce((sum, item) => sum + item.price, 0)

    const { data, error } = await supabase
      .from('quotes')
      .insert({ work_order_id, items, total, status: 'draft' })
      .select(`
        *,
        work_order:work_orders(id, status,
          vehicle:vehicles(id, brand, model, plate,
            owner:users(id, full_name, email)
          )
        )
      `)
      .single()

    if (error) throw error
    return data
  },

  async update(id, fields) {
    // Recalcular total si se actualizan los ítems
    if (fields.items) {
      fields.total = fields.items.reduce((sum, item) => sum + item.price, 0)
    }

    const { data, error } = await supabase
      .from('quotes')
      .update(fields)
      .eq('id', id)
      .select(`
        *,
        work_order:work_orders(id, status,
          vehicle:vehicles(id, brand, model, plate,
            owner:users(id, full_name, email)
          )
        )
      `)
      .single()

    if (error) throw error
    return data
  }
}

module.exports = QuoteModel
