-- Check-in: enlazar cada acceso con la suscripción usada (para auditoría de pases).
alter table public.check_in
  add column if not exists id_suscripcion uuid references public.suscripciones (id_suscripcion) on delete set null;
