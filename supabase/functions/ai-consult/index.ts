import { createClient } from 'npm:@supabase/supabase-js@2'
const SYSTEM = `Eres un asistente agrícola. Separa síntomas observados, hipótesis y recomendaciones. Nunca des un diagnóstico visual como certeza; indica incertidumbre y pide datos faltantes. No inventes clima, análisis, productos ni dosis. Prioriza medidas culturales de bajo riesgo y recomienda validar con un agrónomo las decisiones de alto impacto. Responde en español con secciones: Observaciones, Causas posibles, Preguntas pendientes, Medidas inmediatas de bajo riesgo, Cuándo buscar ayuda profesional.`
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const key = Deno.env.get('AI_API_KEY'), url = Deno.env.get('AI_BASE_URL'), model = Deno.env.get('AI_MODEL')
  if (!key || !url || !model) return json({ error: 'La IA no está configurada en el servidor.' }, 503)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return json({ error: 'No autenticado.' }, 401)
  const { question, plot_id } = await req.json().catch(() => ({}))
  if (typeof question !== 'string' || question.length < 5 || question.length > 4000) return json({ error: 'Pregunta inválida (5 a 4000 caracteres).' }, 400)
  const { data: prof } = await sb.from('profiles').select('plan').eq('id', user.id).single()
  const { data: lim } = await sb.from('plan_limits').select('ai_queries_per_day').eq('plan', prof?.plan ?? 'free').single()
  const since = new Date(Date.now() - 864e5).toISOString()
  const { count } = await sb.from('ai_queries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since)
  if ((count ?? 0) >= (lim?.ai_queries_per_day ?? 3)) return json({ error: 'Alcanzaste el límite diario de consultas de tu plan.' }, 429)
  let ctx = ''
  if (plot_id) { const { data: p } = await sb.from('plots').select('name,crop,variety,planted_on,stage').eq('id', plot_id).maybeSingle(); if (p) ctx = `Lote (datos del usuario): ${JSON.stringify(p)}\n` }
  const r = await fetch(url, { method: 'POST', headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: 1200, system: SYSTEM, messages: [{ role: 'user', content: ctx + question }] }) })
  if (!r.ok) return json({ error: 'El proveedor de IA devolvió un error.' }, 502)
  const d = await r.json(); const answer = d.content?.map((c: { text?: string }) => c.text ?? '').join('') ?? ''
  await sb.from('ai_queries').insert({ user_id: user.id, plot_id: plot_id ?? null, question, answer })
  return json({ answer })
})
