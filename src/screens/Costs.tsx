import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { summarize, toCsv } from '../lib/finance'
import type { View } from '../App'
type Plot = { id: string; name: string; crop: string }
type Ex = { id: string; plot_id: string; kind: string; amount: number; spent_on: string; note: string | null }
type Hv = { id: string; plot_id: string; harvested_on: string; quantity: number; unit: string; losses: number; unit_price: number | null }
const TIPOS: Record<string, string> = { insumos: 'Insumos', mano_obra: 'Mano de obra', transporte: 'Transporte', otros: 'Otros' }
const UNIDADES = ['kg', 'lb', 'ton', 'bultos', 'cajas', 'unidades']
const hoy = () => new Date().toLocaleDateString('en-CA')
const descargar = (nombre: string, filas: Record<string, string | number | null>[]) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + toCsv(filas)], { type: 'text/csv;charset=utf-8' })); a.download = nombre; a.click(); URL.revokeObjectURL(a.href) }
export default function Costs({ go }: { go: (v: View) => void }) {
  const [plots, setPlots] = useState<Plot[] | null>(null); const [cur, setCur] = useState('COP'); const [ex, setEx] = useState<Ex[]>([]); const [hv, setHv] = useState<Hv[]>([]); const [msg, setMsg] = useState('')
  const [fl, setFl] = useState({ plot: '', from: '', to: '' }); const [editEx, setEditEx] = useState<string | null>(null); const [editHv, setEditHv] = useState<string | null>(null); const [openEx, setOpenEx] = useState(false); const [openHv, setOpenHv] = useState(false)
  const [e, setE] = useState({ plot_id: '', kind: 'insumos', amount: '', spent_on: hoy(), note: '' })
  const [h, setH] = useState({ plot_id: '', harvested_on: hoy(), quantity: '', unit: 'kg', losses: '0', price: '' })
  useEffect(() => { (async () => {
    const [p, pr] = await Promise.all([supabase!.from('plots').select('id,name,crop').order('name'), supabase!.from('profiles').select('currency').maybeSingle()])
    if (p.error) { setMsg('No se pudieron cargar los lotes.'); return }
    if (pr.data?.currency) setCur(pr.data.currency)
    const id = p.data?.[0]?.id ?? ''; setE(x => ({ ...x, plot_id: id })); setH(x => ({ ...x, plot_id: id })); setPlots(p.data as Plot[]) })() }, [])
  const load = async () => {
    let a = supabase!.from('expenses').select('*').order('spent_on', { ascending: false }).limit(500); let b = supabase!.from('harvests').select('*').order('harvested_on', { ascending: false }).limit(500)
    if (fl.plot) { a = a.eq('plot_id', fl.plot); b = b.eq('plot_id', fl.plot) }
    if (fl.from) { a = a.gte('spent_on', fl.from); b = b.gte('harvested_on', fl.from) } if (fl.to) { a = a.lte('spent_on', fl.to); b = b.lte('harvested_on', fl.to) }
    const [ra, rb] = await Promise.all([a, b]); if (ra.error || rb.error) setMsg('No se pudieron cargar los datos.'); else { setEx(ra.data as Ex[]); setHv(rb.data as Hv[]) } }
  useEffect(() => { if (plots) load() }, [fl, plots])
  const num = (v: string) => (v.trim() === '' ? NaN : Number(v))
  const editExp = (x: Ex) => { setEditEx(x.id); setE({ plot_id: x.plot_id, kind: x.kind, amount: String(x.amount), spent_on: x.spent_on, note: x.note ?? '' }); setOpenEx(true); setOpenHv(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const editCos = (x: Hv) => { setEditHv(x.id); setH({ plot_id: x.plot_id, harvested_on: x.harvested_on, quantity: String(x.quantity), unit: x.unit, losses: String(x.losses), price: x.unit_price === null ? '' : String(x.unit_price) }); setOpenHv(true); setOpenEx(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const cancelEx = () => { setEditEx(null); setE({ ...e, amount: '', note: '' }); setOpenEx(false) }
  const cancelHv = () => { setEditHv(null); setH({ ...h, quantity: '', losses: '0', price: '' }); setOpenHv(false) }
  const exOk = e.plot_id !== '' && num(e.amount) > 0 && e.spent_on !== ''
  const hvOk = h.plot_id !== '' && num(h.quantity) > 0 && num(h.losses) >= 0 && num(h.losses) <= num(h.quantity) && (h.price === '' || num(h.price) >= 0) && h.harvested_on !== ''
  const addEx = async (ev: React.FormEvent) => { ev.preventDefault(); if (!exOk) return
    const row = { plot_id: e.plot_id, kind: e.kind, amount: num(e.amount), spent_on: e.spent_on, note: e.note.trim() || null }
    const { error } = editEx ? await supabase!.from('expenses').update(row).eq('id', editEx) : await supabase!.from('expenses').insert(row)
    if (error) setMsg('No se pudo guardar el gasto.'); else { setMsg(''); setE({ ...e, amount: '', note: '' }); setOpenEx(editEx === null); setEditEx(null); load() } }
  const addHv = async (ev: React.FormEvent) => { ev.preventDefault(); if (!hvOk) return
    const row = { plot_id: h.plot_id, harvested_on: h.harvested_on, quantity: num(h.quantity), unit: h.unit, losses: num(h.losses), unit_price: h.price === '' ? null : num(h.price) }
    const { error } = editHv ? await supabase!.from('harvests').update(row).eq('id', editHv) : await supabase!.from('harvests').insert(row)
    if (error) setMsg('No se pudo guardar la cosecha.'); else { setMsg(''); setH({ ...h, quantity: '', losses: '0', price: '' }); setOpenHv(editHv === null); setEditHv(null); load() } }
  if (plots === null) return <><h1>Costos y cosechas</h1><p className={msg ? 'err' : 'muted'}>{msg || 'Cargando…'}</p></>
  if (plots.length === 0) return <><h1>Costos y cosechas</h1><section className="empty"><h2>Necesitas un lote primero</h2><p>Los gastos y cosechas se registran por lote.</p><button className="primary" onClick={() => go('lotes')}>Crear lote</button></section></>
  const money = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n)
  const s = summarize(ex.map(x => ({ amount: Number(x.amount), spent_on: x.spent_on })), hv.map(x => ({ quantity: Number(x.quantity), losses: Number(x.losses), unit_price: x.unit_price === null ? null : Number(x.unit_price), harvested_on: x.harvested_on })))
  const units = [...new Set(hv.map(x => x.unit))]; const one = units.length === 1 ? units[0] : null; const nm = (id: string) => plots.find(p => p.id === id)?.name ?? ''
  const Sel = ({ v, on }: { v: string; on: (x: string) => void }) => <select value={v} onChange={ev => on(ev.target.value)}>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select>
  return <><h1>Costos y cosechas</h1>
    <details className="fold"><summary>Filtros</summary><div className="filters"><select aria-label="Lote" value={fl.plot} onChange={ev => setFl({ ...fl, plot: ev.target.value })}><option value="">Todos los lotes</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      <input aria-label="Desde" type="date" value={fl.from} onChange={ev => setFl({ ...fl, from: ev.target.value })} /><input aria-label="Hasta" type="date" value={fl.to} onChange={ev => setFl({ ...fl, to: ev.target.value })} /></div></details>
    <dl className="stats"><div><dt>Costos</dt><dd>{money(s.cost)}</dd></div><div><dt>Producción neta</dt><dd>{one ? `${s.produced} ${one}` : '—'}</dd></div><div><dt>Ingresos</dt><dd>{money(s.income)}</dd></div><div><dt>Margen bruto</dt><dd>{money(s.grossMargin)}</dd></div></dl>
    <p className="muted hint">{one && s.costPerUnit !== null ? `Costo por ${one}: ${money(s.costPerUnit)}. ` : ''}{units.length > 1 ? 'Hay cosechas en distintas unidades, así que no se suma la producción. ' : ''}Producción neta = cosechado − pérdidas. Ingresos = producción neta × precio de venta (solo si todas las cosechas tienen precio). Margen bruto = ingresos − costos registrados; no es utilidad neta.</p>
    <details className="fold" open={openEx} onToggle={ev => setOpenEx(ev.currentTarget.open)}><summary>{editEx ? 'Editar gasto' : 'Registrar gasto'}</summary><form onSubmit={addEx} className="form">
      <label>Lote</label><Sel v={e.plot_id} on={x => setE({ ...e, plot_id: x })} />
      <label htmlFor="ek">Tipo</label><select id="ek" value={e.kind} onChange={ev => setE({ ...e, kind: ev.target.value })}>{Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
      <label htmlFor="ea">Monto ({cur})</label><input id="ea" inputMode="decimal" value={e.amount} onChange={ev => setE({ ...e, amount: ev.target.value })} />
      <label htmlFor="ed">Fecha</label><input id="ed" type="date" value={e.spent_on} onChange={ev => setE({ ...e, spent_on: ev.target.value })} />
      <label htmlFor="en">Nota (opcional)</label><input id="en" value={e.note} onChange={ev => setE({ ...e, note: ev.target.value })} />
      <button className="primary" disabled={!exOk}>{editEx ? 'Guardar cambios' : 'Guardar gasto'}</button>{editEx && <button type="button" onClick={cancelEx}>Cancelar edición</button>}</form></details>
    <details className="fold" open={openHv} onToggle={ev => setOpenHv(ev.currentTarget.open)}><summary>{editHv ? 'Editar cosecha' : 'Registrar cosecha'}</summary><form onSubmit={addHv} className="form">
      <label>Lote</label><Sel v={h.plot_id} on={x => setH({ ...h, plot_id: x })} />
      <label htmlFor="hd">Fecha</label><input id="hd" type="date" value={h.harvested_on} onChange={ev => setH({ ...h, harvested_on: ev.target.value })} />
      <label htmlFor="hq">Cantidad cosechada</label><input id="hq" inputMode="decimal" value={h.quantity} onChange={ev => setH({ ...h, quantity: ev.target.value })} />
      <label htmlFor="hu">Unidad</label><select id="hu" value={h.unit} onChange={ev => setH({ ...h, unit: ev.target.value })}>{UNIDADES.map(u => <option key={u}>{u}</option>)}</select>
      <label htmlFor="hl">Pérdidas (misma unidad)</label><input id="hl" inputMode="decimal" value={h.losses} onChange={ev => setH({ ...h, losses: ev.target.value })} />
      {num(h.losses) > num(h.quantity) && <p className="hint err">Las pérdidas no pueden superar lo cosechado.</p>}
      <label htmlFor="hp">Precio de venta por {h.unit} (opcional)</label><input id="hp" inputMode="decimal" value={h.price} onChange={ev => setH({ ...h, price: ev.target.value })} />
      <button className="primary" disabled={!hvOk}>{editHv ? 'Guardar cambios' : 'Guardar cosecha'}</button>{editHv && <button type="button" onClick={cancelHv}>Cancelar edición</button>}</form></details>
    {msg && <p role="status" className="err">{msg}</p>}
    <details className="fold" open><summary>Gastos<span className="count">{ex.length}</span></summary>{ex.length === 0 ? <p className="muted">No hay gastos con estos filtros.</p> : <ul className="list">{ex.map(x => <li key={x.id} className="row"><div><b>{money(Number(x.amount))}</b> <span className="muted">· {TIPOS[x.kind]} · {nm(x.plot_id)}</span><br /><span className="muted">{x.spent_on}{x.note ? ` · ${x.note}` : ''}</span></div>
      <div className="btns"><button onClick={() => editExp(x)}>Editar</button><button className="danger" onClick={async () => { if (confirm('¿Eliminar este gasto?')) { await supabase!.from('expenses').delete().eq('id', x.id); load() } }}>Eliminar</button></div></li>)}</ul>}</details>
    <details className="fold" open><summary>Cosechas<span className="count">{hv.length}</span></summary>{hv.length === 0 ? <p className="muted">No hay cosechas con estos filtros.</p> : <ul className="list">{hv.map(x => <li key={x.id} className="row"><div><b>{x.quantity} {x.unit}</b> <span className="muted">· {nm(x.plot_id)}</span><br /><span className="muted">{x.harvested_on} · pérdidas {x.losses}{x.unit_price !== null ? ` · ${money(Number(x.unit_price))}/${x.unit}` : ' · sin precio'}</span></div>
      <div className="btns"><button onClick={() => editCos(x)}>Editar</button><button className="danger" onClick={async () => { if (confirm('¿Eliminar esta cosecha?')) { await supabase!.from('harvests').delete().eq('id', x.id); load() } }}>Eliminar</button></div></li>)}</ul>}</details>
    <details className="fold"><summary>Exportar a CSV</summary><div className="actions"><button disabled={ex.length === 0} onClick={() => descargar('gastos.csv', ex.map(x => ({ fecha: x.spent_on, lote: nm(x.plot_id), tipo: TIPOS[x.kind], monto: Number(x.amount), nota: x.note })))}>Descargar gastos</button>
      <button disabled={hv.length === 0} onClick={() => descargar('cosechas.csv', hv.map(x => ({ fecha: x.harvested_on, lote: nm(x.plot_id), cantidad: Number(x.quantity), unidad: x.unit, perdidas: Number(x.losses), precio_unitario: x.unit_price })))}>Descargar cosechas</button></div></details></>
}
