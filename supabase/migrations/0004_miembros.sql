-- Miembros: campos adicionales capturados en el registro / mostrados en el perfil.
alter table public.miembros
  add column if not exists talla_zapato varchar(10),
  add column if not exists telefono varchar(30);
