# AgroInteligente

Aplicación React y Vite con Supabase para gestionar fincas.

## Desarrollo local

1. Instala Node.js 18 o superior.
2. Ejecuta `npm ci`.
3. Copia `.env.example` como `.env` y configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` con la URL del proyecto y su clave pública (publishable o anon).
4. Ejecuta `supabase/migrations/0001_core.sql` en el SQL Editor del proyecto Supabase.
5. Ejecuta `npm run dev` y abre la URL local que muestra Vite.

No uses claves `service_role` o `secret` en el frontend. El archivo `.env` está excluido de Git.

## Despliegue en Vercel

1. Importa `https://github.com/J22U/agrointeligente` en Vercel. Vercel detecta Vite automáticamente.
2. Usa `npm run build` como comando de compilación y `dist` como directorio de salida.
3. En las variables de entorno del proyecto Vercel, configura `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para Production, Preview y Development. Después de guardarlas, vuelve a desplegar.
4. En Supabase → Authentication → URL Configuration, establece la URL de producción de Vercel como Site URL y añade `https://<dominio-de-vercel>/**` a Redirect URLs. Conserva también `http://localhost:5173/**` para desarrollo local.

## Comandos

- `npm test`: pruebas.
- `npm run build`: comprobación TypeScript y compilación de producción.

La función de IA es independiente del frontend: requiere desplegar `supabase/functions/ai-consult` y configurar sus secretos en Supabase.
