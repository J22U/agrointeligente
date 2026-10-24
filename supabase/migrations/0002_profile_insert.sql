-- Permite crear el propio perfil (solo plan gratuito) y crea los perfiles que falten.
create policy own_profile_insert on profiles for insert to authenticated with check (id = auth.uid() and plan = 'free');
insert into profiles(id) select id from auth.users on conflict do nothing;
