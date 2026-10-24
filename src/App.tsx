import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, configured } from './lib/supabase'
import { Logo } from './components/Art'
import Auth from './screens/Auth'
import Dashboard from './screens/Dashboard'
import Farms from './screens/Farms'
import Assistant from './screens/Assistant'
import Plots from './screens/Plots'
import Diary from './screens/Diary'
import Profile from './screens/Profile'
export type View = 'panel' | 'fincas' | 'lotes' | 'diario' | 'asistente' | 'perfil'
const NAV: { id: View; label: string }[] = [{ id: 'panel', label: 'Panel' }, { id: 'fincas', label: 'Fincas' }, { id: 'lotes', label: 'Lotes' }, { id: 'diario', label: 'Diario' }, { id: 'asistente', label: 'Asistente' }, { id: 'perfil', label: 'Perfil' }]
const SOON = ['Costos']
export default function App() {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false); const [view, setView] = useState<View>('panel')
  useEffect(() => { if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => {}).finally(() => setReady(true))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s)); return () => data.subscription.unsubscribe() }, [])
  if (!configured) return <main className="plain"><h1>AgroInteligente</h1><p className="err">Falta configurar Supabase (VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY).</p></main>
  if (!ready) return <main className="plain"><p className="muted">Cargando…</p></main>
  if (!session) return <Auth />
  return <div className="shell">
    <header className="topbar"><div className="tb-logo"><Logo size={26} />AgroInteligente</div><div className="tb-actions"><button className="tb-btn" onClick={() => setView('perfil')}>Perfil</button><button className="tb-btn" onClick={() => supabase!.auth.signOut()}>Salir</button></div></header>
    <nav className="nav" aria-label="Principal"><div className="logo"><Logo size={30} />AgroInteligente</div>
      {NAV.map(n => <button key={n.id} className={`navbtn${view === n.id ? ' on' : ''}${n.id === 'perfil' ? ' desk' : ''}`} aria-current={view === n.id ? 'page' : undefined} onClick={() => setView(n.id)}>{n.label}</button>)}
      {SOON.map(s => <button key={s} className="navbtn soon" disabled title="Próximamente">{s}<small>Pronto</small></button>)}
      <div className="spacer" /><div className="who">{session.user.email}</div><button className="navbtn out" onClick={() => supabase!.auth.signOut()}>Cerrar sesión</button></nav>
    <main className="content">{view === 'panel' && <Dashboard go={setView} />}{view === 'fincas' && <Farms />}{view === 'lotes' && <Plots go={setView} />}{view === 'diario' && <Diary go={setView} />}{view === 'asistente' && <Assistant />}{view === 'perfil' && <Profile userId={session.user.id} email={session.user.email ?? ''} />}</main></div>
}
