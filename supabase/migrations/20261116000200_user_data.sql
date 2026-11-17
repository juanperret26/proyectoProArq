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
