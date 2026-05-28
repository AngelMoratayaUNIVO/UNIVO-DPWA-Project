# Guía de Integración para el Frontend (Vue)

Esta guía es para el integrante que desarrollará el frontend en Vue.  
El backend ya está completo y funcionando.

---

## URL base de la API

```
http://localhost:3000/api      ← desarrollo local
https://<dominio-aws>/api      ← producción
```

---

## Autenticación

La API usa **JWT (JSON Web Token)**. El flujo es:

1. El usuario llama a `/api/auth/login` con email y password.
2. La API devuelve un `token`.
3. Todas las peticiones siguientes deben incluir ese token en el header:

```
Authorization: Bearer <token>
```

### Guardar el token en Vue

```javascript
// Después del login
const response = await axios.post('/api/auth/login', { email, password })
const token = response.data.data.token
localStorage.setItem('token', token)

// Configurar Axios globalmente para siempre enviar el token
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
```

---

## Roles de usuario

| Rol | Descripción |
|---|---|
| `admin` | Empleado del taller. Ve y gestiona todo. |
| `client` | Dueño del vehículo. Solo ve y actúa sobre sus propios datos. |

El rol viene dentro del token JWT y también en la respuesta del login:
```json
{
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "...",
      "role": "client",
      "full_name": "..."
    }
  }
}
```

Usar el `role` para mostrar/ocultar partes de la interfaz en Vue.

---

## Estructura de respuestas

Todas las respuestas son consistentes:

```json
// Éxito
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Descripción del error" }
```

Ejemplo de manejo en Vue:
```javascript
try {
  const res = await axios.get('/api/vehicles')
  const vehicles = res.data.data.vehicles
} catch (err) {
  const message = err.response?.data?.message || 'Error desconocido'
  // Mostrar mensaje al usuario
}
```

---

## Referencia rápida de endpoints

### Autenticación

```
POST /api/auth/register   { full_name, email, password, role?, phone? }
POST /api/auth/login      { email, password }
GET  /api/auth/me
```

### Vehículos

```
GET    /api/vehicles
GET    /api/vehicles/:id
POST   /api/vehicles      { brand, model, year, plate, color? }
PUT    /api/vehicles/:id  { brand?, model?, year?, plate?, color? }
DELETE /api/vehicles/:id  ← solo admin
```

### Órdenes de trabajo

```
GET  /api/work-orders
GET  /api/work-orders/:id
POST /api/work-orders     { vehicle_id, estimated_hours?, notes? }    ← solo admin
PUT  /api/work-orders/:id { status?, progress_pct?, estimated_hours?, total_cost?, notes? }  ← solo admin

Estados válidos: waiting | diagnosis | repair | testing | done

GET  /api/work-orders/:id/history
POST /api/work-orders/:id/comments   { comment }   ← solo admin
```

### Citas

```
GET  /api/appointments
GET  /api/appointments/:id
POST /api/appointments    { vehicle_id, requested_date, notes? }
                          requested_date en formato ISO: "2026-03-15T10:00:00Z"
PUT  /api/appointments/:id { status?, requested_date?, notes? }
     Admin puede poner status: pending | approved | rejected
     Cliente solo puede poner status: rejected (cancelar)
DELETE /api/appointments/:id   ← solo admin
```

### Cotizaciones

```
GET  /api/quotes
GET  /api/quotes?work_order_id=<uuid>   ← filtrar por orden
GET  /api/quotes/:id
POST /api/quotes    { work_order_id, items: [{ description, price }] }  ← solo admin
PUT  /api/quotes/:id
     Admin: { items?, status? }  — status: draft | sent | approved | rejected
     Cliente: { status: "approved" | "rejected" }   ← solo puede responder
```

---

## Datos que devuelven las respuestas (ejemplos)

### Orden de trabajo (con relaciones)
```json
{
  "id": "uuid",
  "status": "repair",
  "progress_pct": 60,
  "estimated_hours": 4,
  "total_cost": 85.50,
  "notes": "...",
  "vehicle": {
    "id": "uuid",
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "plate": "P123-456",
    "owner": {
      "id": "uuid",
      "full_name": "Juan Pérez",
      "email": "juan@email.com"
    }
  }
}
```

### Historial de una orden
```json
[
  {
    "id": "uuid",
    "old_status": "waiting",
    "new_status": "diagnosis",
    "comment": "Estado actualizado de \"waiting\" a \"diagnosis\"",
    "created_at": "2026-03-01T14:30:00Z",
    "changed_by_user": {
      "id": "uuid",
      "full_name": "Admin Taller",
      "role": "admin"
    }
  }
]
```

### Cotización
```json
{
  "id": "uuid",
  "status": "sent",
  "total": 37.50,
  "items": [
    { "description": "Cambio de aceite", "price": 25.00 },
    { "description": "Filtro de aire", "price": 12.50 }
  ],
  "work_order": { ... }
}
```

---

## Códigos de error HTTP comunes

| Código | Significa |
|---|---|
| `400` | Datos inválidos (campo faltante, formato incorrecto) |
| `401` | No autenticado (token faltante o expirado) |
| `403` | Sin permiso (rol incorrecto o recurso ajeno) |
| `404` | Recurso no encontrado |
| `409` | Conflicto (ej: email o placa ya registrada) |
| `500` | Error interno del servidor |
