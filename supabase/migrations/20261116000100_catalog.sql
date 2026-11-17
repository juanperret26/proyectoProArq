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
