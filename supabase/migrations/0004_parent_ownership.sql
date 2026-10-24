-- Endurecimiento: un registro solo puede colgar de una finca/lote que pertenezca al mismo usuario.
drop policy own_all on plots;
create policy own_all on plots for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from farms f where f.id = farm_id and f.user_id = auth.uid()));
drop policy own_all on farm_logs;
create policy own_all on farm_logs for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from plots p where p.id = plot_id and p.user_id = auth.uid()));
drop policy own_all on expenses;
create policy own_all on expenses for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from plots p where p.id = plot_id and p.user_id = auth.uid()));
drop policy own_all on harvests;
create policy own_all on harvests for all to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from plots p where p.id = plot_id and p.user_id = auth.uid()));
