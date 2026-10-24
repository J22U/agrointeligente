import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
type Farm = { id: string; name: string; municipality: string | null; area_ha: number | null }
export default function Farms() {
  const [farms, setFarms] = useState<Farm[] | null>(null); const [name, setName] = useState(''); const [mun, setMun] = useState(''); const [area, setArea] = useState(''); const [msg, setMsg] = useState('')
  const load = async () => { const { data, error } = await supabase!.from('farms').select('id,name,municipality,area_ha').order('created_at'); if (error) setMsg('No se pudieron cargar las fincas.'); else setFarms(data as Farm[]) }
  useEffect(() => { load() }, [])
  const areaNum = area === '' ? null : Number(area); const valid = name.trim().length > 0 && (areaNum === null || (!isNaN(areaNum) && areaNum >= 0))
  const add = async (e: React.FormEvent) => { e.preventDefault(); if (!valid) return
    const { error } = await supabase!.from('farms').insert({ name: name.trim(), municipality: mun.trim() || null, area_ha: areaNum })
    if (error) setMsg('No se pudo guardar la finca.'); else { setMsg(''); setName(''); setMun(''); setArea(''); load() } }
  return <>
    <h1>Fincas</h1>
    {farms === null ? <p className="muted">Cargando…</p> : farms.length === 0 ? <p className="muted">Aún no tienes fincas. Agrega la primera con el formulario.</p> :
      <ul className="list">{farms.map(f => <li key={f.id} className="row"><span className="avatar">{f.name[0]?.toUpperCase()}</span><div><b>{f.name}</b><br /><span className="muted">{[f.municipality, f.area_ha ? `${f.area_ha} ha` : null].filter(Boolean).join(' · ') || 'Sin más datos'}</span></div>
        <button className="danger" onClick={async () => { if (confirm(`¿Eliminar "${f.name}" y todos sus lotes? No se puede deshacer.`)) { await supabase!.from('farms').delete().eq('id', f.id); load() } }}>Eliminar</button></li>)}</ul>}
    <form onSubmit={add} className="form"><h2>Nueva finca</h2>
      <label htmlFor="n">Nombre</label><input id="n" value={name} onChange={e => setName(e.target.value)} />
      <label htmlFor="m">Municipio (opcional)</label><input id="m" value={mun} onChange={e => setMun(e.target.value)} />
      <label htmlFor="a">Área en hectáreas (opcional)</label><input id="a" inputMode="decimal" value={area} onChange={e => setArea(e.target.value)} />
      <button className="primary" disabled={!valid}>Guardar finca</button>{msg && <p role="status" className="hint err">{msg}</p>}</form>
  </>
}
