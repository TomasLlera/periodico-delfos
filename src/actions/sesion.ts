'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Entrar y salir del admin.
 *
 * Hay **dos formas de entrar** y no una sola como decía el blueprint § 9:
 *
 * - **Magic link**, que es lo que el blueprint pide y lo que conviene para un
 *   usuario que entra desde el celular: nada que recordar.
 * - **Contraseña**, que es el respaldo. El magic link depende de que el
 *   proyecto tenga SMTP configurado; con el servicio de mail que trae Supabase
 *   de fábrica los envíos están limitados y pueden no llegar. Si el admin
 *   dependiera sólo del mail, un problema de entrega dejaría el panel
 *   inaccesible y no habría forma de publicar.
 *
 * Las dos terminan en la misma sesión y en las mismas políticas de RLS.
 */

export interface EstadoSesion {
  error?: string
  aviso?: string
}

/** A dónde volver después de entrar. Sólo rutas internas del admin. */
function destino(formData: FormData): string {
  const volver = String(formData.get('volver') ?? '')

  // Una URL absoluta acá sería un open redirect: el atacante manda el link de
  // login con `?volver=https://otro-sitio` y el usuario termina ahí ya logueado.
  return volver.startsWith('/admin') ? volver : '/admin'
}

export async function entrarConContrasena(
  _previo: EstadoSesion,
  formData: FormData,
): Promise<EstadoSesion> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Faltan el mail o la contraseña' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  // El mensaje es a propósito el mismo para "no existe" y para "contraseña
  // equivocada": decir cuál de las dos falló le confirma a cualquiera qué mails
  // tienen cuenta.
  if (error) return { error: 'No pudimos entrar con esos datos' }

  redirect(destino(formData))
}

export async function enviarMagicLink(
  _previo: EstadoSesion,
  formData: FormData,
): Promise<EstadoSesion> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Falta el mail' }

  const supabase = await createClient()
  const sitio = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // Esta URL tiene que estar en Authentication → URL Configuration →
      // Redirect URLs del proyecto, o Supabase manda el link al sitio pero
      // rebota al volver.
      emailRedirectTo: `${sitio}/auth/callback?volver=${encodeURIComponent(destino(formData))}`,
      // Que no cree un usuario nuevo: el admin es de quien ya tiene fila en
      // `autores`, y cualquier otro mail que entre acá es alguien probando.
      shouldCreateUser: false,
    },
  })

  if (error) return { error: 'No pudimos mandar el link. Probá con la contraseña.' }

  return { aviso: 'Te mandamos un link por mail. Vale por una hora.' }
}

export async function salir(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}
