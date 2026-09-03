import { createClient } from '@supabase/supabase-js'

/**
 * Cliente con service role. BYPASSEA RLS.
 *
 * Sólo para procesos de servidor sin usuario: las funciones de Inngest que
 * escriben `social_posts` y el script de migración desde WordPress.
 * Nunca importar desde un componente ni desde código que llegue al cliente.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está definida')
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
