// TallerSync — Cliente de Pruebas API

// Estado global de la aplicación
const state = {
  user: null,
  token: null,
  activeTab: 'tab-auth',
  vehicles: [],
  workOrders: [],
  activeWorkOrder: null
};

// Inicialización cuando carga el DOM
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  checkApiHealth();
  initSession();
  bindAuthEvents();
  bindVehicleEvents();
  bindAppointmentEvents();
  bindWorkOrderEvents();
  bindQuoteEvents();
  
  // Botón para limpiar inspector
  document.getElementById('btn-clear-inspector').addEventListener('click', () => {
    const logsContainer = document.getElementById('inspector-logs');
    logsContainer.innerHTML = '<div class="empty-log-msg">Las solicitudes HTTP se mostrarán aquí en cuanto interactúes con la app.</div>';
  });
});

// --- CLIENTE API CON INSPECTOR INTEGRADO ---

async function apiCall(method, path, body = null) {
  const url = `${window.location.origin}/api${path}`;
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const startTime = Date.now();
  const logId = addInspectorRequestLog(method, url, headers, body);
  
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { text: await res.text() };
    }
    
    const duration = Date.now() - startTime;
    updateInspectorResponseLog(logId, res.status, res.statusText, data, duration);
    
    if (!res.ok) {
      throw { status: res.status, data };
    }
    
    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    const duration = Date.now() - startTime;
    updateInspectorResponseLog(logId, 500, 'Network Error', { success: false, message: err.message || 'Error de red/conexión' }, duration);
    throw { status: 500, data: { success: false, message: err.message || 'Error de conexión con el servidor' } };
  }
}

function addInspectorRequestLog(method, url, headers, body) {
  const logsContainer = document.getElementById('inspector-logs');
  const emptyMsg = logsContainer.querySelector('.empty-log-msg');
  if (emptyMsg) emptyMsg.remove();
  
  const logId = 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.id = logId;
  
  // Sanitizar token para mostrar en logs
  const headersSanitized = { ...headers };
  if (headersSanitized['Authorization']) {
    headersSanitized['Authorization'] = headersSanitized['Authorization'].substring(0, 15) + '...';
  }
  
  // Extraer ruta relativa
  const path = url.replace(window.location.origin, '');
  
  entry.innerHTML = `
    <div class="log-title-row">
      <span class="log-method method-${method}">${method}</span>
      <span class="log-url" title="${url}">${path}</span>
      <span class="log-status">PND</span>
    </div>
    <div class="log-details">
      <div class="log-section-title">Request Headers</div>
      <pre class="log-json">${JSON.stringify(headersSanitized, null, 2)}</pre>
      ${body ? `
        <div class="log-section-title">Request Body</div>
        <pre class="log-json">${JSON.stringify(body, null, 2)}</pre>
      ` : ''}
      <div class="log-response-area hidden">
        <div class="log-section-title">Response Body</div>
        <pre class="log-json log-res-body"></pre>
      </div>
    </div>
    <div class="log-time">Enviando...</div>
  `;
  
  logsContainer.insertBefore(entry, logsContainer.firstChild);
  return logId;
}

function updateInspectorResponseLog(logId, status, statusText, data, duration) {
  const entry = document.getElementById(logId);
  if (!entry) return;
  
  const statusSpan = entry.querySelector('.log-status');
  statusSpan.textContent = status;
  
  if (status >= 200 && status < 300) {
    statusSpan.className = 'log-status status-success';
  } else if (status >= 400 && status < 500) {
    statusSpan.className = 'log-status status-client-error';
  } else {
    statusSpan.className = 'log-status status-server-error';
  }
  
  const responseArea = entry.querySelector('.log-response-area');
  responseArea.classList.remove('hidden');
  
  const resBodyPre = entry.querySelector('.log-res-body');
  resBodyPre.textContent = JSON.stringify(data, null, 2);
  
  if (!data.success) {
    resBodyPre.classList.add('log-error-res');
  }
  
  const timeDiv = entry.querySelector('.log-time');
  timeDiv.textContent = `${new Date().toLocaleTimeString()} • ${duration}ms`;
}

// --- VERIFICAR SALUD DE LA API ---

async function checkApiHealth() {
  const healthBadge = document.getElementById('health-badge');
  try {
    const res = await fetch(`${window.location.origin}/health`);
    const data = await res.json();
    if (data.success) {
      healthBadge.textContent = 'API ONLINE';
      healthBadge.className = 'badge badge-success';
    } else {
      healthBadge.textContent = 'API ERROR';
      healthBadge.className = 'badge badge-danger';
    }
  } catch (e) {
    healthBadge.textContent = 'API OFFLINE';
    healthBadge.className = 'badge badge-danger';
  }
}

