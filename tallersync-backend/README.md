# TallerSync — Backend API

Sistema web de gestión y seguimiento de vehículos para talleres mecánicos.  
Este repositorio contiene únicamente el **backend** (Node.js + Express + Supabase).  
El frontend en Vue será desarrollado por otro integrante del equipo.

---

## Tecnologías utilizadas

| Herramienta | Versión | Uso |
|---|---|---|
| Node.js | 18+ | Entorno de ejecución |
| Express | 5.x | Framework HTTP |
| Supabase | — | Base de datos PostgreSQL en la nube |
| JWT (jsonwebtoken) | — | Autenticación por token |
| bcryptjs | — | Hash de contraseñas |
| Joi | — | Validación de datos de entrada |

---

## Requisitos previos

- Node.js v18 o superior instalado
- Una cuenta en [supabase.com](https://supabase.com) con un proyecto creado
- Git

---

## Configuración inicial (paso a paso)

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd tallersync-backend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Crear el archivo de variables de entorno

```bash
cp .env.example .env
```

### 4. Crear las tablas en Supabase

1. Entrar al [Dashboard de Supabase](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a **SQL Editor**
4. Copiar y pegar el contenido del archivo `supabase_schema.sql`
5. Hacer clic en **Run**

### 5. Ejecutar el servidor

```bash
# Modo desarrollo (reinicia automáticamente al guardar cambios)
npm run dev

# Modo producción
npm start
```

El servidor estará disponible en: `http://localhost:3000`  
Verificar que funciona: `http://localhost:3000/health`

---

## Estructura del proyecto

```
tallersync-backend/
├── server.js                  # Punto de entrada — inicia el servidor
├── .env.example               # Plantilla de variables de entorno
├── supabase_schema.sql        # Script SQL para crear las tablas
└── src/
    ├── app.js                 # Configuración de Express, middlewares, rutas
    ├── config/
    │   └── supabase.js        # Cliente de conexión a Supabase
    ├── routes/                # Define las URLs de cada módulo
    ├── controllers/           # Recibe la petición HTTP y devuelve la respuesta
    ├── services/              # Lógica de negocio y reglas de acceso por rol
    ├── models/                # Consultas directas a la base de datos (Supabase)
    └── validators/            # Validación de datos de entrada con Joi
```

**Flujo de una petición:**
```
Cliente HTTP → routes → middlewares (JWT, rol) → controller → service → model → Supabase
```

---

## Endpoints disponibles

> Todas las rutas excepto `/health`, `/api/auth/register` y `/api/auth/login` requieren el header:
> `Authorization: Bearer <token>`

### Auth — `/api/auth`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/register` | Público | Registrar nuevo usuario |
| POST | `/login` | Público | Iniciar sesión, devuelve token JWT |
| GET | `/me` | Autenticado | Ver datos del usuario actual |

**Roles disponibles:** `admin` (taller) y `client` (cliente)

---

### Vehículos — `/api/vehicles`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Admin / Client | Admin ve todos; cliente ve solo los suyos |
| GET | `/:id` | Admin / Client | Ver un vehículo específico |
| POST | `/` | Admin / Client | Registrar vehículo (se asigna al usuario actual) |
| PUT | `/:id` | Admin / Client | Editar (cliente solo los suyos) |
| DELETE | `/:id` | Admin | Eliminar vehículo |

---

### Órdenes de trabajo — `/api/work-orders`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Admin / Client | Admin ve todas; cliente ve solo las suyas |
| GET | `/:id` | Admin / Client | Ver una orden específica |
| POST | `/` | Admin | Crear orden de trabajo para un vehículo |
| PUT | `/:id` | Admin | Actualizar estado, progreso, costo |
| GET | `/:id/history` | Admin / Client | Ver historial de cambios de la orden |
| POST | `/:id/comments` | Admin | Agregar comentario al historial |

**Estados válidos del vehículo:**  
`waiting` → `diagnosis` → `repair` → `testing` → `done`

> Cada cambio de estado queda registrado automáticamente en el historial.

---

### Citas — `/api/appointments`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Admin / Client | Admin ve todas; cliente ve solo las suyas |
| GET | `/:id` | Admin / Client | Ver una cita específica |
| POST | `/` | Admin / Client | Solicitar cita (fecha debe ser futura) |
| PUT | `/:id` | Admin / Client | Admin: aprueba/rechaza/reprograma. Cliente: solo puede cancelar (status: rejected) |
| DELETE | `/:id` | Admin | Eliminar cita |

**Estados de una cita:** `pending` → `approved` / `rejected`

---

### Cotizaciones — `/api/quotes`

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/` | Admin / Client | Admin ve todas; cliente ve solo las suyas |
| GET | `/?work_order_id=xxx` | Admin / Client | Filtrar por orden de trabajo |
| GET | `/:id` | Admin / Client | Ver una cotización específica |
| POST | `/` | Admin | Crear cotización con lista de ítems |
| PUT | `/:id` | Admin / Client | Admin: edita ítems y estado. Cliente: solo puede responder (approved / rejected) |

> El total de la cotización se calcula automáticamente y se sincroniza con la orden de trabajo.

---

## Formato de respuestas

Todas las respuestas siguen este formato:

```json
// Éxito
{
  "success": true,
  "message": "Descripción opcional",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Descripción del error"
}
```

---

## Ejemplos de uso

### Registrar un usuario cliente
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Juan Pérez",
    "email": "juan@email.com",
    "password": "mipassword123",
    "role": "client"
  }'
```

### Iniciar sesión
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "juan@email.com", "password": "mipassword123"}'
```

### Crear orden de trabajo (admin)
```bash
curl -X POST http://localhost:3000/api/work-orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "vehicle_id": "uuid-del-vehiculo",
    "estimated_hours": 3.5,
    "notes": "Revisión general solicitada por el cliente"
  }'
```

### Crear cotización (admin)
```bash
curl -X POST http://localhost:3000/api/quotes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "work_order_id": "uuid-de-la-orden",
    "items": [
      { "description": "Cambio de aceite", "price": 25.00 },
      { "description": "Filtro de aire", "price": 12.50 }
    ]
  }'
```

### Aprobar cotización (cliente)
```bash
curl -X PUT http://localhost:3000/api/quotes/<id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"status": "approved"}'
```

---

## Despliegue en AWS

El backend está diseñado para desplegarse en **AWS EC2** o **Elastic Beanstalk**.  
Ver guía detallada en [`docs/deploy-aws.md`](./docs/deploy-aws.md).

---

## Integrantes del proyecto

| Nombre | Carné | Rol en el proyecto |
|---|---|---|
| Jonatan Elías Guevara Chicas | U20220546 | — |
| Angel David Morataya Isleño | U20261887 | Backend y Base de Datos |
| Luisa Eunice Álvarez Tejada | U20200615 | Frontend |

**Materia:** Desarrollo De Páginas Web Activas  
**Universidad:** Universidad de Oriente — Facultad de Ingeniería y Arquitectura
