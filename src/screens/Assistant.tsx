import { useEffect, useRef, useState } from 'react'
import { FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
type Plot = { id: string; name: string; crop: string }
type Img = { media_type: string; data: string; url: string }
type Hist = { id: string; question: string; answer: string | null; created_at: string }
const TIPOS = ['Diagnóstico por fotos', 'Riego', 'Nutrición', 'Manejo preventivo', 'Planificación', 'Pregunta general']
const PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const resize = (file: File) => new Promise<Img>((res, rej) => {
  const img = new Image(); const u = URL.createObjectURL(file)
  img.onload = () => { const k = Math.min(1, 1280 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); const url = c.toDataURL('image/jpeg', 0.82); URL.revokeObjectURL(u); res({ media_type: 'image/jpeg', data: url.split(',')[1], url }) }
  img.onerror = () => { URL.revokeObjectURL(u); rej(new Error('formato')) }; img.src = u })
const host = (u: string) => { try { return new URL(u).hostname } catch { return '' } }
const limpiar = (l: string) => l.replace(/\*\*/g, '')
const Texto = ({ t }: { t: string }) => <div className="ans">{t.split('\n').map((raw, i) => { const l = raw.trim(); if (!l) return null
  const h = l.match(/^#{1,4}\s+(.*)/); if (h) return <h3 key={i}>{limpiar(h[1])}</h3>
  if (/^\*\*[^*]+\*\*:?$/.test(l)) return <h3 key={i}>{limpiar(l).replace(/:$/, '')}</h3>
  if (/^[-*•]\s+/.test(l)) return <p key={i} className="bul">{limpiar(l.replace(/^[-*•]\s+/, ''))}</p>
  return <p key={i}>{limpiar(l)}</p> })}</div>
export default function Assistant() {
  const [plots, setPlots] = useState<Plot[]>([]); const [plotId, setPlotId] = useState(''); const [tipo, setTipo] = useState(TIPOS[0]); const [desc, setDesc] = useState(''); const [desde, setDesde] = useState(''); const [cond, setCond] = useState('')
  const [imgs, setImgs] = useState<Img[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [ans, setAns] = useState(''); const [rest, setRest] = useState<number | null>(null); const [hist, setHist] = useState<Hist[]>([])
  const file = useRef<HTMLInputElement>(null); const [abierto, setAbierto] = useState<'guiada' | 'buscar' | null>(null); const modo = abierto ?? 'guiada'; const [q, setQ] = useState(''); const [src, setSrc] = useState<{ title: string; url: string }[]>([]); const [sug, setSug] = useState('')
  const loadHist = async () => { const { data } = await supabase!.from('ai_queries').select('id,question,answer,created_at').not('answer', 'is', null).order('created_at', { ascending: false }).limit(10); setHist((data ?? []) as Hist[]) }
  useEffect(() => { supabase!.from('plots').select('id,name,crop').order('name').then(({ data }) => setPlots((data ?? []) as Plot[])); loadHist() }, [])
  const addFiles = async (list: FileList | null) => { if (!list) return; setErr('')
    for (const f of Array.from(list)) {
      if (imgs.length >= 3) { setErr('Máximo 3 fotos por consulta.'); break }
      if (!PERMITIDOS.includes(f.type) || f.size > 15 * 1024 * 1024) { setErr('Usa fotos JPG, PNG o WebP de menos de 15 MB.'); continue }
      try { const r = await resize(f); setImgs(x => x.length < 3 ? [...x, r] : x) } catch { setErr('No se pudo leer una de las fotos.') } }
    if (file.current) file.current.value = '' }
  const ask = async () => { setBusy(true); setErr(''); setAns(''); setSrc([]); setSug('')
    const question = modo === 'buscar' ? `Tipo de consulta: Búsqueda en internet\nPregunta: ${q.trim()}` : `Tipo de consulta: ${tipo}\nDescripción: ${desc.trim()}${desde.trim() ? `\nDesde cuándo: ${desde.trim()}` : ''}${cond.trim() ? `\nRiego y condiciones recientes observadas por el usuario: ${cond.trim()}` : ''}`
    const { data, error } = await supabase!.functions.invoke('ai-consult', { body: { question, plot_id: plotId || null, web: modo === 'buscar', images: modo === 'buscar' ? [] : imgs.map(({ media_type, data }) => ({ media_type, data })) } })
    if (error) {
      let m = 'No se pudo conectar con el asistente. Revisa tu conexión a internet.'
      if (error instanceof FunctionsHttpError) { const st = error.context.status; const j = await error.context.json().catch(() => null)
        m = j?.error ?? (st === 404 ? 'La función ai-consult todavía no está desplegada en Supabase.' : st === 401 ? 'Supabase rechazó tu sesión para la función. Cierra sesión, vuelve a entrar y reintenta.' : `El servidor respondió con error ${st}${j?.message ? ': ' + j.message : ''}.`) }
      else if (error instanceof FunctionsRelayError) m = 'Supabase no pudo ejecutar la función. Revisa que esté desplegada.'
      setErr(m) }
    else { setAns(data.answer); setRest(data.remaining); setSrc(data.sources ?? []); setSug(data.sugerencias ?? ''); loadHist() }
    setBusy(false) }
  return <><h1>Asistente agrícola</h1>
    <p className="note">Es una orientación, no un diagnóstico. No mide humedad, clima ni nutrientes: solo usa lo que tú le cuentas y registraste. Para decisiones de alto impacto, consulta a un agrónomo.</p>
    <details className="fold" style={{ marginTop: 14 }} open={abierto === 'guiada'} onToggle={ev => ev.currentTarget.open ? setAbierto('guiada') : setAbierto(a => a === 'guiada' ? null : a)}><summary>Consulta guiada</summary><section className="panel">
      <label htmlFor="al">Lote (opcional)</label><select id="al" value={plotId} onChange={e => setPlotId(e.target.value)}><option value="">Consulta general, sin lote</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select>
      <p className="lab">¿Qué necesitas?</p><div className="chips">{TIPOS.map(t => <button type="button" key={t} className={tipo === t ? 'chip on' : 'chip'} aria-pressed={tipo === t} onClick={() => setTipo(t)}>{t}</button>)}</div>
      <label htmlFor="ad">Describe lo que observas</label><textarea id="ad" rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ej.: manchas amarillas en las hojas bajas del tomate" />
      <div className="two"><div><label htmlFor="as">¿Desde cuándo?</label><input id="as" value={desde} onChange={e => setDesde(e.target.value)} /></div><div><label htmlFor="ac">Riego y condiciones recientes</label><input id="ac" value={cond} onChange={e => setCond(e.target.value)} /></div></div>
      <p className="lab">Fotos (hasta 3)</p>
      {imgs.length > 0 && <div className="thumbs">{imgs.map((im, i) => <div className="thumb" key={i}><img src={im.url} alt={`Foto ${i + 1}`} /><button type="button" aria-label="Quitar foto" onClick={() => setImgs(imgs.filter((_, j) => j !== i))}>×</button></div>)}</div>}
      <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => addFiles(e.target.files)} />
      <button type="button" disabled={imgs.length >= 3} onClick={() => file.current?.click()}>Agregar fotos</button>
      {tipo === 'Diagnóstico por fotos' && imgs.length === 0 && <p className="hint muted">Con al menos una foto clara de la hoja, el tallo o el fruto, la orientación mejora.</p>}
      <button className="primary" disabled={desc.trim().length < 5 || busy} onClick={ask}>{busy ? 'Analizando…' : 'Consultar'}</button>
      {err && <p role="alert" className="hint err">{err}</p>}{rest !== null && !err && <p className="hint muted">Te quedan {rest} consultas hoy.</p>}</section></details>
    <details className="fold" open={abierto === 'buscar'} onToggle={ev => ev.currentTarget.open ? setAbierto('buscar') : setAbierto(a => a === 'buscar' ? null : a)}><summary>Buscar con IA</summary><section className="panel"><label htmlFor="al2">Lote (opcional)</label><select id="al2" value={plotId} onChange={e => setPlotId(e.target.value)}><option value="">Sin lote</option>{plots.map(p => <option key={p.id} value={p.id}>{p.name} · {p.crop}</option>)}</select>
      <label htmlFor="aq">Tu pregunta</label><textarea id="aq" rows={3} value={q} onChange={e => setQ(e.target.value)} placeholder="Ej.: ¿cuándo conviene podar el aguacate Hass en clima templado?" />
      <p className="hint muted">Busca en internet y responde citando fuentes. No incluyas datos personales.</p>
      <button className="primary" disabled={q.trim().length < 5 || busy} onClick={ask}>{busy ? 'Buscando…' : 'Buscar con IA'}</button>
      {err && <p role="alert" className="hint err">{err}</p>}{rest !== null && !err && <p className="hint muted">Te quedan {rest} consultas hoy.</p>}</section></details>
    {ans && <Texto t={ans} />}
    {src.some(x => /^https?:\/\//.test(x.url)) && <><h2>Fuentes</h2><ul className="list">{src.filter(x => /^https?:\/\//.test(x.url)).map(x => <li key={x.url}><a href={x.url} target="_blank" rel="noopener noreferrer">{x.title}</a><br /><span className="muted">{host(x.url)}</span></li>)}</ul></>}
    {sug && <iframe className="sug" title="Sugerencias de búsqueda de Google" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={sug} />}
    {hist.length > 0 && <details className="fold"><summary>Consultas anteriores<span className="count">{hist.length}</span></summary>
      {hist.map(h => <details key={h.id} className="mini"><summary>{new Date(h.created_at).toLocaleDateString('es-CO')} · {h.question.split('\n')[0].replace('Tipo de consulta: ', '')}</summary><Texto t={h.answer ?? ''} /></details>)}</details>}</>
}
