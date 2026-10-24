import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from '../App'
import { Hills, Logo } from '../components/Art'
const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches' }
const fecha = () => new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
type Log = { id: string; category: string; logged_on: string; description: string | null }
export default function Dashboard({ go }: { go: (v: View) => void }) {
  const [d, setD] = useState<{ farms: number; plots: number; tasks: number; cost: number; logs: Log[] } | null>(null); const [err, setErr] = useState('')
  useEffect(() => { (async () => {
    const s = supabase!; const n = async (t: string, f?: (q: any) => any) => { let q: any = s.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); const r = await q; if (r.error) throw r.error; return r.count ?? 0 }
    try {
      const [farms, plots, tasks] = await Promise.all([n('farms'), n('plots'), n('tasks', q => q.eq('done', false))])
      const ex = await s.from('expenses').select('amount'); const lg = await s.from('farm_logs').select('id,category,logged_on,description').order('logged_on', { ascending: false }).limit(5)
      setD({ farms, plots, tasks, cost: (ex.data ?? []).reduce((a: number, r: any) => a + Number(r.amount), 0), logs: (lg.data ?? []) as Log[] })
    } catch { setErr('No se pudieron cargar los datos. Revisa tu conexión.') } })() }, [])
  if (err) return <p className="err">{err}</p>
  if (!d) return <p className="muted">Cargando…</p>
  return <>
    <header className="hero"><div><p className="date">{fecha()}</p><h1>{saludo()}</h1></div><Hills className="hero-art" /></header>
    {d.farms === 0 ? <section className="empty"><Logo size={48} /><h2>Empieza por tu primera finca</h2><p>Con una finca registrada podrás organizar tus lotes y consultar al asistente.</p><button className="primary" onClick={() => go('fincas')}>Crear finca</button></section> : <>
      <dl className="stats">
        <div><dt>Fincas</dt><dd>{d.farms}</dd></div><div><dt>Lotes</dt><dd>{d.plots}</dd></div>
        <div><dt>Tareas pendientes</dt><dd>{d.tasks}</dd></div><div><dt>Gastos registrados</dt><dd>{d.cost.toLocaleString('es-CO')}</dd></div>
      </dl>
      <h2>Accesos rápidos</h2>
      <div className="actions"><button className="primary" onClick={() => go('asistente')}>Consultar al asistente</button><button onClick={() => go('fincas')}>Ver mis fincas</button>
        <button disabled title="Disponible cuando se agregue el módulo de lotes y diario">Registrar labor</button></div>
      <h2>Últimas actividades</h2>
      {d.logs.length === 0 ? <p className="muted">Todavía no hay labores registradas. El diario agrícola llegará en el próximo módulo.</p> : <ul className="list">{d.logs.map(l => <li key={l.id}><b>{l.category}</b> <span className="muted">{l.logged_on}</span><br />{l.description}</li>)}</ul>}
    </>}
  </>
}
