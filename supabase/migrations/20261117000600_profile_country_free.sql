-- El país de un comprador puede ser cualquiera: countries solo lista los países
-- de origen de los proveedores del catálogo. Se reemplaza la clave foránea por un
-- chequeo de formato (dos letras mayúsculas, ISO 3166-1 alfa-2).
alter table public.profiles drop constraint profiles_country_code_fkey;

alter table public.profiles
  add constraint profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');
