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
