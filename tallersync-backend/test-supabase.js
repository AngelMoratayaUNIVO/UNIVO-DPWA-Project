require('dotenv').config();
const supabase = require('./src/config/supabase');

async function testConnection() {
  console.log('Probando conexión con Supabase...');
  console.log('URL:', process.env.SUPABASE_URL);

  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('Error al consultar la tabla users:', error);
    } else {
      console.log('Conexión exitosa. Número de usuarios en la tabla users:', data || 0);
    }

    const tables = ['users', 'vehicles', 'work_orders', 'service_history', 'appointments', 'quotes'];
    for (const table of tables) {
      const { error: tblError } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (tblError) {
        console.log(`Tabla "${table}": No existe o tiene error:`, tblError.message);
      } else {
        console.log(`Tabla "${table}": Existe.`);
      }
    }
  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

testConnection();
