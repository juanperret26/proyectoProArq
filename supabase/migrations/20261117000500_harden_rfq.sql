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
