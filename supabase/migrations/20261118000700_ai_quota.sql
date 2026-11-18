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
