import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured } from './lib/supabase'
type Farm = { id: string; name: string; municipality: string | null; area_ha: number | null }
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [msg, setMsg] = useState('')
  const [farms, setFarms] = useState<Farm[]>([]); const [name, setName] = useState('')
  const [q, setQ] = useState(''); const [answer, setAnswer] = useState('')
  useEffect(() => { if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe() }, [])
  const load = async () => { const { data, error } = await supabase!.from('farms').select('id,name,municipality,area_ha').order('created_at'); if (error) setMsg(error.message); else setFarms(data as Farm[]) }
  useEffect(() => { if (session) load() }, [session])
  if (!configured) return <main><h1>AgroInteligente</h1><p className="err">Falta configurar Supabase. Copia .env.example a .env y completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</p></main>
  if (!session) return <main><h1>AgroInteligente</h1>
    <label>Correo<input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
    <label>Contraseña<input type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
    <button onClick={async () => { const { error } = await supabase!.auth.signInWithPassword({ email, password: pw }); setMsg(error ? 'Correo o contraseña incorrectos.' : '') }}>Iniciar sesión</button>
    <button onClick={async () => { const { error } = await supabase!.auth.signUp({ email, password: pw }); setMsg(error ? error.message : 'Revisa tu correo para confirmar la cuenta.') }}>Crear cuenta</button>
    <button onClick={async () => { const { error } = await supabase!.auth.resetPasswordForEmail(email); setMsg(error ? error.message : 'Te enviamos un enlace de recuperación.') }}>Olvidé mi contraseña</button>
    <p role="status">{msg}</p></main>
  return <main><h1>Mis fincas</h1><button onClick={() => supabase!.auth.signOut()}>Cerrar sesión</button>
    {farms.length === 0 ? <p className="muted">Aún no tienes fincas. Crea la primera abajo.</p> : <ul>{farms.map(f => <li key={f.id}><b>{f.name}</b> <span className="muted">{f.municipality ?? ''} {f.area_ha ? `· ${f.area_ha} ha` : ''}</span>
      <button onClick={async () => { if (confirm(`¿Eliminar ${f.name} y todos sus lotes?`)) { await supabase!.from('farms').delete().eq('id', f.id); load() } }}>Eliminar</button></li>)}</ul>}
    <input placeholder="Nombre de la finca" value={name} onChange={e => setName(e.target.value)} />
    <button disabled={!name.trim()} onClick={async () => { const { error } = await supabase!.from('farms').insert({ name: name.trim() }); setMsg(error ? error.message : ''); setName(''); load() }}>Crear finca</button>
    <h2>Asistente agrícola</h2>
    <textarea rows={4} placeholder="Describe el cultivo y el síntoma" value={q} onChange={e => setQ(e.target.value)} />
    <button disabled={q.length < 5} onClick={async () => { setAnswer('Consultando…'); const { data, error } = await supabase!.functions.invoke('ai-consult', { body: { question: q } }); setAnswer(error ? 'No se pudo consultar: la IA puede no estar configurada o llegaste al límite del plan.' : data.answer) }}>Consultar</button>
    <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p><p role="status" className="err">{msg}</p></main>
}
