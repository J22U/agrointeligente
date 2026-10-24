-- Campos específicos por tipo de actividad (lluvia en mm, producto aplicado, etc.)
alter table farm_logs add column if not exists details jsonb not null default '{}'::jsonb;