// --- NAVEGACIÓN POR PESTAÑAS ---

function initTabs() {
  const navItems = document.querySelectorAll('.nav-item');
  const panes = document.querySelectorAll('.tab-pane');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      panes.forEach(pane => pane.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
      
      state.activeTab = targetTab;
      onTabActivated(targetTab);
    });
  });
}

// Cargar datos específicos al cambiar de pestaña
function onTabActivated(tabId) {
  if (!state.token) return; // No hacer llamadas si no está autenticado
  
  switch(tabId) {
    case 'tab-vehicles':
      loadVehicles();
      break;
    case 'tab-appointments':
      loadAppointments();
      loadVehiclesDropdown('app-vehicle-id');
      break;
    case 'tab-workorders':
      loadWorkOrders();
      loadVehiclesDropdown('wo-vehicle-id');
      break;
    case 'tab-quotes':
      loadQuotes();
      loadWorkOrdersDropdown('q-workorder-id');
      break;
  }
}

// --- AUTENTICACIÓN Y SESIÓN ---

function initSession() {
  const savedToken = localStorage.getItem('token');
  if (savedToken) {
    state.token = savedToken;
    fetchMe();
  }
}

async function fetchMe() {
  try {
    const res = await apiCall('GET', '/auth/me');
    if (res.success && res.data.user) {
      state.user = res.data.user;
      updateUIForUser();
    } else {
      logout();
    }
  } catch (err) {
    logout();
  }
}

function updateUIForUser() {
  // Mostrar tarjeta de usuario en cabecera
  const statusCard = document.getElementById('user-status-card');
  const nameSpan = document.getElementById('user-name');
  const roleBadge = document.getElementById('user-role-badge');
  
  statusCard.classList.remove('hidden');
  nameSpan.textContent = state.user.full_name;
  roleBadge.textContent = state.user.role;
  roleBadge.className = `badge ${state.user.role === 'admin' ? 'badge-primary' : 'badge-info'}`;
  
  // Habilitar formularios y vistas específicas de rol
  const adminElements = document.querySelectorAll('.role-admin-only');
  const clientElements = document.querySelectorAll('.role-client-only');
  
  if (state.user.role === 'admin') {
    adminElements.forEach(el => el.classList.remove('hidden'));
    clientElements.forEach(el => el.classList.add('hidden'));
  } else {
    adminElements.forEach(el => el.classList.add('hidden'));
    clientElements.forEach(el => el.classList.remove('hidden'));
  }
  
  // Recargar la pestaña actual si requiere sesión
  onTabActivated(state.activeTab);
}

function logout() {
  localStorage.removeItem('token');
  state.token = null;
  state.user = null;
  
  document.getElementById('user-status-card').classList.add('hidden');
  
  // Ocultar zonas protegidas
  const adminElements = document.querySelectorAll('.role-admin-only');
  const clientElements = document.querySelectorAll('.role-client-only');
  adminElements.forEach(el => el.classList.add('hidden'));
  clientElements.forEach(el => el.classList.remove('hidden')); // Mostrar info de cliente por defecto
  
  // Limpiar listados
  document.getElementById('vehicles-list').innerHTML = '<div class="info-alert">Inicia sesión para listar vehículos.</div>';
  document.getElementById('appointments-list').innerHTML = '<div class="info-alert">Inicia sesión para ver las citas.</div>';
  document.getElementById('workorders-list').innerHTML = '<div class="info-alert">Inicia sesión para ver las órdenes.</div>';
  document.getElementById('quotes-list').innerHTML = '<div class="info-alert">Inicia sesión para ver las cotizaciones.</div>';
  document.getElementById('workorder-detail-section').classList.add('hidden');
  
  // Redirigir a pestaña de Auth
  const authTabBtn = document.querySelector('[data-tab="tab-auth"]');
  if (authTabBtn) authTabBtn.click();
}

