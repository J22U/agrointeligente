import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from '../App'
import { Scene, Logo, tramoActual } from '../components/Art'
import { Bars, Columns, Donut } from '../components/Charts'
import { CATEGORIAS } from './Diary'
const TIPOS: Record<string, string> = { insumos: 'Insumos', mano_obra: 'Mano de obra', transporte: 'Transporte', otros: 'Otros' }
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const saludo = () => { const h = new Date().getHours(); return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches' }
const fecha = () => new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })
type Ex = { amount: number; spent_on: string; kind: string; plot_id: string }
type Hv = { quantity: number; losses: number; harvested_on: string; unit: string }
type Log = { id: string; category: string; logged_on: string; description: string | null }
type Task = { id: string; title: string; due_on: string | null; priority: string }
type Data = { pend: Task[]; farms: number; tasks: number; cur: string; names: Record<string, string>; ex: Ex[]; hv: Hv[]; logs: Log[] }
const group = <T,>(arr: T[], key: (x: T) => string, val: (x: T) => number) => { const m = new Map<string, number>(); arr.forEach(x => m.set(key(x), (m.get(key(x)) ?? 0) + val(x))); return [...m].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value) }
export default function Dashboard({ go }: { go: (v: View) => void }) {
  const [d, setD] = useState<Data | null>(null); const [err, setErr] = useState('')
  const cargar = async () => {
    const s = supabase!
    try {
      const cnt = async (t: string, f?: (q: any) => any) => { let q: any = s.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); const r = await q; if (r.error) throw r.error; return r.count ?? 0 }
      const [farms, tasks] = await Promise.all([cnt('farms'), cnt('tasks', q => q.eq('done', false))])
      const [pl, ex, hv, lg, pr, tk] = await Promise.all([s.from('plots').select('id,name'), s.from('expenses').select('amount,spent_on,kind,plot_id').limit(1000), s.from('harvests').select('quantity,losses,harvested_on,unit').limit(1000),
        s.from('farm_logs').select('id,category,logged_on,description').order('logged_on', { ascending: false }).limit(300), s.from('profiles').select('currency').maybeSingle(), s.from('tasks').select('id,title,due_on,priority').eq('done', false).order('due_on', { ascending: true, nullsFirst: false }).limit(5)])
      if (pl.error || ex.error || hv.error || lg.error) throw new Error('carga')
      setD({ farms, tasks, cur: pr.data?.currency ?? 'COP', names: Object.fromEntries((pl.data ?? []).map((p: any) => [p.id, p.name])), ex: ex.data as Ex[], hv: hv.data as Hv[], logs: lg.data as Log[], pend: (tk.data ?? []) as Task[] })
    } catch { setErr('No se pudieron cargar los datos. Revisa tu conexión.') } }
  useEffect(() => { cargar() }, [])
  if (err) return <p className="err">{err}</p>
  if (!d) return <p className="muted">Cargando…</p>
  const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: d.cur, maximumFractionDigits: 0 }).format(n)
  const compact = (n: number) => new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  const meses = Array.from({ length: 6 }, (_, i) => { const t = new Date(); t.setDate(1); t.setMonth(t.getMonth() - (5 - i)); return { key: `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`, label: MES[t.getMonth()] } })
  const gastoMes = meses.map(m => ({ label: m.label, value: d.ex.filter(x => x.spent_on.startsWith(m.key)).reduce((a, x) => a + Number(x.amount), 0) }))
  const porTipo = group(d.ex, x => TIPOS[x.kind] ?? x.kind, x => Number(x.amount)); const porLote = group(d.ex, x => d.names[x.plot_id] ?? '—', x => Number(x.amount)).slice(0, 6)
  const acts = group(d.logs, x => CATEGORIAS[x.category] ?? x.category, () => 1).slice(0, 6)
  const units = [...new Set(d.hv.map(h => h.unit))]; const unit = units.length === 1 ? units[0] : null
  const prodMes = meses.map(m => ({ label: m.label, value: d.hv.filter(x => x.harvested_on.startsWith(m.key)).reduce((a, x) => a + Number(x.quantity) - Number(x.losses), 0) }))
  const hoyStr = new Date().toLocaleDateString('en-CA'); const totalGasto = d.ex.reduce((a, x) => a + Number(x.amount), 0); const vacio = (t: string) => <p className="muted">{t}</p>
  return <>
    <header className="hero" data-t={tramoActual()}><div><p className="date">{fecha()}</p><h1>{saludo()}</h1></div><Scene tramo={tramoActual()} className="hero-art" slice /></header>
    {d.farms === 0 ? <section className="empty"><Logo size={48} /><h2>Empieza por tu primera finca</h2><p>Con una finca registrada podrás organizar tus lotes y consultar al asistente.</p><button className="primary" onClick={() => go('fincas')}>Crear finca</button></section> : <>
      <dl className="stats">
        <div><dt>Fincas</dt><dd>{d.farms}</dd></div><div><dt>Lotes</dt><dd>{Object.keys(d.names).length}</dd></div>
        <div><dt>Tareas pendientes</dt><dd>{d.tasks}</dd></div><div><dt>Gastos registrados</dt><dd>{money(totalGasto)}</dd></div>
      </dl>
      <div className="actions top"><button className="primary" onClick={() => go('diario')}>Registrar labor</button><button onClick={() => go('asistente')}>Consultar al asistente</button><button onClick={() => go('costos')}>Ver costos</button><button onClick={() => go('tareas')}>Tareas</button></div>
      <section className="card" style={{ marginTop: 14 }}><h3>Tareas pendientes<span className="count">{d.tasks}</span></h3>
        {d.pend.length === 0 ? <p className="muted">No tienes tareas pendientes. <button className="link" onClick={() => go('tareas')}>Crear una tarea</button></p> : <><ul className="tareas">{d.pend.map(t => { const venc = !!t.due_on && t.due_on < hoyStr
          return <li key={t.id}><button className="chk" aria-label="Marcar como hecha" onClick={async () => { await supabase!.from('tasks').update({ done: true }).eq('id', t.id); cargar() }} /><div><b>{t.title}</b><br /><span className={venc ? 'err' : 'muted'}>{venc ? 'Vencida · ' : ''}{t.due_on ?? 'Sin fecha'} · prioridad {t.priority}</span></div></li> })}</ul>
          <button onClick={() => go('tareas')}>Ver todas las tareas</button></>}</section>
      <section className="grid">
        <article className="card"><h3>Gastos por mes</h3>{d.ex.length ? <Columns data={gastoMes} fmt={compact} /> : vacio('Registra gastos en Costos para ver este gráfico.')}</article>
        <article className="card"><h3>Gastos por tipo</h3>{porTipo.length ? <Donut data={porTipo} fmt={money} /> : vacio('Aún no hay gastos registrados.')}</article>
        <article className="card"><h3>Actividades más frecuentes</h3>{acts.length ? <Bars data={acts} fmt={n => String(n)} color="#8fc66b" /> : vacio('Registra labores en el Diario para verlas aquí.')}</article>
        <article className="card"><h3>Costos por lote</h3>{porLote.length ? <Bars data={porLote} fmt={compact} color="#c58b5a" /> : vacio('Aún no hay costos por lote.')}</article>
        {d.hv.length > 0 && <article className="card wide"><h3>Producción neta por mes{unit ? ` (${unit})` : ''}</h3>{unit ? <Columns data={prodMes} fmt={n => String(Math.round(n * 10) / 10)} color="#f2c14e" /> : vacio('Tienes cosechas en distintas unidades; filtra en Costos para compararlas.')}</article>}
      </section>
      <details className="fold"><summary>Últimas actividades</summary>
        {d.logs.length === 0 ? <p className="muted">Todavía no hay labores registradas. Registra la primera en el Diario.</p> : <ul className="list">{d.logs.slice(0, 5).map(l => <li key={l.id}><b>{CATEGORIAS[l.category] ?? l.category}</b> <span className="muted">{l.logged_on}</span>{l.description && <><br />{l.description}</>}</li>)}</ul>}</details>
    </>}
  </>
}
