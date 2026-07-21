-- Acrosystem V3 — initial schema
-- Based on "Especificación del Sistema Acrosystem - Acrofobia (V3)".
-- All monetary values are stored in USD (RN-DER-01). Table/column names use
-- snake_case to match Supabase/PostgREST conventions.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Catálogos base
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  id_rol serial primary key,
  nombre varchar(50) not null unique
);

create table if not exists public.categorias (
  id_categoria serial primary key,
  nombre varchar(50) not null unique
);

-- ---------------------------------------------------------------------------
-- Jerarquía de identidad: personas -> empleados / miembros
-- ---------------------------------------------------------------------------
create table if not exists public.personas (
  id_persona uuid primary key default gen_random_uuid(),
  nombre_completo varchar(150) not null,
  cedula varchar(30) unique,
  tipo_perfil varchar(20) not null default 'Miembro',
  deuda_acumulada numeric(12, 2) not null default 0
);

create table if not exists public.empleados (
  id_persona uuid primary key references public.personas (id_persona) on delete cascade,
  id_rol int not null references public.roles (id_rol),
  auth_uuid uuid unique references auth.users (id) on delete set null
);

create table if not exists public.miembros (
  id_persona uuid primary key references public.personas (id_persona) on delete cascade,
  id_categoria int references public.categorias (id_categoria),
  fecha_nacimiento date,
  qr_codigo varchar(100) unique,
  num_asuncion_riesgos varchar(150),
  contacto_emergencia varchar(150)
);

-- ---------------------------------------------------------------------------
-- Planes y suscripciones
-- ---------------------------------------------------------------------------
create table if not exists public.planes (
  id_plan serial primary key,
  nombre varchar(100) not null,
  pases_totales int not null default 0,
  duracion_dias int not null default 30,
  precio_usd numeric(12, 2) not null default 0,
  incluye_equipo boolean not null default false,
  cupo_maximo int,
  requiere_agenda boolean not null default false
);

create table if not exists public.suscripciones (
  id_suscripcion uuid primary key default gen_random_uuid(),
  id_miembro uuid not null references public.miembros (id_persona) on delete cascade,
  id_plan int not null references public.planes (id_plan),
  fecha_inicio date not null default current_date,
  fecha_expiracion date not null,
  pases_restantes int not null default 0,
  estado varchar(20) not null default 'Activo'
);

create table if not exists public.suscripcion_dias (
  id_agenda uuid primary key default gen_random_uuid(),
  id_suscripcion uuid not null references public.suscripciones (id_suscripcion) on delete cascade,
  dia_semana varchar(15) not null,
  tipo_dia varchar(20)
);

-- ---------------------------------------------------------------------------
-- Inventario y trazabilidad
-- ---------------------------------------------------------------------------
create table if not exists public.categoria_producto (
  id_categoria_producto serial primary key,
  nombre varchar(80) not null unique
);

create table if not exists public.productos (
  id_producto serial primary key,
  id_categoria_producto int references public.categoria_producto (id_categoria_producto),
  nombre varchar(120) not null,
  costo_compra_usd numeric(12, 2) not null default 0,
  precio_venta_usd numeric(12, 2) not null default 0,
  stock_sistema int not null default 0,
  descripcion_detalle text
);

-- ---------------------------------------------------------------------------
-- Precios y promociones
-- ---------------------------------------------------------------------------
create table if not exists public.tasas_cambio (
  id_tasa serial primary key,
  moneda varchar(10) not null default 'VES',
  valor_tasa numeric(14, 4) not null,
  fecha_tasa date not null default current_date
);

create table if not exists public.promos_eventos (
  id_evento serial primary key,
  nombre varchar(120) not null,
  tipo varchar(40),
  valor_descuento numeric(12, 2) not null default 0,
  fecha_inicio date,
  fecha_fin date
);

-- ---------------------------------------------------------------------------
-- Ventas
-- ---------------------------------------------------------------------------
create table if not exists public.ventas (
  id_venta uuid primary key default gen_random_uuid(),
  id_comprador uuid references public.personas (id_persona),
  id_vendedor uuid references public.empleados (id_persona),
  id_tasa int references public.tasas_cambio (id_tasa),
  id_evento int references public.promos_eventos (id_evento),
  fecha_hora timestamptz not null default now(),
  total_usd numeric(12, 2) not null default 0,
  deuda_generada numeric(12, 2) not null default 0,
  estado varchar(20) not null default 'Completada'
);

create table if not exists public.detalle_venta (
  id_detalle uuid primary key default gen_random_uuid(),
  id_venta uuid not null references public.ventas (id_venta) on delete cascade,
  id_producto int references public.productos (id_producto),
  id_plan int references public.planes (id_plan),
  cantidad int not null default 1,
  precio_unit_usd numeric(12, 2) not null default 0,
  tipo_item varchar(20) not null default 'Producto'
);

create table if not exists public.movimientos_inventario (
  id_movimiento uuid primary key default gen_random_uuid(),
  id_producto int not null references public.productos (id_producto),
  id_empleado uuid references public.empleados (id_persona),
  tipo_movimiento varchar(30) not null,
  cantidad int not null,
  fecha_hora timestamptz not null default now(),
  id_venta_relacionada uuid references public.ventas (id_venta),
  observaciones text
);

-- ---------------------------------------------------------------------------
-- Operatividad: check-in
-- ---------------------------------------------------------------------------
create table if not exists public.check_in (
  id_checkin uuid primary key default gen_random_uuid(),
  id_miembro uuid not null references public.miembros (id_persona) on delete cascade,
  fecha_hora timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_suscripciones_miembro on public.suscripciones (id_miembro);
create index if not exists idx_detalle_venta_venta on public.detalle_venta (id_venta);
create index if not exists idx_movimientos_producto on public.movimientos_inventario (id_producto);
create index if not exists idx_check_in_miembro on public.check_in (id_miembro);
