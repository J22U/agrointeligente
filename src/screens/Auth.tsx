import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Hills, Logo } from '../components/Art'
type Mode = 'in' | 'up' | 'reset'
const traducir = (m: string) => /Invalid login/i.test(m) ? 'Correo o contraseña incorrectos.' : /already registered/i.test(m) ? 'Ya existe una cuenta con ese correo.' : /not confirmed/i.test(m) ? 'Confirma tu correo antes de entrar.' : /rate limit/i.test(m) ? 'Demasiados intentos. Espera unos minutos.' : 'No se pudo completar. Inténtalo de nuevo.'
export default function Auth() {
  const [mode, setMode] = useState<Mode>('in'); const [email, setEmail] = useState(''); const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [busy, setBusy] = useState(false)
  const emailOk = /^\S+@\S+\.\S+$/.test(email); const valid = emailOk && (mode === 'reset' || pw.length >= 6)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!valid) return; setBusy(true); setMsg(null)
    const a = supabase!.auth
    if (mode === 'in') { const { error } = await a.signInWithPassword({ email, password: pw }); if (error) setMsg({ ok: false, t: traducir(error.message) }) }
    else if (mode === 'up') { const { error } = await a.signUp({ email, password: pw }); setMsg(error ? { ok: false, t: traducir(error.message) } : { ok: true, t: 'Cuenta creada. Revisa tu correo para confirmarla.' }) }
    else { const { error } = await a.resetPasswordForEmail(email); setMsg(error ? { ok: false, t: traducir(error.message) } : { ok: true, t: 'Si el correo existe, te enviamos un enlace para recuperar la contraseña.' }) }
    setBusy(false)
  }
  const title = { in: 'Entrar a tu cuenta', up: 'Crear cuenta', reset: 'Recuperar contraseña' }[mode]
  return <div className="auth">
    <aside className="auth-brand"><div className="brand-text"><Logo size={44} /><h1>AgroInteligente</h1><p>Tus fincas, lotes y labores en un solo lugar, con un asistente que te orienta sin reemplazar al agrónomo.</p></div><Hills className="brand-art" /></aside>
    <main className="auth-form"><form onSubmit={submit} noValidate>
      <h2>{title}</h2>
      <label htmlFor="e">Correo</label><input id="e" type="email" autoComplete="email" value={email} onChange={x => setEmail(x.target.value)} aria-invalid={email !== '' && !emailOk} />
      {email !== '' && !emailOk && <p className="hint err">Escribe un correo válido.</p>}
      {mode !== 'reset' && <><label htmlFor="p">Contraseña</label><input id="p" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={pw} onChange={x => setPw(x.target.value)} />
        {mode === 'up' && <p className="hint">Mínimo 6 caracteres.</p>}</>}
      <button className="primary" disabled={!valid || busy}>{busy ? 'Un momento…' : mode === 'in' ? 'Entrar' : mode === 'up' ? 'Crear cuenta' : 'Enviar enlace'}</button>
      {msg && <p role="status" className={msg.ok ? 'hint ok' : 'hint err'}>{msg.t}</p>}
      <div className="links">
        {mode !== 'in' && <button type="button" className="link" onClick={() => { setMode('in'); setMsg(null) }}>Ya tengo cuenta</button>}
        {mode !== 'up' && <button type="button" className="link" onClick={() => { setMode('up'); setMsg(null) }}>Crear cuenta</button>}
        {mode === 'in' && <button type="button" className="link" onClick={() => { setMode('reset'); setMsg(null) }}>Olvidé mi contraseña</button>}
      </div>
    </form></main></div>
}
