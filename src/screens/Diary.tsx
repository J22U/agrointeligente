import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from '../App'
type Plot = { id: string; name: string; crop: string }
type Log = { id: string; plot_id: string; category: string; logged_on: string; description: string | null; details: Record<string, string> | null }
type Campo = { k: string; label: string; opts?: string[]; num?: boolean }
export const CATEGORIAS: Record<string, string> = { siembra: 'Siembra', riego: 'Riego', lluvia: 'Lluvia', fertilizacion: 'Fertilización', poda: 'Poda', malezas: 'Control de malezas', plagas: 'Monitoreo de plagas', tratamiento: 'Tratamiento', labor: 'Labor general', otro: 'Otro' }
const CAMPOS: Record<string, Campo[]> = {
  siembra: [{ k: 'material', label: 'Material sembrado (semilla o plántula)' }],
  riego: [{ k: 'duracion_min', label: 'Duración (minutos)', num: true }, { k: 'metodo', label: 'Sistema usado', opts: ['Goteo', 'Aspersión', 'Manguera', 'Surcos', 'Otro'] }],
  lluvia: [{ k: 'mm', label: 'Lluvia observada (mm)', num: true }],
  fertilizacion: [{ k: 'producto', label: 'Producto' }, { k: 'cantidad', label: 'Cantidad y unidad' }],
  tratamiento: [{ k: 'producto', label: 'Producto' }, { k: 'cantidad', label: 'Cantidad y unidad' }],
  plagas: [{ k: 'severidad', label: 'Severidad observada', opts: ['Baja', 'Media', 'Alta'] }, { k: 'afectado', label: 'Parte afectada' }],
}
const ETIQ: Record<string, string> = Object.fromEntries(Object.values(CAMPOS).flat().map(c => [c.k, c.label.replace(/ \(.*\)/, '')]))
const COLOR: Record<string, string> = { siembra: '#d8efc8', riego: '#cfe6f5', lluvia: '#d6e0f7', fertilizacion: '#f6e3b4', poda: '#e8dacb', malezas: '#dcebc0', plagas: '#f6d2cc', tratamiento: '#e6d6f1', labor: '#e1ece1', otro: '#ececec' }
const hoy = () => new Date().toLocaleDateString('en-CA')
export default function Diary({ go }: { go: (v: View) => void }) {
  const [plots, setPlots] = useState<Plot[] | null>(null); const [logs, setLogs] = useState<Log[] | null>(null); const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null)
  const [n, setN] = useState({ plot_id: '', category: 'labor', logged_on: hoy(), description: '' }); const [ex, setEx] = useState<Record<string, string>>({})
  const [fl, setFl] = useState({ plot: '', cat: '', from: '', to: '' }); const [editId, setEditId] = useState<string | null>(null); const [openF, setOpenF] = useState(false)
  useEffect(() => { supabase!.from('plots').select('id,name,crop').order('name').then(({ data, error }) => { if (error) setMsg({ ok: false, t: 'No se pudieron cargar los lotes.' }); else { setPlots(data as Plot[]); setN(x => ({ ...x, plot_id: data?.[0]?.id ?? '' })) } }) }, [])
  const loadLogs = async () => {
    let q = supabase!.from('farm_logs').select('id,plot_id,category,logged_on,description,details').order('logged_on', { ascending: false }).order('created_at', { ascending: false }).limit(200)
    if (fl.plot) q = q.eq('plot_id', fl.plot); if (fl.cat) q = q.eq('category', fl.cat); if (fl.from) q = q.gte('logged_on', fl.from); if (fl.to) q = q.lte('logged_on', fl.to)
    const { data, error } = await q; if (error) setMsg({ ok: false, t: 'No se pudo cargar el historial.' }); else setLogs(data as Log[]) }
  useEffect(() => { loadLogs() }, [fl])
  const campos = CAMPOS[n.category] ?? []
  const numsOk = campos.every(c => !c.num || (ex[c.k] ?? '') === '' || (isFinite(Number(ex[c.k])) && Number(ex[c.k]) >= 0))
  const valid = n.plot_id !== '' && n.logged_on !== '' && numsOk
  const add = async (e: React.FormEvent) => { e.preventDefault(); if (!valid) return
    const details = Object.fromEntries(campos.filter(c => (ex[c.k] ?? '').trim() !== '').map(c => [c.k, ex[c.k].trim()]))
    const row = { plot_id: n.plot_id, category: n.category, logged_on: n.logged_on, description: n.description.trim() || null, details }
    const { error } = editId ? await supabase!.from('farm_logs').update(row).eq('id', editId) : await supabase!.from('farm_logs').insert(row)
    if (error) setMsg({ ok: false, t: 'No se pudo guardar el registro.' }); else { setMsg({ ok: true, t: 'Registro guardado.' }); setN({ ...n, description: '' }); setEx({}); setEditId(null); loadLogs() } }
  const edit = (l: Log) => { setEditId(l.id); setOpenF(true); setN({ plot_id: l.plot_id, category: l.category, logged_on: l.logged_on, description: l.description ?? '' }); setEx(l.details ?? {}); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const cancelar = () => { setEditId(null); setN({ ...n, description: '' }); setEx({}) }
  const nombre = (id: string) => plots?.find(p => p.id === id)?.name ?? ''
  if (plots === null) return <><h1>Diario</h1><p className={msg ? 'err' : 'muted'}>{msg?.t || 'Cargando…'}</p></>
  if (plots.length === 0) return <><h1>Diario</h1><section className="empty"><h2>Necesitas un lote para registrar labores</h2><p>Cada registro del diario pertenece a un lote.</p><button className="primary" onClick={() => go('lotes')}>Crear lote</button></section></>
  const cats = Object.entries(CATEGORIAS)
  return <><h1>Diario agrícola</h1>
    <details className="fold" open={openF} onToggle={ev => setOpenF(ev.currentTarget.open)}><summary>{editId ? 'Editar registro' : 'Registrar labor'}</summary><form onSubmit={add} className="panel">
      <div className="two"><div><label htmlFor="dl">Lote</label><select id="dl" value={n.plot_id} onChange={e => setN({ ...n, plot_id: e.target.value })}>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select></div>
        <div><label htmlFor="dd">Fecha</label><input id="dd" type="date" value={n.logged_on} onChange={e => setN({ ...n, logged_on: e.target.value })} /></div></div>
      <p className="lab">¿Qué hiciste?</p>
      <div className="chips" role="group" aria-label="Actividad">{cats.map(([k, v]) => <button type="button" key={k} className={n.category === k ? 'chip on' : 'chip'} aria-pressed={n.category === k} onClick={() => { setN({ ...n, category: k }); setEx({}) }}>{v}</button>)}</div>
      {campos.length > 0 && <div className="two">{campos.map(c => <div key={c.k}><label htmlFor={`x-${c.k}`}>{c.label}</label>
        {c.opts ? <select id={`x-${c.k}`} value={ex[c.k] ?? ''} onChange={e => setEx({ ...ex, [c.k]: e.target.value })}><option value="">Sin indicar</option>{c.opts.map(o => <option key={o}>{o}</option>)}</select>
          : <input id={`x-${c.k}`} inputMode={c.num ? 'decimal' : 'text'} value={ex[c.k] ?? ''} onChange={e => setEx({ ...ex, [c.k]: e.target.value })} />}</div>)}</div>}
      {!numsOk && <p className="hint err">Revisa los números: deben ser cero o mayores.</p>}
      {n.category === 'tratamiento' && <p className="note">Anota lo que aplicaste según la etiqueta del producto. Esta app no recomienda dosis.</p>}
      <label htmlFor="dx">Observaciones (opcional)</label><textarea id="dx" rows={3} value={n.description} onChange={e => setN({ ...n, description: e.target.value })} />
      <button className="primary" disabled={!valid}>{editId ? 'Guardar cambios' : 'Guardar registro'}</button>{editId && <button type="button" onClick={cancelar}>Cancelar edición</button>}{msg && <p role="status" className={msg.ok ? 'hint ok' : 'hint err'}>{msg.t}</p>}</form></details>
    <h2>Historial{logs && <span className="count">{logs.length}</span>}</h2>
    <details className="fold"><summary>Filtros</summary><div className="filters"><select aria-label="Filtrar por lote" value={fl.plot} onChange={e => setFl({ ...fl, plot: e.target.value })}><option value="">Todos los lotes</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <select aria-label="Filtrar por actividad" value={fl.cat} onChange={e => setFl({ ...fl, cat: e.target.value })}><option value="">Todas las actividades</option>{cats.map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <input aria-label="Desde" type="date" value={fl.from} onChange={e => setFl({ ...fl, from: e.target.value })} /><input aria-label="Hasta" type="date" value={fl.to} onChange={e => setFl({ ...fl, to: e.target.value })} /></div></details>
    {logs === null ? <p className="muted">Cargando…</p> : logs.length === 0 ? <p className="muted">No hay registros con estos filtros.</p> : <div className="tabla" role="table" aria-label="Historial de labores">
      <div className="trow thead" role="row"><span>Fecha</span><span>Actividad</span><span>Lote</span><span>Detalle</span><span /></div>
      {logs.map(l => <div className="trow" role="row" key={l.id}>
        <span className="tf">{l.logged_on}</span>
        <span><i className="tag" style={{ background: COLOR[l.category] ?? '#ececec' }}>{CATEGORIAS[l.category] ?? l.category}</i></span>
        <span className="tl">{nombre(l.plot_id)}</span>
        <span className="td">{l.details && Object.keys(l.details).length > 0 && <span className="det">{Object.entries(l.details).map(([k, v]) => `${ETIQ[k] ?? k}: ${v}`).join(' · ')}</span>}{l.description && <em>{l.description}</em>}{!l.description && (!l.details || Object.keys(l.details).length === 0) && <em>Sin detalle</em>}</span>
        <div className="btns"><button onClick={() => edit(l)}>Editar</button><button className="danger" onClick={async () => { if (confirm('¿Eliminar este registro?')) { await supabase!.from('farm_logs').delete().eq('id', l.id); loadLogs() } }}>Eliminar</button></div></div>)}</div>}</>
}
