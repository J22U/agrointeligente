import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Plot = { id: string; name: string; crop: string }
type Task = { id: string; plot_id: string | null; title: string; due_on: string | null; priority: string; done: boolean }
const COL: Record<string, string> = { alta: '#f6d2cc', media: '#fbf0d3', baja: '#e1ece1' }
const hoy = () => new Date().toLocaleDateString('en-CA')
const vacio = { title: '', plot_id: '', due_on: '', priority: 'media' }
export default function Tasks() {
  const [plots, setPlots] = useState<Plot[]>([]); const [tasks, setTasks] = useState<Task[] | null>(null); const [f, setF] = useState(vacio); const [editId, setEditId] = useState<string | null>(null); const [open, setOpen] = useState(false); const [msg, setMsg] = useState('')
  const load = async () => { const { data, error } = await supabase!.from('tasks').select('id,plot_id,title,due_on,priority,done').order('due_on', { ascending: true, nullsFirst: false }); if (error) setMsg('No se pudieron cargar las tareas.'); else setTasks(data as Task[]) }
  useEffect(() => { supabase!.from('plots').select('id,name,crop').order('name').then(({ data }) => setPlots((data ?? []) as Plot[])); load() }, [])
  const nm = (id: string | null) => plots.find(p => p.id === id)?.name
  const valid = f.title.trim().length > 0
  const save = async (e: React.FormEvent) => { e.preventDefault(); if (!valid) return
    const row = { title: f.title.trim(), plot_id: f.plot_id || null, due_on: f.due_on || null, priority: f.priority }
    const { error } = editId ? await supabase!.from('tasks').update(row).eq('id', editId) : await supabase!.from('tasks').insert(row)
    if (error) setMsg('No se pudo guardar la tarea.'); else { setMsg(''); setF(vacio); setEditId(null); setOpen(false); load() } }
  const edit = (t: Task) => { setEditId(t.id); setF({ title: t.title, plot_id: t.plot_id ?? '', due_on: t.due_on ?? '', priority: t.priority }); setOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const toggle = async (t: Task) => { await supabase!.from('tasks').update({ done: !t.done }).eq('id', t.id); load() }
  const fila = (t: Task) => { const venc = !t.done && !!t.due_on && t.due_on < hoy()
    return <li key={t.id} className="trea"><button className={t.done ? 'chk on' : 'chk'} aria-label={t.done ? 'Marcar como pendiente' : 'Marcar como hecha'} onClick={() => toggle(t)}>{t.done ? '✓' : ''}</button>
      <div className="tb"><b className={t.done ? 'hecha' : ''}>{t.title}</b><br /><span className={venc ? 'err' : 'muted'}>{[venc ? 'Vencida' : null, t.due_on ?? 'Sin fecha', nm(t.plot_id)].filter(Boolean).join(' · ')}</span> <i className="tag" style={{ background: COL[t.priority] }}>{t.priority}</i></div>
      <div className="btns"><button onClick={() => edit(t)}>Editar</button><button className="danger" onClick={async () => { if (confirm('¿Eliminar esta tarea?')) { await supabase!.from('tasks').delete().eq('id', t.id); load() } }}>Eliminar</button></div></li> }
  if (tasks === null) return <><h1>Tareas</h1><p className={msg ? 'err' : 'muted'}>{msg || 'Cargando…'}</p></>
  const pend = tasks.filter(t => !t.done); const hechas = tasks.filter(t => t.done)
  return <><h1>Tareas</h1>
    <details className="fold" open={open} onToggle={ev => setOpen(ev.currentTarget.open)}><summary>{editId ? 'Editar tarea' : 'Nueva tarea'}</summary>
      <form onSubmit={save} className="form">
        <label htmlFor="tt">¿Qué hay que hacer?</label><input id="tt" value={f.title} maxLength={140} onChange={e => setF({ ...f, title: e.target.value })} />
        <label htmlFor="tl">Lote (opcional)</label><select id="tl" value={f.plot_id} onChange={e => setF({ ...f, plot_id: e.target.value })}><option value="">Sin lote</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select>
        <div className="two"><div><label htmlFor="td">Fecha (opcional)</label><input id="td" type="date" value={f.due_on} onChange={e => setF({ ...f, due_on: e.target.value })} /></div>
          <div><label htmlFor="tp">Prioridad</label><select id="tp" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value })}><option value="baja">Baja</option><option value="media">Media</option><option value="alta">Alta</option></select></div></div>
        <button className="primary" disabled={!valid}>{editId ? 'Guardar cambios' : 'Guardar tarea'}</button>
        {editId && <button type="button" onClick={() => { setEditId(null); setF(vacio); setOpen(false) }}>Cancelar edición</button>}{msg && <p role="status" className="hint err">{msg}</p>}</form></details>
    <h2>Pendientes<span className="count">{pend.length}</span></h2>
    {pend.length === 0 ? <p className="muted">No tienes tareas pendientes. Crea una con "Nueva tarea".</p> : <ul className="list">{pend.map(fila)}</ul>}
    {hechas.length > 0 && <details className="fold"><summary>Completadas<span className="count">{hechas.length}</span></summary><ul className="list">{hechas.map(fila)}</ul></details>}</>
}
