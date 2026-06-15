-- ============================================================
-- TallerSync — Script de creación de tablas en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensión para UUIDs (ya está habilitada en Supabase por defecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------
-- USERS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(10) NOT NULL CHECK (role IN ('admin', 'client')) DEFAULT 'client',
  full_name     VARCHAR(150) NOT NULL,
  phone         VARCHAR(20),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- VEHICLES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand      VARCHAR(80) NOT NULL,
  model      VARCHAR(80) NOT NULL,
  year       INT NOT NULL,
  plate      VARCHAR(20) UNIQUE NOT NULL,
  color      VARCHAR(40),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- WORK ORDERS (orden de trabajo / seguimiento del vehículo)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status          VARCHAR(20) NOT NULL CHECK (
                    status IN ('waiting','diagnosis','repair','testing','done')
                  ) DEFAULT 'waiting',
  progress_pct    INT DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  estimated_hours DECIMAL(6,2),
  total_cost      DECIMAL(10,2) DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- SERVICE HISTORY (log de cambios en work_orders)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_history (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id  UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  changed_by     UUID NOT NULL REFERENCES users(id),
  old_status     VARCHAR(20),
  new_status     VARCHAR(20),
  comment        TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- APPOINTMENTS (citas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS appointments (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id     UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  requested_date TIMESTAMPTZ NOT NULL,
  status         VARCHAR(20) NOT NULL CHECK (
                   status IN ('pending','approved','rejected')
                 ) DEFAULT 'pending',
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------
-- QUOTES (cotizaciones)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_order_id  UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  items          JSONB NOT NULL DEFAULT '[]',
  -- Formato items: [{ "description": "Cambio de aceite", "price": 25.00 }]
  total          DECIMAL(10,2) DEFAULT 0,
  status         VARCHAR(20) NOT NULL CHECK (
                   status IN ('draft','sent','approved','rejected')
                 ) DEFAULT 'draft',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FIN DEL SCRIPT
-- ============================================================
