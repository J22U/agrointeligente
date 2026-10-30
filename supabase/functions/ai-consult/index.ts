import { createClient } from 'npm:@supabase/supabase-js@2'
const SYSTEM = `Eres un asistente agrícola para productores de Latinoamérica. Responde en español claro, con estas secciones en este orden: Observaciones, Causas posibles, Preguntas pendientes, Medidas inmediatas de bajo riesgo, Cuándo buscar ayuda profesional.
Reglas: separa lo que se observa, las hipótesis y las recomendaciones. Nunca presentes un diagnóstico visual como certeza; indica tu nivel de incertidumbre y advierte cuando una foto no permita distinguir entre enfermedad, plaga, deficiencia nutricional o estrés ambiental. No inventes clima, análisis de suelo, mediciones, productos, dosis ni autorizaciones de uso. No recomiendes agroquímicos específicos ni dosis; prioriza medidas culturales y preventivas y remite a etiqueta, registro y normativa local. Para decisiones de alto impacto económico o fitosanitario, recomienda validar con un agrónomo. Los datos del lote y del diario los registró el usuario; no son mediciones de sensores.`
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info' }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const manejar = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const key = Deno.env.get('AI_API_KEY')
  const provider = Deno.env.get('AI_PROVIDER') ?? (key?.startsWith('AIza') ? 'gemini' : 'anthropic')
  const model = Deno.env.get('AI_MODEL') ?? (provider === 'gemini' ? 'gemini-flash-latest' : 'claude-haiku-5-5')
  const url = Deno.env.get('AI_BASE_URL') ?? (provider === 'gemini' ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` : 'https://api.anthropic.com/v1/messages')
  if (!key || !model) return json({ error: 'La IA no está configurada en el servidor todavía.' }, 503)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } })
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return json({ error: 'No autenticado.' }, 401)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const body = await req.json().catch(() => ({}))
  const { question, plot_id } = body; const web = body.web === true; const images = Array.isArray(body.images) ? body.images : []
  if (typeof question !== 'string' || question.length < 5 || question.length > 4000) return json({ error: 'La consulta debe tener entre 5 y 4000 caracteres.' }, 400)
  if (images.length > 3) return json({ error: 'Máximo 3 fotos por consulta.' }, 400)
  for (const i of images) if (!OK_TYPES.includes(i?.media_type) || typeof i?.data !== 'string' || i.data.length > 2_000_000 || !/^[A-Za-z0-9+/=]+$/.test(i.data)) return json({ error: 'Una de las fotos no es válida (usa JPG, PNG o WebP).' }, 400)
  const { data: prof } = await sb.from('profiles').select('plan').eq('id', user.id).single()
  const { data: lim } = await sb.from('plan_limits').select('ai_queries_per_day').eq('plan', prof?.plan ?? 'free').single()
  const max = lim?.ai_queries_per_day ?? 3
  const { count } = await admin.from('ai_queries').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', new Date(Date.now() - 864e5).toISOString())
  if ((count ?? 0) >= max) return json({ error: 'Alcanzaste el límite diario de consultas de tu plan.' }, 429)
  let ctx = ''
  if (typeof plot_id === 'string' && plot_id) {
    const { data: p } = await sb.from('plots').select('name,crop,variety,planted_on,stage').eq('id', plot_id).maybeSingle()
    if (p) { const { data: logs } = await sb.from('farm_logs').select('category,logged_on,description,details').eq('plot_id', plot_id).order('logged_on', { ascending: false }).limit(8)
      ctx = `Datos del lote registrados por el usuario: ${JSON.stringify(p)}\nÚltimos registros del diario: ${JSON.stringify(logs ?? [])}\n\n` }
  }
  const { data: row, error: e1 } = await admin.from('ai_queries').insert({ user_id: user.id, plot_id: ctx ? plot_id : null, question }).select('id').single()
  if (e1 || !row) return json({ error: 'No se pudo registrar la consulta.' }, 500)
  const sistema = web ? SYSTEM + '\n\nPuedes buscar en internet. Cita las fuentes en el texto, prefiere universidades, servicios de extensión, institutos agropecuarios y organismos oficiales, y no copies dosis de productos de páginas web: remite a la etiqueta y a la normativa local.' : SYSTEM
  const texto = ctx + 'Consulta del usuario:\n' + question
  try {
    let answer = ''; let sources: { title: string; url: string }[] = []; let sugerencias = ''
    if (provider === 'gemini') {
      const r = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(55000), headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: sistema }] }, contents: [{ role: 'user', parts: [...images.map((i: { media_type: string; data: string }) => ({ inline_data: { mime_type: i.media_type, data: i.data } })), { text: texto }] }], generationConfig: { maxOutputTokens: 2000 }, tools: web ? [{ google_search: {} }] : undefined }) })
      if (!r.ok) throw new Error('proveedor ' + r.status)
      const d = await r.json(); answer = (d.candidates?.[0]?.content?.parts ?? []).map((c: { text?: string }) => c.text ?? '').join('').trim()
      const g = d.candidates?.[0]?.groundingMetadata
      for (const c of g?.groundingChunks ?? []) if (c.web?.uri) sources.push({ title: c.web.title ?? c.web.uri, url: c.web.uri })
      sugerencias = g?.searchEntryPoint?.renderedContent ?? ''
    } else {
      const content = [...images.map((i: { media_type: string; data: string }) => ({ type: 'image', source: { type: 'base64', media_type: i.media_type, data: i.data } })), { type: 'text', text: texto }]
      const r = await fetch(url, { method: 'POST', signal: AbortSignal.timeout(55000), headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ model, max_tokens: web ? 2500 : 1500, system: sistema, messages: [{ role: 'user', content }], tools: web ? [{ type: 'web_search_20250305', name: 'web_search', max_uses: 3 }] : undefined }) })
      if (!r.ok) throw new Error('proveedor ' + r.status)
      const d = await r.json(); answer = (d.content ?? []).map((c: { text?: string }) => c.text ?? '').join('').trim()
      for (const b of d.content ?? []) if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) for (const x of b.content) if (x.url) sources.push({ title: x.title ?? x.url, url: x.url })
    }
    sources = sources.filter((x, i, a) => a.findIndex(y => y.url === x.url) === i).slice(0, 8)
    if (!answer) throw new Error('vacía')
    await admin.from('ai_queries').update({ answer }).eq('id', row.id)
    return json({ answer, remaining: Math.max(0, max - (count ?? 0) - 1), sources, sugerencias })
  } catch (_) {
    await admin.from('ai_queries').delete().eq('id', row.id)
    return json({ error: 'El proveedor de IA no respondió. Esta consulta no se descontó; inténtalo de nuevo.' }, 502)
  }
}
Deno.serve(async (req) => { try { return await manejar(req) } catch (e) { console.error('ai-consult', e); return json({ error: 'Error interno de la función. Revisa los registros en Supabase.' }, 500) } })