function bindAuthEvents() {
  // Llenado rápido de credenciales
  document.getElementById('btn-fill-admin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-email').value = 'admin@test.com';
    document.getElementById('login-password').value = 'password123';
  });
  
  document.getElementById('btn-fill-client').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-email').value = 'client@test.com';
    document.getElementById('login-password').value = 'password123';
  });

  // Submit Login
  document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
      const res = await apiCall('POST', '/auth/login', { email, password });
      if (res.success && res.data.token) {
        state.token = res.data.token;
        state.user = res.data.user;
        localStorage.setItem('token', res.data.token);
        updateUIForUser();
        alert('Sesión iniciada con éxito.');
        // Cambiar a pestaña de Vehículos para empezar
        document.querySelector('[data-tab="tab-vehicles"]').click();
      }
    } catch (err) {
      alert('Error al iniciar sesión: ' + (err.data?.message || 'Credenciales inválidas'));
    }
  });

  // Submit Registro
  document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const full_name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const role = document.getElementById('reg-role').value;
    
    try {
      const res = await apiCall('POST', '/auth/register', { full_name, email, phone, password, role });
      if (res.success) {
        alert('Usuario registrado con éxito. Ahora puedes iniciar sesión.');
        document.getElementById('login-email').value = email;
        document.getElementById('login-password').value = password;
        document.getElementById('form-register').reset();
      }
    } catch (err) {
      alert('Error en registro: ' + (err.data?.message || 'Datos inválidos'));
    }
  });

  // Botón Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    logout();
    alert('Sesión cerrada.');
  });
}

// --- MÓDULO VEHÍCULOS ---

