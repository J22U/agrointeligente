import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured } from './lib/supabase'
import { Logo } from './components/Art'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import Farms from './screens/Farms'
import Assistant from './screens/Assistant'
export type View = 'panel' | 'fincas' | 'asistente'
const NAV: { id: View; label: string }[] = [{ id: 'panel', label: 'Panel' }, { id: 'fincas', label: 'Fincas' }, { id: 'asistente', label: 'Asistente' }]
const SOON = ['Lotes', 'Diario', 'Costos']
export default function App() {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false); const [view, setView] = useState<View>('panel')
  useEffect(() => { if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe() }, [])
  if (!configured) return <main className="plain"><h1>AgroInteligente</h1><p className="err">Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</p></main>
  if (!ready) return <main className="plain"><p className="muted">Cargando…</p></main>
  if (!session) return <Auth />
  return <div className="shell">
    <nav className="nav" aria-label="Principal"><div className="logo"><Logo size={30} />AgroInteligente</div>
      {NAV.map(n => <button key={n.id} className={view === n.id ? 'navbtn on' : 'navbtn'} aria-current={view === n.id ? 'page' : undefined} onClick={() => setView(n.id)}>{n.label}</button>)}
      {SOON.map(s => <button key={s} className="navbtn soon" disabled title="Próximamente">{s}<small>Pronto</small></button>)}
      <div className="spacer" /><div className="who">{session.user.email}</div><button className="navbtn out" onClick={() => supabase!.auth.signOut()}>Cerrar sesión</button></nav>
    <main className="content">{view === 'panel' && <Dashboard go={setView} />}{view === 'fincas' && <Farms />}{view === 'asistente' && <Assistant />}</main></div>
}
