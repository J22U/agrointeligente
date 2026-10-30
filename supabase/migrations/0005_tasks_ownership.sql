-- Una tarea solo puede asociarse a un lote del mismo usuario.
drop policy own_all on tasks;
create policy own_all on tasks for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and (plot_id is null or exists (select 1 from plots p where p.id = plot_id and p.user_id = auth.uid())));
