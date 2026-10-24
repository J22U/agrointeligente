import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const MONEDAS = ['COP', 'MXN', 'USD', 'PEN', 'ARS', 'CLP', 'BRL', 'EUR']
const PLANES: Record<string, string> = { free: 'Plan gratuito', premium: 'Plan premium' }
export default function Profile({ userId, email }: { userId: string; email: string }) {
  const [name, setName] = useState(''); const [cur, setCur] = useState('COP'); const [plan, setPlan] = useState('free'); const [ready, setReady] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [pmsg, setPmsg] = useState<{ ok: boolean; t: string } | null>(null)
  useEffect(() => { supabase!.from('profiles').select('full_name,currency,plan').maybeSingle().then(({ data, error }) => {
    if (error) setMsg({ ok: false, t: 'No se pudo cargar tu perfil.' }); else if (data) { setName(data.full_name ?? ''); setCur(data.currency); setPlan(data.plan) }; setReady(true) }) }, [])
  const save = async (e: React.FormEvent) => { e.preventDefault()
    const { error } = await supabase!.from('profiles').upsert({ id: userId, full_name: name.trim() || null, currency: cur })
    setMsg(error ? { ok: false, t: 'No se pudo guardar. Inténtalo de nuevo.' } : { ok: true, t: 'Cambios guardados.' }) }
  const pwValid = pw.length >= 6 && pw === pw2
  const changePw = async (e: React.FormEvent) => { e.preventDefault(); if (!pwValid) return
    const { error } = await supabase!.auth.updateUser({ password: pw })
    if (error) setPmsg({ ok: false, t: 'No se pudo cambiar la contraseña. Inténtalo de nuevo.' }); else { setPmsg({ ok: true, t: 'Contraseña actualizada.' }); setPw(''); setPw2('') } }
  if (!ready) return <><h1>Mi perfil</h1><p className="muted">Cargando…</p></>
  return <><h1>Mi perfil</h1>
    <form onSubmit={save} className="form">
      <label htmlFor="pe">Correo</label><input id="pe" value={email} readOnly />
      <label htmlFor="pn">Nombre</label><input id="pn" value={name} maxLength={80} onChange={e => setName(e.target.value)} />
      <label htmlFor="pm">Moneda</label><select id="pm" value={cur} onChange={e => setCur(e.target.value)}>{MONEDAS.map(m => <option key={m}>{m}</option>)}</select>
      <p className="note">{PLANES[plan] ?? plan}</p>
      <button className="primary">Guardar cambios</button>{msg && <p role="status" className={msg.ok ? 'hint ok' : 'hint err'}>{msg.t}</p>}</form>
    <form onSubmit={changePw} className="form"><h2>Cambiar contraseña</h2>
      <label htmlFor="n1">Nueva contraseña</label><input id="n1" type="password" autoComplete="new-password" value={pw} onChange={e => setPw(e.target.value)} /><p className="hint">Mínimo 6 caracteres.</p>
      <label htmlFor="n2">Repite la contraseña</label><input id="n2" type="password" autoComplete="new-password" value={pw2} onChange={e => setPw2(e.target.value)} />
      {pw2 !== '' && pw !== pw2 && <p className="hint err">Las contraseñas no coinciden.</p>}
      <button className="primary" disabled={!pwValid}>Cambiar contraseña</button>{pmsg && <p role="status" className={pmsg.ok ? 'hint ok' : 'hint err'}>{pmsg.t}</p>}</form>
    <h2>Sesión</h2><button className="danger" onClick={() => supabase!.auth.signOut()}>Cerrar sesión</button></>
}
