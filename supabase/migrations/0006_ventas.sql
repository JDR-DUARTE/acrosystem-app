-- Ventas: campos de la pantalla "Datos y pago" que no cubría el esquema base.
alter table public.ventas
  add column if not exists tipo_venta varchar(20) not null default 'Externa',
  add column if not exists forma_pago varchar(30),
  add column if not exists moneda varchar(10) not null default 'USD';
