# AgroInteligente (núcleo)
1. `npm install` · 2. copia `.env.example` a `.env` y completa URL y anon key de Supabase · 3. aplica `supabase/migrations/0001_core.sql` (SQL Editor o `supabase db push`) · 4. `npm run dev`.
IA: `supabase functions deploy ai-consult` y `supabase secrets set AI_API_KEY=… AI_BASE_URL=… AI_MODEL=…`. Sin esas variables responde 503 "IA no configurada".
Pruebas: `npm test`. Producción: `npm run build`.
Pendiente: lotes/diario/costos/tareas en UI, fotos (Storage), clima, PWA, offline, pagos.