async function loadVehicles() {
  const listContainer = document.getElementById('vehicles-list');
  listContainer.innerHTML = '<div class="info-alert">Cargando vehículos...</div>';
  
  try {
    const res = await apiCall('GET', '/vehicles');
    if (res.success) {
      state.vehicles = res.data.vehicles;
      
      if (state.vehicles.length === 0) {
        listContainer.innerHTML = '<div class="info-alert">No hay vehículos registrados.</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      state.vehicles.forEach(veh => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="item-details">
            <h4>${veh.brand} ${veh.model} (${veh.year})</h4>
            <p>Placa: <strong>${veh.plate}</strong> | Color: ${veh.color || 'No especificado'}</p>
            ${veh.owner ? `<p class="item-meta">Propietario: ${veh.owner.full_name} (${veh.owner.email})</p>` : ''}
          </div>
          <div class="item-actions">
            <button class="btn btn-xs btn-outline btn-edit-veh" data-id="${veh.id}">Editar</button>
            ${state.user.role === 'admin' ? `<button class="btn btn-xs btn-outline-danger btn-delete-veh" data-id="${veh.id}">Eliminar</button>` : ''}
          </div>
        `;
        listContainer.appendChild(item);
      });
      
      // Enlazar botones de acción
      document.querySelectorAll('.btn-edit-veh').forEach(btn => {
        btn.addEventListener('click', () => {
          const vehId = btn.getAttribute('data-id');
          setupEditVehicle(vehId);
        });
      });
      
      document.querySelectorAll('.btn-delete-veh').forEach(btn => {
        btn.addEventListener('click', () => {
          const vehId = btn.getAttribute('data-id');
          deleteVehicle(vehId);
        });
      });
    }
  } catch (err) {
    listContainer.innerHTML = `<div class="info-alert text-danger">Error: ${err.data?.message || 'No se pudieron cargar los vehículos'}</div>`;
  }
}

function setupEditVehicle(id) {
  const veh = state.vehicles.find(v => v.id === id);
  if (!veh) return;
  
  document.getElementById('vehicle-id').value = veh.id;
  document.getElementById('veh-brand').value = veh.brand;
  document.getElementById('veh-model').value = veh.model;
  document.getElementById('veh-year').value = veh.year;
  document.getElementById('veh-plate').value = veh.plate;
  document.getElementById('veh-color').value = veh.color || '';
  
  document.getElementById('vehicle-form-title').textContent = 'Editar Vehículo';
  document.getElementById('btn-cancel-edit-vehicle').classList.remove('hidden');
}

function clearVehicleForm() {
  document.getElementById('form-vehicle').reset();
  document.getElementById('vehicle-id').value = '';
  document.getElementById('vehicle-form-title').textContent = 'Registrar Vehículo';
  document.getElementById('btn-cancel-edit-vehicle').classList.add('hidden');
}

function bindVehicleEvents() {
  // Refresh
  document.getElementById('btn-refresh-vehicles').addEventListener('click', loadVehicles);
  
  // Cancel Edit
  document.getElementById('btn-cancel-edit-vehicle').addEventListener('click', clearVehicleForm);
  
  // Submit Form
  document.getElementById('form-vehicle').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vehicle-id').value;
    const brand = document.getElementById('veh-brand').value;
    const model = document.getElementById('veh-model').value;
    const year = parseInt(document.getElementById('veh-year').value);
    const plate = document.getElementById('veh-plate').value;
    const color = document.getElementById('veh-color').value;
    
    const payload = { brand, model, year, plate, color };
    
    try {
      let res;
      if (id) {
        // Editar
        res = await apiCall('PUT', `/vehicles/${id}`, payload);
      } else {
        // Registrar nuevo
        res = await apiCall('POST', '/vehicles', payload);
      }
      
      if (res.success) {
        alert(id ? 'Vehículo actualizado con éxito' : 'Vehículo registrado con éxito');
        clearVehicleForm();
        loadVehicles();
      }
    } catch (err) {
      alert('Error al guardar vehículo: ' + (err.data?.message || 'Datos incorrectos'));
    }
  });
}

async function deleteVehicle(id) {
  if (!confirm('¿Estás seguro de eliminar este vehículo? Esto borrará sus citas y órdenes asociadas.')) return;
  
  try {
    const res = await apiCall('DELETE', `/vehicles/${id}`);
    if (res.success) {
      alert('Vehículo eliminado con éxito.');
      loadVehicles();
    }
  } catch (err) {
    alert('Error al eliminar vehículo: ' + (err.data?.message || 'Acceso denegado'));
  }
}

// --- MÓDULO CITAS ---

async function loadAppointments() {
  const listContainer = document.getElementById('appointments-list');
  listContainer.innerHTML = '<div class="info-alert">Cargando citas...</div>';
  
  try {
    const res = await apiCall('GET', '/appointments');
    if (res.success) {
      const appointments = res.data.appointments;
      
      if (appointments.length === 0) {
        listContainer.innerHTML = '<div class="info-alert">No hay citas registradas.</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      appointments.forEach(app => {
        const localDate = new Date(app.requested_date).toLocaleString();
        
        let statusBadgeClass = 'badge-warning';
        if (app.status === 'approved') statusBadgeClass = 'badge-success';
        if (app.status === 'rejected') statusBadgeClass = 'badge-danger';
        
        const vehicleInfo = app.vehicle 
          ? `${app.vehicle.brand} ${app.vehicle.model} [${app.vehicle.plate}]`
          : 'Vehículo no disponible';
          
        const clientInfo = app.user && state.user.role === 'admin'
          ? `<p class="item-meta">Cliente: ${app.user.full_name} (${app.user.email})</p>`
          : '';
          
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="item-details">
            <h4>${vehicleInfo}</h4>
            <p>Fecha: <strong>${localDate}</strong></p>
            <p>Notas: ${app.notes || 'Ninguna'}</p>
            ${clientInfo}
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
            <span class="badge ${statusBadgeClass}">${app.status}</span>
            <div class="item-actions">
              ${state.user.role === 'admin' && app.status === 'pending' ? `
                <button class="btn btn-xs btn-outline btn-app-status" data-id="${app.id}" data-status="approved">Aprobar</button>
                <button class="btn btn-xs btn-outline-danger btn-app-status" data-id="${app.id}" data-status="rejected">Rechazar</button>
              ` : ''}
              ${state.user.role === 'client' && app.status === 'pending' ? `
                <button class="btn btn-xs btn-outline-danger btn-app-status" data-id="${app.id}" data-status="rejected">Cancelar</button>
              ` : ''}
              ${state.user.role === 'admin' ? `
                <button class="btn btn-xs btn-outline-danger btn-delete-app" data-id="${app.id}">Eliminar</button>
              ` : ''}
            </div>
          </div>
        `;
        listContainer.appendChild(item);
      });
      
      // Eventos para cambiar estado
      document.querySelectorAll('.btn-app-status').forEach(btn => {
        btn.addEventListener('click', () => {
          const appId = btn.getAttribute('data-id');
          const nextStatus = btn.getAttribute('data-status');
          updateAppointmentStatus(appId, nextStatus);
        });
      });
      
      // Evento para eliminar
      document.querySelectorAll('.btn-delete-app').forEach(btn => {
        btn.addEventListener('click', () => {
          const appId = btn.getAttribute('data-id');
          deleteAppointment(appId);
        });
      });
    }
  } catch (err) {
    listContainer.innerHTML = `<div class="info-alert text-danger">Error: ${err.data?.message || 'No se pudieron cargar las citas'}</div>`;
  }
}

async function updateAppointmentStatus(id, status) {
  const notes = status === 'approved' ? 'Aprobada por administrador' : 'Cancelada/Rechazada';
  try {
    const res = await apiCall('PUT', `/appointments/${id}`, { status, notes });
    if (res.success) {
      alert(`Cita marcada como: ${status}`);
      loadAppointments();
    }
  } catch (err) {
    alert('Error al actualizar cita: ' + (err.data?.message || 'Permiso denegado'));
  }
}

