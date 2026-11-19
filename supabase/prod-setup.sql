-- ProArq: esquema completo para un proyecto de Supabase NUEVO (produccion).
-- Es la suma de supabase/migrations/*.sql en orden. Ejecutar una sola vez en el SQL Editor.
-- No incluye datos: el catalogo queda vacio.

-- ============================================================
-- 20261116000100_catalog.sql
-- ============================================================
-- Catálogo público de ProArq: países, rubros, certificaciones, proveedores,
-- productos y precios por cantidad. Cualquiera puede leerlo; solo el rol de
-- servicio (carga de datos) puede escribir.

create table public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),
  name_en text not null,
  name_es text not null
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_en text not null,
  name_es text not null,
  position integer not null default 0
);

create index categories_parent_id_idx on public.categories (parent_id);

create table public.certifications (
  code text primary key,
  name text not null
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null,
  country_code text not null references public.countries (code),
  city text not null,
  founded_year integer check (founded_year between 1900 and 2100),
  business_type text not null
    check (business_type in ('manufacturer', 'trading_company')),
  is_verified boolean not null default false,
  response_time_hours integer check (response_time_hours > 0),
  description_en text not null,
  description_es text,
  -- Procedencia del dato: 'seed' en el catálogo de ejemplo; más adelante,
  -- el sitio del que se extrajo. Permite reimportar sin duplicar.
  source_site text not null default 'seed',
  source_url text,
  source_external_id text,
  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source_site, source_external_id)
);

create index suppliers_country_code_idx on public.suppliers (country_code);

create table public.supplier_certifications (
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  certification_code text not null references public.certifications (code),
  primary key (supplier_id, certification_code)
);

create index supplier_certifications_code_idx
  on public.supplier_certifications (certification_code);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  name_en text not null,
  name_es text,
  description_en text not null,
  description_es text,
  -- Lista ordenada de { "label_en", "label_es", "value" }.
  specs jsonb not null default '[]'::jsonb
    check (jsonb_typeof(specs) = 'array'),
  -- Código de unidad de venta (m2, ton, piece, ...); la interfaz lo traduce.
  unit text not null,
  min_order_qty numeric(12, 2) not null check (min_order_qty > 0),
  lead_time_days integer not null check (lead_time_days > 0),
  -- Precio del tramo más barato; se guarda aparte para filtrar y ordenar.
  price_from_usd numeric(12, 2) not null check (price_from_usd > 0),
  image_urls text[] not null default '{}',
  source_site text not null default 'seed',
  source_url text,
  source_external_id text,
  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  -- Búsqueda en los dos idiomas: el nombre pesa más que la descripción.
  search_vector tsvector generated always as (
    setweight(to_tsvector('english'::regconfig, name_en), 'A')
    || setweight(to_tsvector('spanish'::regconfig, coalesce(name_es, '')), 'A')
    || setweight(to_tsvector('english'::regconfig, description_en), 'B')
    || setweight(
      to_tsvector('spanish'::regconfig, coalesce(description_es, '')), 'B'
    )
  ) stored,
  unique (source_site, source_external_id)
);

create index products_search_vector_idx
  on public.products using gin (search_vector);
create index products_category_id_idx on public.products (category_id);
create index products_supplier_id_idx on public.products (supplier_id);
create index products_price_from_usd_idx on public.products (price_from_usd);

create table public.price_tiers (
  product_id uuid not null references public.products (id) on delete cascade,
  min_qty numeric(12, 2) not null check (min_qty > 0),
  unit_price_usd numeric(12, 2) not null check (unit_price_usd > 0),
  primary key (product_id, min_qty)
);

-- Seguridad: lectura pública, sin políticas de escritura.
alter table public.countries enable row level security;
alter table public.categories enable row level security;
alter table public.certifications enable row level security;
alter table public.suppliers enable row level security;
alter table public.supplier_certifications enable row level security;
alter table public.products enable row level security;
alter table public.price_tiers enable row level security;

create policy "Catalog is readable by everyone" on public.countries
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.categories
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.certifications
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.suppliers
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.supplier_certifications
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.products
  for select to anon, authenticated using (true);
create policy "Catalog is readable by everyone" on public.price_tiers
  for select to anon, authenticated using (true);

grant select on
  public.countries,
  public.categories,
  public.certifications,
  public.suppliers,
  public.supplier_certifications,
  public.products,
  public.price_tiers
to anon, authenticated;

-- ============================================================
-- 20261116000200_user_data.sql
-- ============================================================
-- Datos de cada comprador: perfil, favoritos, pedidos de cotización e
-- historial del asistente. Cada fila solo la ve y la crea su dueño.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  company text check (char_length(company) <= 160),
  country_code text references public.countries (code),
  created_at timestamptz not null default now()
);

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  product_id uuid references public.products (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Un favorito apunta a un producto o a un proveedor, nunca a ambos.
  check (num_nonnulls(product_id, supplier_id) = 1),
  unique (user_id, product_id),
  unique (user_id, supplier_id)
);

create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id),
  message text not null check (char_length(message) between 1 and 4000),
  destination text check (char_length(destination) <= 160),
  status text not null default 'sent'
    check (status in ('sent', 'answered', 'closed')),
  created_at timestamptz not null default now()
);

create index rfqs_user_id_created_at_idx
  on public.rfqs (user_id, created_at desc);

create table public.rfq_items (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.rfqs (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity numeric(12, 2) not null check (quantity > 0),
  unique (rfq_id, product_id)
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  query text not null check (char_length(query) between 1 and 2000),
  locale text not null check (locale in ('en', 'es')),
  criteria jsonb not null,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now()
);

-- También sirve para contar consultas recientes y limitar el uso.
create index ai_recommendations_user_id_created_at_idx
  on public.ai_recommendations (user_id, created_at desc);

-- Al registrarse un usuario se crea su perfil.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'full_name'), 120), '')
  );
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.favorites enable row level security;
alter table public.rfqs enable row level security;
alter table public.rfq_items enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users read their own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users add their own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "Users remove their own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));

create policy "Users read their own quote requests" on public.rfqs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users send their own quote requests" on public.rfqs
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "Users read items of their quote requests" on public.rfq_items
  for select to authenticated using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_id and r.user_id = (select auth.uid())
    )
  );
create policy "Users add items to their quote requests" on public.rfq_items
  for insert to authenticated with check (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_id and r.user_id = (select auth.uid())
    )
  );

create policy "Users read their own recommendations" on public.ai_recommendations
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Users save their own recommendations" on public.ai_recommendations
  for insert to authenticated with check (user_id = (select auth.uid()));

grant select on public.profiles to authenticated;
grant update (full_name, company, country_code) on public.profiles to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on
  public.rfqs,
  public.rfq_items,
  public.ai_recommendations
to authenticated;

-- ============================================================
-- 20261116000300_search.sql
-- ============================================================
-- Búsqueda del catálogo con filtros, orden y paginación en una sola llamada.
-- Un rubro de primer nivel incluye a sus subrubros. `total_count` trae el
-- total de coincidencias para armar la paginación.

create function public.search_products(
  search_query text default null,
  category_slugs text[] default null,
  country_codes text[] default null,
  price_min numeric default null,
  price_max numeric default null,
  max_min_order numeric default null,
  max_lead_time_days integer default null,
  certification_codes text[] default null,
  verified_only boolean default false,
  sort_by text default 'relevance',
  page_size integer default 24,
  page_offset integer default 0
)
returns table (
  id uuid,
  name_en text,
  name_es text,
  unit text,
  min_order_qty numeric,
  lead_time_days integer,
  price_from_usd numeric,
  image_urls text[],
  category_slug text,
  parent_category_slug text,
  supplier_id uuid,
  supplier_slug text,
  supplier_name text,
  country_code text,
  is_verified boolean,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select
      case
        when nullif(trim(search_query), '') is null then null
        -- La consulta puede venir en inglés o en español: vale cualquiera.
        else websearch_to_tsquery('english'::regconfig, search_query)
          || websearch_to_tsquery('spanish'::regconfig, search_query)
      end as tsq
  ),
  matched as (
    select
      p.id,
      p.name_en,
      p.name_es,
      p.unit,
      p.min_order_qty,
      p.lead_time_days,
      p.price_from_usd,
      p.image_urls,
      c.slug as category_slug,
      pc.slug as parent_category_slug,
      s.id as supplier_id,
      s.slug as supplier_slug,
      s.name as supplier_name,
      s.country_code,
      s.is_verified,
      case
        when q.tsq is null then 0
        else ts_rank(p.search_vector, q.tsq)
      end as relevance
    from public.products p
    join public.suppliers s on s.id = p.supplier_id
    join public.categories c on c.id = p.category_id
    left join public.categories pc on pc.id = c.parent_id
    cross join query q
    where (q.tsq is null or p.search_vector @@ q.tsq)
      and (
        category_slugs is null
        or c.slug = any (category_slugs)
        or pc.slug = any (category_slugs)
      )
      and (country_codes is null or s.country_code = any (country_codes))
      and (price_min is null or p.price_from_usd >= price_min)
      and (price_max is null or p.price_from_usd <= price_max)
      and (max_min_order is null or p.min_order_qty <= max_min_order)
      and (
        max_lead_time_days is null
        or p.lead_time_days <= max_lead_time_days
      )
      and (not verified_only or s.is_verified)
      -- El proveedor debe tener todas las certificaciones pedidas.
      and (
        certification_codes is null
        or not exists (
          select 1
          from unnest(certification_codes) as wanted (code)
          where not exists (
            select 1
            from public.supplier_certifications sc
            where sc.supplier_id = s.id
              and sc.certification_code = wanted.code
          )
        )
      )
  )
  select
    m.id,
    m.name_en,
    m.name_es,
    m.unit,
    m.min_order_qty,
    m.lead_time_days,
    m.price_from_usd,
    m.image_urls,
    m.category_slug,
    m.parent_category_slug,
    m.supplier_id,
    m.supplier_slug,
    m.supplier_name,
    m.country_code,
    m.is_verified,
    count(*) over () as total_count
  from matched m
  order by
    case when sort_by = 'price_asc' then m.price_from_usd end asc,
    case when sort_by = 'price_desc' then m.price_from_usd end desc,
    case when sort_by = 'lead_time' then m.lead_time_days end asc,
    m.relevance desc,
    m.name_en asc,
    m.id asc
  limit least(greatest(page_size, 1), 60)
  offset greatest(page_offset, 0);
$$;

grant execute on function public.search_products(
  text, text[], text[], numeric, numeric, numeric, integer, text[], boolean,
  text, integer, integer
) to anon, authenticated;

-- ============================================================
-- 20261117000400_clerk_users.sql
-- ============================================================
-- La identidad de los compradores pasa a Clerk. Supabase confía en los tokens
-- de Clerk (Authentication > Third-party Auth), así que el id del usuario ya
-- no es un uuid de auth.users sino el texto "user_..." que viene en el claim
-- `sub` del token. RLS sigue decidiendo quién ve cada fila.
-- Las tablas de usuario están vacías, por lo que el cambio de tipo es seguro.

-- El perfil ya no lo crea un trigger sobre auth.users: lo crea la aplicación.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop policy "Users read their own profile" on public.profiles;
drop policy "Users update their own profile" on public.profiles;
drop policy "Users read their own favorites" on public.favorites;
drop policy "Users add their own favorites" on public.favorites;
drop policy "Users remove their own favorites" on public.favorites;
drop policy "Users read their own quote requests" on public.rfqs;
drop policy "Users send their own quote requests" on public.rfqs;
drop policy "Users read items of their quote requests" on public.rfq_items;
drop policy "Users add items to their quote requests" on public.rfq_items;
drop policy "Users read their own recommendations" on public.ai_recommendations;
drop policy "Users save their own recommendations" on public.ai_recommendations;

alter table public.profiles drop constraint profiles_id_fkey;
alter table public.favorites drop constraint favorites_user_id_fkey;
alter table public.rfqs drop constraint rfqs_user_id_fkey;
alter table public.ai_recommendations drop constraint ai_recommendations_user_id_fkey;

alter table public.favorites alter column user_id drop default;
alter table public.rfqs alter column user_id drop default;
alter table public.ai_recommendations alter column user_id drop default;

alter table public.profiles alter column id type text using id::text;
alter table public.favorites alter column user_id type text using user_id::text;
alter table public.rfqs alter column user_id type text using user_id::text;
alter table public.ai_recommendations alter column user_id type text using user_id::text;

-- Quien inserta una fila queda como su dueño sin tener que enviar su id.
alter table public.favorites alter column user_id set default (auth.jwt() ->> 'sub');
alter table public.rfqs alter column user_id set default (auth.jwt() ->> 'sub');
alter table public.ai_recommendations alter column user_id set default (auth.jwt() ->> 'sub');

create policy "Users read their own profile" on public.profiles
  for select to authenticated using (id = (select auth.jwt() ->> 'sub'));
create policy "Users create their own profile" on public.profiles
  for insert to authenticated with check (id = (select auth.jwt() ->> 'sub'));
create policy "Users update their own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.jwt() ->> 'sub'))
  with check (id = (select auth.jwt() ->> 'sub'));

create policy "Users read their own favorites" on public.favorites
  for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Users add their own favorites" on public.favorites
  for insert to authenticated with check (user_id = (select auth.jwt() ->> 'sub'));
create policy "Users remove their own favorites" on public.favorites
  for delete to authenticated using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users read their own quote requests" on public.rfqs
  for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Users send their own quote requests" on public.rfqs
  for insert to authenticated with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users read items of their quote requests" on public.rfq_items
  for select to authenticated using (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_id and r.user_id = (select auth.jwt() ->> 'sub')
    )
  );
create policy "Users add items to their quote requests" on public.rfq_items
  for insert to authenticated with check (
    exists (
      select 1 from public.rfqs r
      where r.id = rfq_id and r.user_id = (select auth.jwt() ->> 'sub')
    )
  );

create policy "Users read their own recommendations" on public.ai_recommendations
  for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy "Users save their own recommendations" on public.ai_recommendations
  for insert to authenticated with check (user_id = (select auth.jwt() ->> 'sub'));

grant insert (id, full_name, company, country_code) on public.profiles to authenticated;

-- ============================================================
-- 20261117000500_harden_rfq.sql
-- ============================================================
-- Endurece cotizaciones y permisos tras la revisión de seguridad de la Fase 5.

-- 1. Permisos mínimos sobre las tablas de usuario. RLS sigue decidiendo las filas;
--    esto quita lo que RLS no filtra (TRUNCATE, TRIGGER, REFERENCES) y todo a anon.
revoke all on public.profiles, public.favorites, public.rfqs, public.rfq_items
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant insert (id, full_name, company, country_code) on public.profiles to authenticated;
grant update (full_name, company, country_code) on public.profiles to authenticated;

grant select, delete on public.favorites to authenticated;
grant insert (product_id, supplier_id) on public.favorites to authenticated;

-- status y user_id los fija la base (default); el cliente no los elige.
grant select on public.rfqs to authenticated;
grant insert (supplier_id, message, destination) on public.rfqs to authenticated;

grant select on public.rfq_items to authenticated;
grant insert (rfq_id, product_id, quantity) on public.rfq_items to authenticated;

-- 2. Un item solo entra en una cotización propia sin responder y de su mismo proveedor.
drop policy "Users add items to their quote requests" on public.rfq_items;
create policy "Users add items to their quote requests" on public.rfq_items
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.rfqs r
      join public.products p on p.id = rfq_items.product_id
      where r.id = rfq_items.rfq_id
        and r.user_id = (select auth.jwt() ->> 'sub')
        and r.status = 'sent'
        and p.supplier_id = r.supplier_id
    )
  );

alter table public.rfq_items
  add constraint rfq_items_quantity_max check (quantity <= 1000000000);

-- 3. Crear la cotización y su item en una sola transacción. SECURITY INVOKER:
--    sigue rigiendo RLS con la identidad de quien llama.
create or replace function public.create_rfq(
  p_product_id uuid,
  p_quantity numeric,
  p_message text,
  p_destination text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_supplier uuid;
  v_min numeric;
  v_rfq uuid;
begin
  select supplier_id, min_order_qty into v_supplier, v_min
  from public.products where id = p_product_id;
  if v_supplier is null then
    raise exception 'product not found' using errcode = 'P0002';
  end if;
  if p_quantity < v_min then
    raise exception 'quantity below minimum order' using errcode = '22023';
  end if;

  insert into public.rfqs (supplier_id, message, destination)
  values (v_supplier, p_message, nullif(p_destination, ''))
  returning id into v_rfq;

  insert into public.rfq_items (rfq_id, product_id, quantity)
  values (v_rfq, p_product_id, p_quantity);
  return v_rfq;
end;
$$;

revoke all on function public.create_rfq(uuid, numeric, text, text) from public, anon;
grant execute on function public.create_rfq(uuid, numeric, text, text) to authenticated;

-- ============================================================
-- 20261117000600_profile_country_free.sql
-- ============================================================
-- El país de un comprador puede ser cualquiera: countries solo lista los países
-- de origen de los proveedores del catálogo. Se reemplaza la clave foránea por un
-- chequeo de formato (dos letras mayúsculas, ISO 3166-1 alfa-2).
alter table public.profiles drop constraint profiles_country_code_fkey;

alter table public.profiles
  add constraint profiles_country_code_format
  check (country_code is null or country_code ~ '^[A-Z]{2}$');

-- ============================================================
-- 20261118000700_ai_quota.sql
-- ============================================================
-- Cuota diaria del respaldo con IA del asistente, reservada de forma atómica.
-- Contar y registrar en pasos separados dejaba pasar pedidos simultáneos:
-- todos leían el mismo conteo antes de que se guardara ninguno.

-- Consultas asistidas por persona en 24 horas. Debe coincidir con
-- DAILY_AI_LIMIT en src/lib/assistant/ai-fallback.ts (solo para mostrarlo).
create or replace function public.reserve_ai_use(
  p_query text,
  p_locale text,
  p_model text
) returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_daily_limit constant integer := 10;
  v_user text := auth.jwt() ->> 'sub';
  v_used integer;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  -- Serializa las reservas de una misma persona hasta el fin de la transacción.
  perform pg_advisory_xact_lock(hashtextextended('ai_quota:' || v_user, 0));

  select count(*) into v_used
  from public.ai_recommendations
  where user_id = v_user
    and created_at > now() - interval '24 hours';

  if v_used >= v_daily_limit then
    return false;
  end if;

  -- La reserva cuenta aunque el modelo falle después: así un corte del
  -- servicio no permite reintentar sin límite.
  insert into public.ai_recommendations (query, locale, criteria, result, model)
  values (left(p_query, 2000), p_locale, '{}'::jsonb, '{"status": "reserved"}'::jsonb, p_model);
  return true;
end;
$$;

revoke all on function public.reserve_ai_use(text, text, text) from public, anon;
grant execute on function public.reserve_ai_use(text, text, text) to authenticated;

-- ============================================================
-- 20261118000800_search_typos.sql
-- ============================================================
-- Tolerancia a errores de tipeo en la búsqueda del catálogo.
-- Si la búsqueda de texto completo no encuentra nada, se vuelve a buscar por
-- parecido de palabras ("porcelnato" encuentra "Porcelanato"). Si hay
-- coincidencias exactas, el resultado no cambia respecto de antes.

create extension if not exists pg_trgm with schema extensions;

create or replace function public.search_products(
  search_query text default null,
  category_slugs text[] default null,
  country_codes text[] default null,
  price_min numeric default null,
  price_max numeric default null,
  max_min_order numeric default null,
  max_lead_time_days integer default null,
  certification_codes text[] default null,
  verified_only boolean default false,
  sort_by text default 'relevance',
  page_size integer default 24,
  page_offset integer default 0
)
returns table (
  id uuid,
  name_en text,
  name_es text,
  unit text,
  min_order_qty numeric,
  lead_time_days integer,
  price_from_usd numeric,
  image_urls text[],
  category_slug text,
  parent_category_slug text,
  supplier_id uuid,
  supplier_slug text,
  supplier_name text,
  country_code text,
  is_verified boolean,
  total_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with query as (
    select
      nullif(trim(search_query), '') as raw,
      case
        when nullif(trim(search_query), '') is null then null
        -- La consulta puede venir en inglés o en español: vale cualquiera.
        else websearch_to_tsquery('english'::regconfig, search_query)
          || websearch_to_tsquery('spanish'::regconfig, search_query)
      end as tsq
  ),
  -- ¿Hay alguna coincidencia exacta en todo el catálogo? Si no, se usa el parecido.
  exact as (
    select exists (
      select 1
      from public.products px
      cross join query qx
      where qx.tsq is not null and px.search_vector @@ qx.tsq
    ) as found
  ),
  matched as (
    select
      p.id,
      p.name_en,
      p.name_es,
      p.unit,
      p.min_order_qty,
      p.lead_time_days,
      p.price_from_usd,
      p.image_urls,
      c.slug as category_slug,
      pc.slug as parent_category_slug,
      s.id as supplier_id,
      s.slug as supplier_slug,
      s.name as supplier_name,
      s.country_code,
      s.is_verified,
      case
        when q.tsq is null then 0
        when p.search_vector @@ q.tsq then ts_rank(p.search_vector, q.tsq)
        else greatest(
          extensions.word_similarity(q.raw, p.name_en),
          extensions.word_similarity(q.raw, coalesce(p.name_es, ''))
        )
      end as relevance
    from public.products p
    join public.suppliers s on s.id = p.supplier_id
    join public.categories c on c.id = p.category_id
    left join public.categories pc on pc.id = c.parent_id
    cross join query q
    cross join exact e
    where (
        q.tsq is null
        or p.search_vector @@ q.tsq
        or (
          not e.found
          and greatest(
            extensions.word_similarity(q.raw, p.name_en),
            extensions.word_similarity(q.raw, coalesce(p.name_es, ''))
          ) >= 0.5
        )
      )
      and (
        category_slugs is null
        or c.slug = any (category_slugs)
        or pc.slug = any (category_slugs)
      )
      and (country_codes is null or s.country_code = any (country_codes))
      and (price_min is null or p.price_from_usd >= price_min)
      and (price_max is null or p.price_from_usd <= price_max)
      and (max_min_order is null or p.min_order_qty <= max_min_order)
      and (
        max_lead_time_days is null
        or p.lead_time_days <= max_lead_time_days
      )
      and (not verified_only or s.is_verified)
      -- El proveedor debe tener todas las certificaciones pedidas.
      and (
        certification_codes is null
        or not exists (
          select 1
          from unnest(certification_codes) as wanted (code)
          where not exists (
            select 1
            from public.supplier_certifications sc
            where sc.supplier_id = s.id
              and sc.certification_code = wanted.code
          )
        )
      )
  )
  select
    m.id,
    m.name_en,
    m.name_es,
    m.unit,
    m.min_order_qty,
    m.lead_time_days,
    m.price_from_usd,
    m.image_urls,
    m.category_slug,
    m.parent_category_slug,
    m.supplier_id,
    m.supplier_slug,
    m.supplier_name,
    m.country_code,
    m.is_verified,
    count(*) over () as total_count
  from matched m
  order by
    case when sort_by = 'price_asc' then m.price_from_usd end asc,
    case when sort_by = 'price_desc' then m.price_from_usd end desc,
    case when sort_by = 'lead_time' then m.lead_time_days end asc,
    m.relevance desc,
    m.name_en asc,
    m.id asc
  limit least(greatest(page_size, 1), 60)
  offset greatest(page_offset, 0);
$$;

grant execute on function public.search_products(
  text, text[], text[], numeric, numeric, numeric, integer, text[], boolean,
  text, integer, integer
) to anon, authenticated;

-- ============================================================
-- 20261118000900_rfq_rate_limit.sql
-- ============================================================
-- Límite de cotizaciones por persona: evita que una cuenta llene la base o
-- sature a los proveedores. Se cuenta dentro de la misma transacción que crea
-- la cotización, con un bloqueo por usuario para que pedidos simultáneos no
-- se salteen el tope.

create or replace function public.create_rfq(
  p_product_id uuid,
  p_quantity numeric,
  p_message text,
  p_destination text
) returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  c_hourly_limit constant integer := 10;
  v_user text := auth.jwt() ->> 'sub';
  v_supplier uuid;
  v_min numeric;
  v_recent integer;
  v_rfq uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select supplier_id, min_order_qty into v_supplier, v_min
  from public.products where id = p_product_id;
  if v_supplier is null then
    raise exception 'product not found' using errcode = 'P0002';
  end if;
  if p_quantity < v_min then
    raise exception 'quantity below minimum order' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('rfq_rate:' || v_user, 0));
  select count(*) into v_recent
  from public.rfqs
  where user_id = v_user and created_at > now() - interval '1 hour';
  if v_recent >= c_hourly_limit then
    -- Código propio ("PT" + estado HTTP, como usa PostgREST): 54000 también lo
    -- lanza Postgres por otros límites internos y se confundiría con este.
    raise exception 'too many quote requests' using errcode = 'PT429';
  end if;

  insert into public.rfqs (supplier_id, message, destination)
  values (v_supplier, p_message, nullif(p_destination, ''))
  returning id into v_rfq;

  insert into public.rfq_items (rfq_id, product_id, quantity)
  values (v_rfq, p_product_id, p_quantity);
  return v_rfq;
end;
$$;

revoke all on function public.create_rfq(uuid, numeric, text, text) from public, anon;
grant execute on function public.create_rfq(uuid, numeric, text, text) to authenticated;

-- ============================================================
-- 20261118001000_rfq_single_write_path.sql
-- ============================================================
-- create_rfq pasa a ser la única forma de crear cotizaciones.
-- Hasta ahora `authenticated` podía insertar directo en rfqs y rfq_items con la
-- API de Supabase y su propio token, salteándose el pedido mínimo y el límite
-- por hora de create_rfq. Se quita ese permiso y la función corre con los
-- permisos del dueño, con el usuario tomado siempre del token.

drop policy if exists "Users send their own quote requests" on public.rfqs;
drop policy if exists "Users add items to their quote requests" on public.rfq_items;

-- Quitar el permiso de tabla también quita los permisos por columna.
revoke insert, update, delete on public.rfqs from authenticated, anon;
revoke insert, update, delete on public.rfq_items from authenticated, anon;

create or replace function public.create_rfq(
  p_product_id uuid,
  p_quantity numeric,
  p_message text,
  p_destination text
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_hourly_limit constant integer := 10;
  v_user text := auth.jwt() ->> 'sub';
  v_supplier uuid;
  v_min numeric;
  v_recent integer;
  v_rfq uuid;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  select supplier_id, min_order_qty into v_supplier, v_min
  from public.products where id = p_product_id;
  if v_supplier is null then
    raise exception 'product not found' using errcode = 'P0002';
  end if;
  if p_quantity < v_min then
    raise exception 'quantity below minimum order' using errcode = '22023';
  end if;

  -- Un bloqueo por usuario hace que pedidos simultáneos no se salteen el tope.
  perform pg_advisory_xact_lock(hashtextextended('rfq_rate:' || v_user, 0));
  select count(*) into v_recent
  from public.rfqs
  where user_id = v_user and created_at > now() - interval '1 hour';
  if v_recent >= c_hourly_limit then
    -- Código propio ("PT" + estado HTTP, como usa PostgREST): 54000 también lo
    -- lanza Postgres por otros límites internos.
    raise exception 'too many quote requests' using errcode = 'PT429';
  end if;

  insert into public.rfqs (user_id, supplier_id, message, destination)
  values (v_user, v_supplier, p_message, nullif(p_destination, ''))
  returning id into v_rfq;

  insert into public.rfq_items (rfq_id, product_id, quantity)
  values (v_rfq, p_product_id, p_quantity);
  return v_rfq;
end;
$$;

revoke all on function public.create_rfq(uuid, numeric, text, text) from public, anon;
grant execute on function public.create_rfq(uuid, numeric, text, text) to authenticated;
