-- Productos sin precio publicado: el precio y el pedido mínimo pasan a ser
-- opcionales. Ya no hay precio que filtrar ni ordenar para esos productos; al
-- ordenar por precio quedan siempre al final.
alter table public.products alter column price_from_usd drop not null;
alter table public.products alter column min_order_qty drop not null;

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
    case when sort_by = 'price_desc' then m.price_from_usd end desc nulls last,
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
