import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Donde aterriza el magic link.
 *
 * Supabase manda al mail un link a esta ruta con un `code` de un solo uso.
 * Cambiarlo por una sesión tiene que pasar en el servidor —el intercambio deja
 * las cookies de sesión en la respuesta— y por eso es un Route Handler y no una
 * página.
 *
 * La URL tiene que estar además en Authentication → URL Configuration →
 * Redirect URLs del proyecto. Si no está, Supabase manda el mail igual pero el
 * link rebota al volver, que es el síntoma más confuso de todo el flujo.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const volver = searchParams.get('volver') ?? ''

  // Igual que en las acciones de sesión: sólo rutas internas del admin. Una URL
  // absoluta acá convierte el link del mail en un redirect abierto.
  const destino = volver.startsWith('/admin') ? volver : '/admin'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${destino}`)
  }

  // Un link vencido, ya usado o adulterado cae acá. No se distingue cuál de los
  // tres: el mensaje es el mismo y la salida también, volver a pedirlo.
  return NextResponse.redirect(`${origin}/admin/login?error=link`)
}
