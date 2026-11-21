-- El plazo de entrega pasa a ser opcional: hay productos cuya empresa no lo publica.
alter table public.products alter column lead_time_days drop not null;
