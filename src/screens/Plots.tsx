import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { View } from '../App'
type Farm = { id: string; name: string }
type Plot = { id: string; farm_id: string; name: string; crop: string; variety: string | null; area_ha: number | null; planted_on: string | null; stage: string | null }
const ETAPAS = ['Preparación', 'Siembra', 'Crecimiento', 'Floración', 'Fructificación', 'Cosecha', 'Descanso']
const CULTIVOS = ['Tomate', 'Lechuga', 'Cebolla', 'Aguacate', 'Café', 'Cítricos', 'Maíz', 'Papa', 'Flores']
const vacio = { farm_id: '', name: '', crop: '', variety: '', area: '', planted_on: '', stage: '' }
export default function Plots({ go }: { go: (v: View) => void }) {
  const [farms, setFarms] = useState<Farm[] | null>(null); const [plots, setPlots] = useState<Plot[]>([]); const [f, setF] = useState(vacio); const [msg, setMsg] = useState(''); const [editId, setEditId] = useState<string | null>(null); const formRef = useRef<HTMLFormElement>(null); const [openF, setOpenF] = useState(false)
  const set = (k: keyof typeof vacio) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const load = async () => {
    const [a, b] = await Promise.all([supabase!.from('farms').select('id,name').order('name'), supabase!.from('plots').select('*').order('created_at')])
    if (a.error || b.error) { setMsg('No se pudieron cargar los lotes.'); return }
    setFarms(a.data as Farm[]); setPlots(b.data as Plot[]); setF(x => ({ ...x, farm_id: x.farm_id || (a.data?.[0]?.id ?? '') }))
  }
  useEffect(() => { load() }, [])
  const edit = (p: Plot) => { setEditId(p.id); setOpenF(true); setF({ farm_id: p.farm_id, name: p.name, crop: p.crop, variety: p.variety ?? '', area: p.area_ha === null ? '' : String(p.area_ha), planted_on: p.planted_on ?? '', stage: p.stage ?? '' }); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 0) }
  const cancelar = () => { setEditId(null); setF({ ...vacio, farm_id: f.farm_id }) }
  const area = f.area === '' ? null : Number(f.area); const valid = !!f.farm_id && f.name.trim() !== '' && f.crop.trim() !== '' && (area === null || (!isNaN(area) && area >= 0))
  const add = async (e: React.FormEvent) => { e.preventDefault(); if (!valid) return
    const row = { farm_id: f.farm_id, name: f.name.trim(), crop: f.crop.trim(), variety: f.variety.trim() || null, area_ha: area, planted_on: f.planted_on || null, stage: f.stage || null }
    const { error } = editId ? await supabase!.from('plots').update(row).eq('id', editId) : await supabase!.from('plots').insert(row)
    if (error) setMsg('No se pudo guardar el lote.'); else { setMsg(''); setF({ ...vacio, farm_id: f.farm_id }); setEditId(null); setOpenF(false); load() } }
  if (farms === null) return <><h1>Lotes</h1><p className={msg ? 'err' : 'muted'}>{msg || 'Cargando…'}</p></>
  if (farms.length === 0) return <><h1>Lotes</h1><section className="empty"><h2>Primero crea una finca</h2><p>Los lotes viven dentro de una finca.</p><button className="primary" onClick={() => go('fincas')}>Crear finca</button></section></>
  return <><h1>Lotes</h1>
    {plots.length === 0 ? <p className="muted">Aún no tienes lotes. Agrega el primero con el formulario.</p> : farms.filter(x => plots.some(p => p.farm_id === x.id)).map(fm => <details key={fm.id} className="fold" open><summary>{fm.name}<span className="count">{plots.filter(p => p.farm_id === fm.id).length}</span></summary>
      <ul className="list">{plots.filter(p => p.farm_id === fm.id).map(p => <li key={p.id} className="row"><span className="avatar">{p.crop[0].toUpperCase()}</span><div><b>{p.name}</b> <span className="muted">· {p.crop}{p.variety ? ` (${p.variety})` : ''}</span><br />
        <span className="muted">{[p.area_ha ? `${p.area_ha} ha` : null, p.stage, p.planted_on ? `sembrado ${p.planted_on}` : null].filter(Boolean).join(' · ') || 'Sin más datos'}</span></div>
        <div className="btns"><button onClick={() => edit(p)}>Editar</button><button className="danger" onClick={async () => { if (confirm(`¿Eliminar el lote "${p.name}" con su diario y registros? No se puede deshacer.`)) { await supabase!.from('plots').delete().eq('id', p.id); load() } }}>Eliminar</button></div></li>)}</ul></details>)}
    <details className="fold" open={openF || plots.length === 0} onToggle={ev => setOpenF(ev.currentTarget.open)}><summary>{editId ? 'Editar lote' : 'Nuevo lote'}</summary><form ref={formRef} onSubmit={add} className="form">
      <label htmlFor="pf">Finca</label><select id="pf" value={f.farm_id} onChange={set('farm_id')}>{farms.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
      <label htmlFor="pn">Nombre o código del lote</label><input id="pn" value={f.name} onChange={set('name')} />
      <label htmlFor="pc">Cultivo</label><input id="pc" list="cultivos" value={f.crop} onChange={set('crop')} /><datalist id="cultivos">{CULTIVOS.map(c => <option key={c} value={c} />)}</datalist>
      <label htmlFor="pv">Variedad (opcional)</label><input id="pv" value={f.variety} onChange={set('variety')} />
      <label htmlFor="pa">Área en hectáreas (opcional)</label><input id="pa" inputMode="decimal" value={f.area} onChange={set('area')} />
      <label htmlFor="pd">Fecha de siembra (opcional)</label><input id="pd" type="date" value={f.planted_on} onChange={set('planted_on')} />
      <label htmlFor="ps">Etapa (opcional)</label><select id="ps" value={f.stage} onChange={set('stage')}><option value="">Sin definir</option>{ETAPAS.map(e => <option key={e}>{e}</option>)}</select>
      <button className="primary" disabled={!valid}>{editId ? 'Guardar cambios' : 'Guardar lote'}</button>{editId && <button type="button" onClick={cancelar}>Cancelar edición</button>}{msg && <p role="status" className="hint err">{msg}</p>}</form></details></>
}
