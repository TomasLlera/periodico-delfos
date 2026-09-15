import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

/**
 * Cliente para el código que corre **fuera de un request**:
 * `generateStaticParams`, `sitemap.ts`, `rss.xml`.
 *
 * No puede ser `createClient()`: ahí arriba se piden las cookies, y en build no
 * hay request del cual sacarlas — Next corta con *"`cookies` was called outside
 * a request scope"*. No es un problema de credenciales: pasa igual con el
 * proyecto de Supabase andando.
 *
 * Al no tener sesión, ve exactamente lo que ve un visitante anónimo. Para
 * decidir qué páginas prerenderizar eso es lo correcto y no una limitación:
 * una nota en borrador no debe generar una página. RLS sigue aplicando.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

/**
 * `false` mientras no exista el proyecto de Supabase.
 *
 * El build no puede depender de que haya una base alcanzable: hoy no la hay
 * (ver `HANDOFF.md`) y en CI tampoco la habría. Las rutas que se prerenderizan
 * desde la base preguntan esto **antes** de consultar nada; si no hay proyecto,
 * no prerenderizan ninguna página y cada una se sirve a demanda. El día que
 * existan las variables, el build vuelve a generarlas sin tocar una línea.
 */
export function haySupabase(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
