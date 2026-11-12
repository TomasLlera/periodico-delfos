'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { urlDelSitio } from '@/lib/sitio'

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

/**
 * **Entrar con contraseña ya no vive acá: lo hace `POST /api/auth/login`.**
 *
 * Era un Server Action, y un Server Action responde 200 tanto si entrás como
 * si no, con el error adentro del cuerpo. Desde la pestaña Network, desde
 * Postman o desde un test, un login fallido y uno exitoso eran la misma
 * respuesta. La ruta devuelve 400, 401, 429 o 503 según el caso, que es lo que
 * permite afirmar sobre el protocolo y no sobre el texto de la pantalla.
 *
 * El mensaje sigue siendo el mismo para "no existe" y para "contraseña
 * equivocada" —ahora en `ERRORES.credencialesInvalidas()`—, por la misma razón
 * de siempre: decir cuál de las dos falló le confirma a cualquiera qué mails
 * tienen cuenta.
 *
 * **El magic link se queda**, abajo: manda un mail y contesta que lo mandó. No
 * tiene un código de estado interesante que mostrar, y moverlo sería agregar
 * una ruta para nada.
 */

export async function enviarMagicLink(
  _previo: EstadoSesion,
  formData: FormData,
): Promise<EstadoSesion> {
  const email = String(formData.get('email') ?? '').trim()
  if (!email) return { error: 'Falta el mail' }

  const supabase = await createClient()
  const sitio = urlDelSitio()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // A `/auth/confirm`, que canjea `token_hash` del lado del servidor. Ver
      // el comentario de esa ruta: el template de mail hay que cambiarlo, y
      // esta URL tiene que estar en Authentication → URL Configuration →
      // Redirect URLs, o Supabase la ignora y manda al Site URL pelado.
      emailRedirectTo: `${sitio}/auth/confirm?volver=${encodeURIComponent(destino(formData))}`,
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