async function deleteAppointment(id) {
  if (!confirm('¿Desea eliminar este registro de cita definitivamente?')) return;
  try {
    const res = await apiCall('DELETE', `/appointments/${id}`);
    if (res.success) {
      alert('Cita eliminada.');
      loadAppointments();
    }
  } catch (err) {
    alert('Error al eliminar: ' + (err.data?.message || 'Permiso denegado'));
  }
}

function bindAppointmentEvents() {
  document.getElementById('btn-refresh-appointments').addEventListener('click', loadAppointments);
  
  // Crear cita
  document.getElementById('form-appointment').addEventListener('submit', async (e) => {
    e.preventDefault();
    const vehicle_id = document.getElementById('app-vehicle-id').value;
    const dateInput = document.getElementById('app-date').value;
    const notes = document.getElementById('app-notes').value;
    
    if (!vehicle_id) {
      alert('Debes seleccionar un vehículo');
      return;
    }
    
    // Convertir a ISO
    const requested_date = new Date(dateInput).toISOString();
    
    try {
      const res = await apiCall('POST', '/appointments', { vehicle_id, requested_date, notes });
      if (res.success) {
        alert('Cita solicitada con éxito. Pendiente de aprobación.');
        document.getElementById('form-appointment').reset();
        loadAppointments();
      }
    } catch (err) {
      alert('Error al crear cita: ' + (err.data?.message || 'Verifica los campos'));
    }
  });
}

// --- MÓDULO ÓRDENES DE TRABAJO ---

