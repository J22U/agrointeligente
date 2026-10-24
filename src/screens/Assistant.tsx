import { useState } from 'react'
import { supabase } from '../lib/supabase'
export default function Assistant() {
  const [q, setQ] = useState(''); const [a, setA] = useState(''); const [busy, setBusy] = useState(false)
  const ask = async () => { setBusy(true); setA(''); const { data, error } = await supabase!.functions.invoke('ai-consult', { body: { question: q } })
    setA(error ? 'No se pudo consultar. La IA aún no está configurada en el servidor o llegaste al límite diario de tu plan.' : data.answer); setBusy(false) }
  return <><h1>Asistente agrícola</h1>
    <p className="note">Es una orientación, no un diagnóstico. Para decisiones de alto impacto, consulta a un agrónomo.</p>
    <label htmlFor="q">Describe el cultivo y lo que observas</label><textarea id="q" rows={5} value={q} onChange={e => setQ(e.target.value)} />
    <button className="primary" disabled={q.trim().length < 5 || busy} onClick={ask}>{busy ? 'Consultando…' : 'Consultar'}</button>
    {a && <div className="answer" role="status">{a}</div>}</>
}
