create extension if not exists pgcrypto;
create table profiles(id uuid primary key references auth.users on delete cascade, full_name text, currency text not null default 'COP', plan text not null default 'free' check(plan in('free','premium')), created_at timestamptz not null default now());
create table farms(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, name text not null check(length(name) between 1 and 120), country text, region text, municipality text, area_ha numeric check(area_ha>=0), lat numeric check(lat between -90 and 90), lng numeric check(lng between -180 and 180), notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table plots(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, farm_id uuid not null references farms on delete cascade, name text not null, crop text not null, variety text, area_ha numeric check(area_ha>=0), planted_on date, stage text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table farm_logs(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, plot_id uuid not null references plots on delete cascade, category text not null check(category in('siembra','riego','lluvia','fertilizacion','poda','malezas','plagas','tratamiento','labor','otro')), logged_on date not null, description text, created_at timestamptz not null default now());
create table expenses(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, plot_id uuid not null references plots on delete cascade, kind text not null check(kind in('insumos','mano_obra','transporte','otros')), amount numeric not null check(amount>=0), spent_on date not null, note text);
create table harvests(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, plot_id uuid not null references plots on delete cascade, harvested_on date not null, quantity numeric not null check(quantity>=0), unit text not null, losses numeric not null default 0 check(losses>=0), unit_price numeric check(unit_price>=0));
create table tasks(id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, plot_id uuid references plots on delete set null, title text not null, due_on date, priority text not null default 'media' check(priority in('baja','media','alta')), done boolean not null default false, ai_suggested boolean not null default false);
create table ai_queries(id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users on delete cascade, plot_id uuid references plots on delete set null, question text not null, answer text, created_at timestamptz not null default now());
create table plan_limits(plan text primary key, ai_queries_per_day int not null);
insert into plan_limits values('free',3),('premium',50);
create index on plots(farm_id); create index on farm_logs(plot_id,logged_on); create index on expenses(plot_id); create index on harvests(plot_id); create index on ai_queries(user_id,created_at);
do $$ declare t text; begin
 foreach t in array array['farms','plots','farm_logs','expenses','harvests','tasks'] loop
  execute format('alter table %I enable row level security',t);
  execute format('create policy own_all on %I for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid())',t);
 end loop; end $$;
alter table profiles enable row level security;
create policy own_profile_read on profiles for select to authenticated using(id=auth.uid());
create policy own_profile_update on profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and plan=(select plan from profiles where id=auth.uid()));
alter table ai_queries enable row level security;
create policy read_own on ai_queries for select to authenticated using(user_id=auth.uid());
alter table plan_limits enable row level security;
create policy read_limits on plan_limits for select to authenticated using(true);
create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into profiles(id) values(new.id); return new; end $$;
create trigger on_signup after insert on auth.users for each row execute function handle_new_user();
