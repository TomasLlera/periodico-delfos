import { NextResponse, type NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

/**
 * Donde aterriza el magic link, de verdad.
 *
 * `/auth/callback` sirve para el flujo PKCE, que llega con `?code=`. Pero el
 * template de mail que Supabase trae de fábrica usa `{{ .ConfirmationURL }}`,
 * que pasa por el endpoint de verificación de Supabase y **vuelve con los
 * tokens en el fragmento** (`#access_token=…`). El fragmento no viaja al
 * servidor: se queda en el navegador. Para una app con render en servidor eso
 * es inservible, y el síntoma es aterrizar en la home con un
 * `#error=access_denied&error_code=otp_expired` que parece un problema de
 * expiración y no lo es.
 *
 * Esta ruta usa el otro camino, el que Supabase documenta para SSR: el mail
 * trae `token_hash` y `type` como query params, y acá se canjean por sesión con
 * `verifyOtp()`. Todo del lado del servidor, con las cookies puestas en la
 * respuesta.
 *
 * **Hay que cambiar el template del mail** en Authentication → Email Templates
 * → Magic Link, y poner:
 *
 *     {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email
 *
 * Y agregar `http://localhost:3000/**` (y la URL de producción) en
 * Authentication → URL Configuration → Redirect URLs. Sin eso, Supabase ignora
 * el `emailRedirectTo` y manda al Site URL pelado.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const tokenHash = searchParams.get('token_hash')
  const tipo = searchParams.get('type') as EmailOtpType | null
  const volver = searchParams.get('volver') ?? ''

  // Igual que en el resto del flujo: sólo rutas internas del admin. Una URL
  // absoluta acá convertiría el link del mail en un redirect abierto.
  const destino = volver.startsWith('/admin') ? volver : '/admin'

  if (tokenHash && tipo) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash })
    if (!error) return NextResponse.redirect(`${origin}${destino}`)
  }

  return NextResponse.redirect(`${origin}/admin/login?error=link`)
}
