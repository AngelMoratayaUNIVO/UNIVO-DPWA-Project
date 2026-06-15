require('dotenv').config();
const supabase = require('./src/config/supabase');

const BASE_URL = 'http://localhost:3000/api';

async function runTests() {
  console.log('============================================================');
  console.log(' INICIANDO PRUEBAS DE ENDPOINTS DE TALLERSYNC BACKEND');
  console.log('============================================================\n');

  // Verificar que el servidor esté activo
  try {
    const healthRes = await fetch('http://localhost:3000/health');
    const healthData = await healthRes.json();
    console.log(' Servidor detectado en funcionamiento:', healthData.message);
  } catch (error) {
    console.error(' ERROR: El servidor backend no parece estar ejecutándose. Asegúrate de ejecutar `npm run dev` primero.');
    process.exit(1);
  }

  const testId = Math.floor(Math.random() * 10000);
  const clientEmail = `client_${testId}@test.com`;
  const adminEmail = `admin_${testId}@test.com`;
  const password = 'password123';
  
  let clientToken = '';
  let adminToken = '';
  let clientId = '';
  let adminId = '';

  let vehicleId = '';
  let appointmentId = '';
  let workOrderId = '';
  let quoteId = '';

  // Helper para hacer llamadas fetch con cabeceras y logueo estructurado
  async function request(method, path, body = null, token = null) {
    const url = `${BASE_URL}${path}`;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const data = await res.json();
    return { status: res.status, data };
  }

  function printResult(testName, success, details = '') {
    if (success) {
      console.log(` [PASS] ${testName} ${details ? `- ${details}` : ''}`);
    } else {
      console.error(` [FAIL] ${testName} ${details ? `- ${details}` : ''}`);
    }
  }

  try {
    // --------------------------------------------------------
    // 1. REGISTRO DE USUARIOS
    // --------------------------------------------------------
    console.log('\n--- 1. Registro de Usuarios ---');
    
    // Registrar Cliente
    const regClient = await request('POST', '/auth/register', {
      full_name: 'Cliente Test TallerSync',
      email: clientEmail,
      password: password,
      phone: '7777-7777',
      role: 'client'
    });
    const clientOk = regClient.status === 201 && regClient.data.success;
    printResult('POST /api/auth/register (Client)', clientOk, `Status: ${regClient.status}`);
    if (clientOk) {
      clientId = regClient.data.data.user.id;
    } else {
      console.error(regClient.data);
    }

    // Registrar Administrador
    const regAdmin = await request('POST', '/auth/register', {
      full_name: 'Admin Test TallerSync',
      email: adminEmail,
      password: password,
      phone: '8888-8888',
      role: 'admin'
    });
    const adminOk = regAdmin.status === 201 && regAdmin.data.success;
    printResult('POST /api/auth/register (Admin)', adminOk, `Status: ${regAdmin.status}`);
    if (adminOk) {
      adminId = regAdmin.data.data.user.id;
    } else {
      console.error(regAdmin.data);
    }

    // --------------------------------------------------------
    // 2. LOGIN DE USUARIOS
    // --------------------------------------------------------
    console.log('\n--- 2. Login de Usuarios ---');

    // Login Cliente
    const loginClient = await request('POST', '/auth/login', {
      email: clientEmail,
      password: password
    });
    const loginClientOk = loginClient.status === 200 && loginClient.data.success;
    printResult('POST /api/auth/login (Client)', loginClientOk, `Status: ${loginClient.status}`);
    if (loginClientOk) {
      clientToken = loginClient.data.data.token;
    }

    // Login Admin
    const loginAdmin = await request('POST', '/auth/login', {
      email: adminEmail,
      password: password
    });
    const loginAdminOk = loginAdmin.status === 200 && loginAdmin.data.success;
    printResult('POST /api/auth/login (Admin)', loginAdminOk, `Status: ${loginAdmin.status}`);
    if (loginAdminOk) {
      adminToken = loginAdmin.data.data.token;
    }

    // --------------------------------------------------------
    // 3. OBTENER INFORMACIÓN DE PERFIL (/me)
    // --------------------------------------------------------
    console.log('\n--- 3. Endpoint /me (Perfil) ---');

    const meClient = await request('GET', '/auth/me', null, clientToken);
    const meClientOk = meClient.status === 200 && meClient.data.success && meClient.data.data.user.email === clientEmail;
    printResult('GET /api/auth/me (Client)', meClientOk, `User: ${meClient.data?.data?.user?.full_name}`);

    const meAdmin = await request('GET', '/auth/me', null, adminToken);
    const meAdminOk = meAdmin.status === 200 && meAdmin.data.success && meAdmin.data.data.user.email === adminEmail;
    printResult('GET /api/auth/me (Admin)', meAdminOk, `User: ${meAdmin.data?.data?.user?.full_name}`);

    // Probar token inválido
    const meInvalid = await request('GET', '/auth/me', null, 'token_invalido_123');
    printResult('GET /api/auth/me (Token inválido - debe fallar)', meInvalid.status === 401, `Status esperado: 401, recibido: ${meInvalid.status}`);

    // --------------------------------------------------------
    // 4. VEHÍCULOS
    // --------------------------------------------------------
    console.log('\n--- 4. Gestión de Vehículos ---');

    // Registrar vehículo (como Cliente)
    const createVehicle = await request('POST', '/vehicles', {
      brand: 'Toyota',
      model: 'Corolla Hatchback',
      year: 2022,
      plate: `P-${testId}`,
      color: 'Gris Metálico'
    }, clientToken);
    const createVehicleOk = createVehicle.status === 201 && createVehicle.data.success;
    printResult('POST /api/vehicles (Crear vehículo)', createVehicleOk, `Plate: P-${testId}`);
    if (createVehicleOk) {
      vehicleId = createVehicle.data.data.vehicle.id;
    } else {
      console.error(createVehicle.data);
    }

    // Listar vehículos como Cliente (debe ver solo el suyo)
    const listVehiclesClient = await request('GET', '/vehicles', null, clientToken);
    const listClientOk = listVehiclesClient.status === 200 && listVehiclesClient.data.success && listVehiclesClient.data.data.vehicles.length >= 1;
    printResult('GET /api/vehicles (Client)', listClientOk, `Total: ${listVehiclesClient.data?.data?.vehicles?.length}`);

    // Listar vehículos como Admin (debe ver todos)
    const listVehiclesAdmin = await request('GET', '/vehicles', null, adminToken);
    const listAdminOk = listVehiclesAdmin.status === 200 && listVehiclesAdmin.data.success;
    printResult('GET /api/vehicles (Admin)', listAdminOk, `Total en BD: ${listVehiclesAdmin.data?.data?.vehicles?.length}`);

    // Obtener vehículo por ID
    const getVehicle = await request('GET', `/vehicles/${vehicleId}`, null, clientToken);
    const getVehicleOk = getVehicle.status === 200 && getVehicle.data.success && getVehicle.data.data.vehicle.id === vehicleId;
    printResult('GET /api/vehicles/:id', getVehicleOk, `Model: ${getVehicle.data?.data?.vehicle?.model}`);

    // Actualizar vehículo (cambiar color)
    const updateVehicle = await request('PUT', `/vehicles/${vehicleId}`, {
      color: 'Rojo Deportivo'
    }, clientToken);
    const updateVehicleOk = updateVehicle.status === 200 && updateVehicle.data.success && updateVehicle.data.data.vehicle.color === 'Rojo Deportivo';
    printResult('PUT /api/vehicles/:id (Actualizar color)', updateVehicleOk);

    // --------------------------------------------------------
    // 5. CITAS (APPOINTMENTS)
    // --------------------------------------------------------
    console.log('\n--- 5. Gestión de Citas ---');

    // Crear cita (como Cliente)
    const requestedDate = new Date();
    requestedDate.setDate(requestedDate.getDate() + 7); // Cita en una semana
    
    const createAppointment = await request('POST', '/appointments', {
      vehicle_id: vehicleId,
      requested_date: requestedDate.toISOString(),
      notes: 'Requiere revisión de frenos y cambio de aceite'
    }, clientToken);
    const createAppointOk = createAppointment.status === 201 && createAppointment.data.success;
    printResult('POST /api/appointments (Crear cita)', createAppointOk);
    if (createAppointOk) {
      appointmentId = createAppointment.data.data.appointment.id;
    } else {
      console.error(createAppointment.data);
    }

    // Obtener citas (como Admin)
    const listAppointments = await request('GET', '/appointments', null, adminToken);
    const listAppointOk = listAppointments.status === 200 && listAppointments.data.success;
    printResult('GET /api/appointments (Admin)', listAppointOk, `Total: ${listAppointments.data?.data?.appointments?.length}`);

    // Actualizar cita/Aprobar cita (como Admin)
    const approveAppointment = await request('PUT', `/appointments/${appointmentId}`, {
      status: 'approved',
      notes: 'Cita aprobada para el día solicitado'
    }, adminToken);
    const approveOk = approveAppointment.status === 200 && approveAppointment.data.success && approveAppointment.data.data.appointment.status === 'approved';
    printResult('PUT /api/appointments/:id (Aprobar cita por Admin)', approveOk);

    // --------------------------------------------------------
    // 6. ÓRDENES DE TRABAJO (WORK ORDERS)
    // --------------------------------------------------------
    console.log('\n--- 6. Gestión de Órdenes de Trabajo ---');

    // Crear Orden de Trabajo (solo Admin)
    const createWorkOrder = await request('POST', '/work-orders', {
      vehicle_id: vehicleId,
      estimated_hours: 4.5,
      notes: 'Revisión y mantenimiento preventivo'
    }, adminToken);
    const createWOrderOk = createWorkOrder.status === 201 && createWorkOrder.data.success;
    printResult('POST /api/work-orders (Crear orden - Admin)', createWOrderOk);
    if (createWOrderOk) {
      workOrderId = createWorkOrder.data.data.order.id;
    } else {
      console.error(createWorkOrder.data);
    }

    // Intentar crear orden como Cliente (debe fallar)
    const createWorkOrderClient = await request('POST', '/work-orders', {
      vehicle_id: vehicleId
    }, clientToken);
    printResult('POST /api/work-orders (Client - debe fallar)', createWorkOrderClient.status === 403, `Status esperado: 403, recibido: ${createWorkOrderClient.status}`);

    // Actualizar progreso y estado (Admin)
    const updateWorkOrder = await request('PUT', `/work-orders/${workOrderId}`, {
      status: 'diagnosis',
      progress_pct: 25,
      notes: 'Diagnóstico en progreso: se detectó desgaste en pastillas de freno delanteras'
    }, adminToken);
    const updateWOrderOk = updateWorkOrder.status === 200 && updateWorkOrder.data.success && updateWorkOrder.data.data.order.status === 'diagnosis';
    printResult('PUT /api/work-orders/:id (Actualizar progreso)', updateWOrderOk, `Progreso: ${updateWorkOrder.data?.data?.order?.progress_pct}%`);

    // Añadir Comentario/Historial (Admin)
    const addComment = await request('POST', `/work-orders/${workOrderId}/comments`, {
      comment: 'Se solicitó repuesto de pastillas de freno de cerámica'
    }, adminToken);
    const addCommentOk = addComment.status === 201 && addComment.data.success;
    printResult('POST /api/work-orders/:id/comments (Añadir comentario)', addCommentOk);

    // Obtener Historial de Servicio
    const getHistory = await request('GET', `/work-orders/${workOrderId}/history`, null, clientToken);
    const getHistoryOk = getHistory.status === 200 && getHistory.data.success && getHistory.data.data.history.length >= 1;
    printResult('GET /api/work-orders/:id/history', getHistoryOk, `Eventos: ${getHistory.data?.data?.history?.length}`);

    // --------------------------------------------------------
    // 7. COTIZACIONES (QUOTES)
    // --------------------------------------------------------
    console.log('\n--- 7. Gestión de Cotizaciones ---');

    // Crear cotización (solo Admin)
    const createQuote = await request('POST', '/quotes', {
      work_order_id: workOrderId,
      items: [
        { description: 'Pastillas de freno delanteras (Cerámica)', price: 45.50 },
        { description: 'Filtro de aceite sintético', price: 12.00 },
        { description: 'Mano de obra - Cambio de frenos y afinación', price: 60.00 }
      ]
    }, adminToken);
    const createQuoteOk = createQuote.status === 201 && createQuote.data.success;
    printResult('POST /api/quotes (Crear cotización - Admin)', createQuoteOk, `Total calculado: $${createQuote.data?.data?.quote?.total}`);
    if (createQuoteOk) {
      quoteId = createQuote.data.data.quote.id;
    } else {
      console.error(createQuote.data);
    }

    // Listar cotizaciones (Cliente)
    const listQuotes = await request('GET', '/quotes', null, clientToken);
    const listQuotesOk = listQuotes.status === 200 && listQuotes.data.success;
    printResult('GET /api/quotes (Client)', listQuotesOk, `Total: ${listQuotes.data?.data?.quotes?.length}`);

    // Aprobar cotización (Cliente)
    const approveQuote = await request('PUT', `/quotes/${quoteId}`, {
      status: 'approved'
    }, clientToken);
    const approveQuoteOk = approveQuote.status === 200 && approveQuote.data.success && approveQuote.data.data.quote.status === 'approved';
    printResult('PUT /api/quotes/:id (Aprobar cotización por Cliente)', approveQuoteOk);

  } catch (error) {
    console.error('💥 ERROR INESPERADO DURANTE LA PRUEBA:', error);
  } finally {
    // --------------------------------------------------------
    // 8. LIMPIEZA DE DATOS (CLEANUP)
    // --------------------------------------------------------
    console.log('\n--- 8. Limpieza de Datos ---');
    if (clientId || adminId) {
      try {
        console.log('Limpiando usuarios de prueba y sus cascadas en la base de datos...');
        const userIds = [];
        if (clientId) userIds.push(clientId);
        if (adminId) userIds.push(adminId);

        // Primero eliminar registros de historial de servicio para evitar violación de llave foránea (changed_by)
        await supabase
          .from('service_history')
          .delete()
          .in('changed_by', userIds);

        const { error } = await supabase
          .from('users')
          .delete()
          .in('id', userIds);

        if (error) {
          console.error('🔴 Error al eliminar usuarios de prueba de la BD:', error.message);
        } else {
          console.log('✅ Base de datos limpiada con éxito (usuarios y registros asociados eliminados).');
        }
      } catch (cleanErr) {
        console.error('🔴 Error durante el proceso de limpieza:', cleanErr);
      }
    } else {
      console.log('No se crearon usuarios, no se requiere limpieza.');
    }
    console.log('\n============================================================');
    console.log('🏁 FIN DE LAS PRUEBAS');
    console.log('============================================================\n');
  }
}

runTests();