async function loadWorkOrders() {
  const listContainer = document.getElementById('workorders-list');
  listContainer.innerHTML = '<div class="info-alert">Cargando órdenes...</div>';
  
  try {
    const res = await apiCall('GET', '/work-orders');
    if (res.success) {
      state.workOrders = res.data.orders;
      
      if (state.workOrders.length === 0) {
        listContainer.innerHTML = '<div class="info-alert">No hay órdenes de trabajo activas.</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      state.workOrders.forEach(order => {
        const vehicleInfo = order.vehicle
          ? `${order.vehicle.brand} ${order.vehicle.model} [${order.vehicle.plate}]`
          : 'Vehículo no disponible';
          
        const clientInfo = order.vehicle?.owner
          ? `<p class="item-meta">Cliente: ${order.vehicle.owner.full_name}</p>`
          : '';
          
        const progress = order.progress_pct || 0;
        
        let statusBadgeClass = 'badge-warning';
        if (order.status === 'done') statusBadgeClass = 'badge-success';
        if (order.status === 'repair' || order.status === 'testing') statusBadgeClass = 'badge-info';
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
          <div class="item-details" style="flex:1;">
            <h4>Orden de Trabajo #${order.id.substring(0,8)}</h4>
            <p>Vehículo: <strong>${vehicleInfo}</strong></p>
            ${clientInfo}
            <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
              <span class="badge ${statusBadgeClass}">${order.status}</span>
              <span style="font-size:12px; color:var(--text-secondary)">Avance: ${progress}%</span>
            </div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
            <span style="font-weight:700; color:var(--success);">$${(order.total_cost || 0).toFixed(2)}</span>
            <button class="btn btn-xs btn-primary btn-view-wo-detail" data-id="${order.id}">Ver Detalles</button>
          </div>
        `;
        listContainer.appendChild(item);
      });
      
      // Enlazar evento Ver Detalles
      document.querySelectorAll('.btn-view-wo-detail').forEach(btn => {
        btn.addEventListener('click', () => {
          const woId = btn.getAttribute('data-id');
          viewWorkOrderDetail(woId);
        });
      });
    }
  } catch (err) {
    listContainer.innerHTML = `<div class="info-alert text-danger">Error: ${err.data?.message || 'No se pudieron cargar las órdenes'}</div>`;
  }
}

async function viewWorkOrderDetail(id) {
  const detailSection = document.getElementById('workorder-detail-section');
  detailSection.classList.remove('hidden');
  
  // Buscar orden localmente
  const order = state.workOrders.find(o => o.id === id);
  if (!order) return;
  
  state.activeWorkOrder = order;
  
  // Actualizar UI básica
  document.getElementById('wo-detail-title').textContent = `Detalle de la Orden #${order.id.substring(0, 8)}`;
  
  const statusBadge = document.getElementById('wo-detail-status-badge');
  statusBadge.textContent = order.status;
  
  let statusClass = 'badge-warning';
  if (order.status === 'done') statusClass = 'badge-success';
  if (order.status === 'repair' || order.status === 'testing') statusClass = 'badge-info';
  statusBadge.className = `badge ${statusClass}`;
  
  document.getElementById('wo-detail-progress-label').textContent = `${order.progress_pct}%`;
  document.getElementById('wo-detail-progress-fill').style.width = `${order.progress_pct}%`;
  
  // Rellenar formulario de actualización si es admin
  if (state.user.role === 'admin') {
    document.getElementById('update-wo-id').value = order.id;
    document.getElementById('update-wo-status').value = order.status;
    document.getElementById('update-wo-progress').value = order.progress_pct;
    document.getElementById('update-wo-cost').value = order.total_cost || '';
    document.getElementById('update-wo-notes').value = '';
  }
  
  // Desplazar hacia el detalle
  detailSection.scrollIntoView({ behavior: 'smooth' });
  
  // Cargar Historial
  loadWorkOrderHistory(id);
}

async function loadWorkOrderHistory(id) {
  const historyList = document.getElementById('wo-history-list');
  historyList.innerHTML = '<div class="info-alert">Cargando historial...</div>';
  
  try {
    const res = await apiCall('GET', `/work-orders/${id}/history`);
    if (res.success) {
      const history = res.data.history;
      if (history.length === 0) {
        historyList.innerHTML = '<div class="info-alert">No hay eventos registrados.</div>';
        return;
      }
      
      historyList.innerHTML = '';
      history.forEach(log => {
        const time = new Date(log.created_at).toLocaleString();
        const user = log.changed_by_user ? log.changed_by_user.full_name : 'Sistema';
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
          <div class="history-header">
            <span class="history-by">${user}</span>
            <span>${time}</span>
          </div>
          ${log.old_status !== log.new_status ? `
            <div class="history-status-change">
              Estado cambiado de <strong>${log.old_status}</strong> a <strong>${log.new_status}</strong>
            </div>
          ` : ''}
          ${log.comment ? `<div class="history-comment">"${log.comment}"</div>` : ''}
        `;
        historyList.appendChild(historyItem);
      });
    }
  } catch (err) {
    historyList.innerHTML = `<div class="info-alert text-danger">Error al cargar historial</div>`;
  }
}

function bindWorkOrderEvents() {
  document.getElementById('btn-refresh-workorders').addEventListener('click', loadWorkOrders);
  
  document.getElementById('btn-close-wo-detail').addEventListener('click', () => {
    document.getElementById('workorder-detail-section').classList.add('hidden');
    state.activeWorkOrder = null;
  });
  
  // Slider progress text update
  const progressSlider = document.getElementById('update-wo-progress');
  if (progressSlider) {
    progressSlider.addEventListener('input', (e) => {
      // Opcional: mostrar valor mientras arrastra
    });
  }
  
  // Crear orden (Admin)
  document.getElementById('form-workorder').addEventListener('submit', async (e) => {
    e.preventDefault();
    const vehicle_id = document.getElementById('wo-vehicle-id').value;
    const hours = document.getElementById('wo-hours').value;
    const notes = document.getElementById('wo-notes').value;
    
    if (!vehicle_id) {
      alert('Seleccione un vehículo');
      return;
    }
    
    const payload = {
      vehicle_id,
      notes,
      estimated_hours: hours ? parseFloat(hours) : undefined
    };
    
    try {
      const res = await apiCall('POST', '/work-orders', payload);
      if (res.success) {
        alert('Orden de trabajo abierta con éxito.');
        document.getElementById('form-workorder').reset();
        loadWorkOrders();
      }
    } catch (err) {
      alert('Error: ' + (err.data?.message || 'Acceso denegado'));
    }
  });

  // Actualizar orden (Admin)
  document.getElementById('form-update-workorder').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('update-wo-id').value;
    const status = document.getElementById('update-wo-status').value;
    const progress_pct = parseInt(document.getElementById('update-wo-progress').value);
    const total_cost_input = document.getElementById('update-wo-cost').value;
    const notes = document.getElementById('update-wo-notes').value;
    
    const payload = {
      status,
      progress_pct,
      notes: notes || `Orden actualizada a ${status} con progreso ${progress_pct}%`,
      total_cost: total_cost_input ? parseFloat(total_cost_input) : undefined
    };
    
    try {
      const res = await apiCall('PUT', `/work-orders/${id}`, payload);
      if (res.success) {
        alert('Orden de trabajo actualizada con éxito.');
        loadWorkOrders();
        viewWorkOrderDetail(id); // Recargar panel de detalles
      }
    } catch (err) {
      alert('Error al actualizar: ' + (err.data?.message || 'Acceso denegado'));
    }
  });

  // Agregar comentario (Admin)
  document.getElementById('form-add-comment').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!state.activeWorkOrder) return;
    
    const id = state.activeWorkOrder.id;
    const comment = document.getElementById('wo-new-comment').value;
    
    try {
      const res = await apiCall('POST', `/work-orders/${id}/comments`, { comment });
      if (res.success) {
        document.getElementById('wo-new-comment').value = '';
        loadWorkOrderHistory(id); // Recargar logs
      }
    } catch (err) {
      alert('Error al agregar nota: ' + (err.data?.message || 'No autorizado'));
    }
  });
}

// --- MÓDULO COTIZACIONES ---

async function loadQuotes() {
  const listContainer = document.getElementById('quotes-list');
  listContainer.innerHTML = '<div class="info-alert">Cargando cotizaciones...</div>';
  
  try {
    const res = await apiCall('GET', '/quotes');
    if (res.success) {
      const quotes = res.data.quotes;
      
      if (quotes.length === 0) {
        listContainer.innerHTML = '<div class="info-alert">No hay cotizaciones registradas.</div>';
        return;
      }
      
      listContainer.innerHTML = '';
      quotes.forEach(quote => {
        let statusClass = 'badge-warning';
        if (quote.status === 'approved') statusClass = 'badge-success';
        if (quote.status === 'rejected') statusClass = 'badge-danger';
        if (quote.status === 'sent') statusClass = 'badge-info';
        
        const vehiclePlate = quote.work_order?.vehicle?.plate || 'S/N';
        const workOrderId = quote.work_order_id.substring(0,8);
        
        // Generar filas para los ítems
        let itemsHtml = '';
        if (quote.items && quote.items.length > 0) {
          itemsHtml = `
            <div class="quote-details-box">
              <table>
                <thead>
                  <tr><th>Descripción</th><th style="text-align:right;">Precio</th></tr>
                </thead>
                <tbody>
                  ${quote.items.map(it => `<tr><td>${it.description}</td><td style="text-align:right;">$${it.price.toFixed(2)}</td></tr>`).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
        
        const item = document.createElement('div');
        item.className = 'list-item';
        item.style.flexDirection = 'column';
        item.style.alignItems = 'stretch';
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <h4 style="margin:0;">Cotización para Orden #${workOrderId}</h4>
              <p style="margin-top:2px;">Placa Vehículo: <strong>${vehiclePlate}</strong></p>
            </div>
            <div style="text-align:right;">
              <span class="badge ${statusClass}">${quote.status}</span>
              <div style="font-weight:700; color:var(--success); font-size:16px; margin-top:4px;">$${(quote.total || 0).toFixed(2)}</div>
            </div>
          </div>
          ${itemsHtml}
          <div class="item-actions" style="margin-top:10px; justify-content:flex-end;">
            ${state.user.role === 'client' && quote.status === 'sent' ? `
              <button class="btn btn-xs btn-primary btn-quote-action" data-id="${quote.id}" data-status="approved">Aprobar</button>
              <button class="btn btn-xs btn-outline-danger btn-quote-action" data-id="${quote.id}" data-status="rejected">Rechazar</button>
            ` : ''}
            ${state.user.role === 'admin' && quote.status === 'draft' ? `
              <button class="btn btn-xs btn-secondary btn-quote-action" data-id="${quote.id}" data-status="sent">Enviar al Cliente</button>
            ` : ''}
          </div>
        `;
        listContainer.appendChild(item);
      });
      
      // Enlazar acciones de cotización
      document.querySelectorAll('.btn-quote-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const quoteId = btn.getAttribute('data-id');
          const nextStatus = btn.getAttribute('data-status');
          updateQuoteStatus(quoteId, nextStatus);
        });
      });
    }
  } catch (err) {
    listContainer.innerHTML = `<div class="info-alert text-danger">Error: ${err.data?.message || 'No se pudieron cargar cotizaciones'}</div>`;
  }
}

async function updateQuoteStatus(id, status) {
  try {
    const res = await apiCall('PUT', `/quotes/${id}`, { status });
    if (res.success) {
      alert(`Cotización actualizada a: ${status}`);
      loadQuotes();
      if (state.activeTab === 'tab-workorders' && state.activeWorkOrder) {
        // Recargar si estamos en detalles de la orden
        viewWorkOrderDetail(state.activeWorkOrder.id);
      }
    }
  } catch (err) {
    alert('Error al responder cotización: ' + (err.data?.message || 'Permiso denegado'));
  }
}

function bindQuoteEvents() {
  document.getElementById('btn-refresh-quotes').addEventListener('click', loadQuotes);
  
  // Agregar fila de ítems
  document.getElementById('btn-add-quote-item').addEventListener('click', () => {
    const container = document.getElementById('quote-items-container');
    const newRow = document.createElement('div');
    newRow.className = 'quote-item-row';
    newRow.innerHTML = `
      <input type="text" class="item-desc" required placeholder="Descripción del trabajo/repuesto">
      <input type="number" class="item-price" required step="0.01" min="0" placeholder="0.00">
      <button type="button" class="btn-remove-item" onclick="removeQuoteRow(this)">Quitar</button>
    `;
    container.appendChild(newRow);
    bindQuoteItemsCalculation();
  });
  
  // Enviar Cotización
  document.getElementById('form-quote').addEventListener('submit', async (e) => {
    e.preventDefault();
    const work_order_id = document.getElementById('q-workorder-id').value;
    
    if (!work_order_id) {
      alert('Seleccione una orden de trabajo');
      return;
    }
    
    // Obtener ítems
    const rows = document.querySelectorAll('.quote-item-row');
    const items = [];
    
    rows.forEach(row => {
      const desc = row.querySelector('.item-desc').value;
      const price = parseFloat(row.querySelector('.item-price').value);
      if (desc && !isNaN(price)) {
        items.push({ description: desc, price });
      }
    });
    
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem');
      return;
    }
    
    try {
      const res = await apiCall('POST', '/quotes', { work_order_id, items });
      if (res.success) {
        alert('Cotización creada con éxito.');
        // Limpiar formulario y restablecer una sola fila
        document.getElementById('form-quote').reset();
        const container = document.getElementById('quote-items-container');
        container.innerHTML = `
          <div class="quote-item-row">
            <input type="text" class="item-desc" required placeholder="Descripción del trabajo/repuesto">
            <input type="number" class="item-price" required step="0.01" min="0" placeholder="0.00">
            <button type="button" class="btn-remove-item" onclick="removeQuoteRow(this)">Quitar</button>
          </div>
        `;
        document.getElementById('quote-total-val').textContent = '$0.00';
        loadQuotes();
      }
    } catch (err) {
      alert('Error al crear cotización: ' + (err.data?.message || 'Acceso denegado'));
    }
  });

  bindQuoteItemsCalculation();
}

function removeQuoteRow(button) {
  const row = button.closest('.quote-item-row');
  const container = document.getElementById('quote-items-container');
  if (container.children.length > 1) {
    row.remove();
    calculateQuoteTotal();
  } else {
    alert('Debe tener al menos un ítem');
  }
}

function bindQuoteItemsCalculation() {
  const priceInputs = document.querySelectorAll('.item-price');
  priceInputs.forEach(input => {
    input.removeEventListener('input', calculateQuoteTotal);
    input.addEventListener('input', calculateQuoteTotal);
  });
}

function calculateQuoteTotal() {
  const priceInputs = document.querySelectorAll('.item-price');
  let total = 0;
  priceInputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) {
      total += val;
    }
  });
  document.getElementById('quote-total-val').textContent = `$${total.toFixed(2)}`;
}

// --- SELECT DROPDOWN HELPERS ---

async function loadVehiclesDropdown(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  try {
    const res = await apiCall('GET', '/vehicles');
    if (res.success) {
      const vehicles = res.data.vehicles;
      // Guardar opción por defecto
      const defaultOption = select.options[0];
      select.innerHTML = '';
      select.appendChild(defaultOption);
      
      vehicles.forEach(v => {
        const option = document.createElement('option');
        option.value = v.id;
        option.textContent = `${v.brand} ${v.model} (${v.plate})`;
        select.appendChild(option);
      });
    }
  } catch (err) {
    // Silencioso o logueado en inspector
  }
}

async function loadWorkOrdersDropdown(elementId) {
  const select = document.getElementById(elementId);
  if (!select) return;
  
  try {
    const res = await apiCall('GET', '/work-orders');
    if (res.success) {
      const orders = res.data.orders;
      const defaultOption = select.options[0];
      select.innerHTML = '';
      select.appendChild(defaultOption);
      
      orders.forEach(o => {
        const vehiclePlate = o.vehicle ? o.vehicle.plate : 'S/N';
        const option = document.createElement('option');
        option.value = o.id;
        option.textContent = `Orden #${o.id.substring(0,8)} - Vehículo: ${vehiclePlate}`;
        select.appendChild(option);
      });
    }
  } catch (err) {
    // Fallback
  }
}
