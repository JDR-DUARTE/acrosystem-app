-- Una sola tasa por moneda y día para poder hacer upsert de las tasas diarias.
create unique index if not exists tasas_cambio_moneda_fecha_key
  on public.tasas_cambio (moneda, fecha_tasa);
