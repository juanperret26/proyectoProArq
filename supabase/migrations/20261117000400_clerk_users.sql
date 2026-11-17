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
