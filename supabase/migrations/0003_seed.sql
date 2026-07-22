-- Acrosystem V3 — base catalog seed (idempotent).

insert into public.roles (nombre)
values ('Administrativo'), ('Cajero'), ('Staff')
on conflict (nombre) do nothing;

insert into public.categorias (nombre)
values ('Infantil'), ('Juvenil'), ('Adulto')
on conflict (nombre) do nothing;

insert into public.categoria_producto (nombre)
values ('Bebidas'), ('Snacks'), ('Equipamiento'), ('Otros'), ('Alquiler')
on conflict (nombre) do nothing;
