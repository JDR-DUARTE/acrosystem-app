-- Acrosystem V3 — Row Level Security
-- Access model: every application user is an EMPLEADO (staff). Members do not
-- log in directly in this phase. Staff authenticated via Supabase Auth may
-- read/write operational data. Fine-grained rules (e.g. RN-RES-01 metrics
-- being admin-only) are additionally enforced in the application layer.

-- SECURITY DEFINER helpers bypass RLS to avoid recursive policy evaluation
-- when a policy needs to look up the caller's employee/role.
create or replace function public.is_employee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.empleados where auth_uuid = auth.uid()
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.empleados e
    join public.roles r on r.id_rol = e.id_rol
    where e.auth_uuid = auth.uid()
      and r.nombre = 'Administrativo'
  );
$$;

do $$
declare
  tbl text;
  tables text[] := array[
    'roles', 'categorias', 'personas', 'empleados', 'miembros',
    'planes', 'suscripciones', 'suscripcion_dias', 'categoria_producto',
    'productos', 'tasas_cambio', 'promos_eventos', 'ventas',
    'detalle_venta', 'movimientos_inventario', 'check_in'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I enable row level security;', tbl);

    execute format(
      'drop policy if exists %I on public.%I;',
      tbl || '_employee_read', tbl
    );
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_employee());',
      tbl || '_employee_read', tbl
    );

    execute format(
      'drop policy if exists %I on public.%I;',
      tbl || '_employee_write', tbl
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_employee()) with check (public.is_employee());',
      tbl || '_employee_write', tbl
    );
  end loop;
end $$;
