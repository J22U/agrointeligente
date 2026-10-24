import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from '../App'
type Plot = { id: string; name: string; crop: string }
type Log = { id: string; plot_id: string; category: string; logged_on: string; description: string | null }
export const CATEGORIAS: Record<string, string> = { siembra: 'Siembra', riego: 'Riego', lluvia: 'Lluvia', fertilizacion: 'Fertilización', poda: 'Poda', malezas: 'Control de malezas', plagas: 'Monitoreo de plagas', tratamiento: 'Tratamiento', labor: 'Labor general', otro: 'Otro' }
const hoy = () => new Date().toLocaleDateString('en-CA')
export default function Diary({ go }: { go: (v: View) => void }) {
  const [plots, setPlots] = useState<Plot[] | null>(null); const [logs, setLogs] = useState<Log[] | null>(null); const [msg, setMsg] = useState('')
  const [n, setN] = useState({ plot_id: '', category: 'labor', logged_on: hoy(), description: '' })
  const [fl, setFl] = useState({ plot: '', cat: '', from: '', to: '' })
  useEffect(() => { supabase!.from('plots').select('id,name,crop').order('name').then(({ data, error }) => { if (error) setMsg('No se pudieron cargar los lotes.'); else { setPlots(data as Plot[]); setN(x => ({ ...x, plot_id: data?.[0]?.id ?? '' })) } }) }, [])
  const loadLogs = async () => {
    let q = supabase!.from('farm_logs').select('id,plot_id,category,logged_on,description').order('logged_on', { ascending: false }).order('created_at', { ascending: false }).limit(200)
    if (fl.plot) q = q.eq('plot_id', fl.plot); if (fl.cat) q = q.eq('category', fl.cat); if (fl.from) q = q.gte('logged_on', fl.from); if (fl.to) q = q.lte('logged_on', fl.to)
    const { data, error } = await q; if (error) setMsg('No se pudo cargar el historial.'); else setLogs(data as Log[]) }
  useEffect(() => { loadLogs() }, [fl])
  const valid = n.plot_id !== '' && n.logged_on !== ''
  const add = async (e: React.FormEvent) => { e.preventDefault(); if (!valid) return
    const { error } = await supabase!.from('farm_logs').insert({ plot_id: n.plot_id, category: n.category, logged_on: n.logged_on, description: n.description.trim() || null })
    if (error) setMsg('No se pudo guardar el registro.'); else { setMsg(''); setN({ ...n, description: '' }); loadLogs() } }
  const nombre = (id: string) => plots?.find(p => p.id === id)?.name ?? ''
  if (plots === null) return <><h1>Diario</h1><p className={msg ? 'err' : 'muted'}>{msg || 'Cargando…'}</p></>
  if (plots.length === 0) return <><h1>Diario</h1><section className="empty"><h2>Necesitas un lote para registrar labores</h2><p>Cada registro del diario pertenece a un lote.</p><button className="primary" onClick={() => go('lotes')}>Crear lote</button></section></>
  const cats = Object.entries(CATEGORIAS)
  return <><h1>Diario agrícola</h1>
    <form onSubmit={add} className="form"><h2>Registrar labor</h2>
      <label htmlFor="dl">Lote</label><select id="dl" value={n.plot_id} onChange={e => setN({ ...n, plot_id: e.target.value })}>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select>
      <label htmlFor="dc">Tipo de actividad</label><select id="dc" value={n.category} onChange={e => setN({ ...n, category: e.target.value })}>{cats.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <label htmlFor="dd">Fecha</label><input id="dd" type="date" value={n.logged_on} onChange={e => setN({ ...n, logged_on: e.target.value })} />
      <label htmlFor="dx">Descripción (opcional)</label><textarea id="dx" rows={3} value={n.description} onChange={e => setN({ ...n, description: e.target.value })} />
      <button className="primary" disabled={!valid}>Guardar registro</button>{msg && <p role="status" className="hint err">{msg}</p>}</form>
    <h2>Historial</h2>
    <div className="filters"><select aria-label="Filtrar por lote" value={fl.plot} onChange={e => setFl({ ...fl, plot: e.target.value })}><option value="">Todos los lotes</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label="Filtrar por actividad" value={fl.cat} onChange={e => setFl({ ...fl, cat: e.target.value })}><option value="">Todas las actividades</option>{cats.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input aria-label="Desde" type="date" value={fl.from} onChange={e => setFl({ ...fl, from: e.target.value })} /><input aria-label="Hasta" type="date" value={fl.to} onChange={e => setFl({ ...fl, to: e.target.value })} /></div>
    {logs === null ? <p className="muted">Cargando…</p> : logs.length === 0 ? <p className="muted">No hay registros con estos filtros.</p> : <ol className="timeline">{logs.map(l => <li key={l.id}>
      <div className="row"><div><b>{CATEGORIAS[l.category] ?? l.category}</b> <span className="muted">· {nombre(l.plot_id)}</span><br /><span className="muted">{l.logged_on}</span></div>
        <button className="danger" onClick={async () => { if (confirm('¿Eliminar este registro?')) { await supabase!.from('farm_logs').delete().eq('id', l.id); loadLogs() } }}>Eliminar</button></div>
      {l.description && <p>{l.description}</p>}</li>)}</ol>}</>
}
