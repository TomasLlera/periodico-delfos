import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Protege `/admin/*` y refresca la sesión de Supabase en cada request.
 *
 * **Sólo corre en `/admin`** (ver `config` abajo). Un middleware que matchea
 * todo el sitio obliga a Next a tratar cada ruta como dinámica y se lleva
 * puesto el ISR de la portada y el prerender de las notas, que es justo lo que
 * hace rápido al sitio público. Acá no hace falta: el visitante anónimo nunca
 * pasa por el admin.
 *
 * **No es la línea de defensa.** Lo dice el blueprint § 9 y conviene repetirlo:
 * la defensa real es RLS. Aunque alguien se saltee esto —la anon key está en el
 * bundle por diseño—, `es_autor()` le impide escribir nada y leer borradores.
 * El middleware está para que Charlie vea la pantalla de login en vez de un
 * panel vacío, no para cuidar los datos.
 *
 * El layout del admin **vuelve a chequear** en el servidor, y además exige fila
 * en `autores`: tener sesión de Supabase Auth no es lo mismo que ser el autor.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value)
          }
          // La respuesta se rearma con las cookies ya puestas en el request:
          // es el patrón de `@supabase/ssr` para que el token refrescado viaje
          // al navegador y al Server Component en el mismo request.
          response = NextResponse.next({ request })
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options)
          }
        },
      },
    },
  )

  // `getUser()` y no `getSession()`: el segundo lee la cookie sin validarla
  // contra el servidor de Auth, así que una cookie fabricada a mano pasaría.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const login = request.nextUrl.clone()
    login.pathname = '/admin/login'
    // De dónde venía, para devolverlo ahí después de entrar.
    login.searchParams.set('volver', request.nextUrl.pathname)
    return NextResponse.redirect(login)
  }

  return response
}

export const config = {
  matcher: ['/admin/:path*'],
}
