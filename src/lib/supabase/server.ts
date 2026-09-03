import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente para Server Components, Server Actions y Route Handlers.
 * Respeta la sesión del usuario y por lo tanto sus políticas RLS.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options)
            }
          } catch {
            // Llamado desde un Server Component: el middleware ya refresca la
            // sesión, así que ignorar es correcto acá.
          }
        },
      },
    },
  )
}
