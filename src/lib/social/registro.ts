/**
 * `social_posts`: el registro de cada intento de posteo, y lo que hace
 * idempotente al fan-out.
 *
 * **Escribe con la service role y no con la sesión de nadie**, que es la única
 * excepción documentada del proyecto: estas funciones corren adentro de
 * Inngest, donde no hay usuario. La política de RLS sobre `social_posts` sólo
 * habilita lectura al autor; la escritura la hace este cliente, que bypassea
 * RLS a propósito (blueprint § 4.8).
 *
 * El `unique (nota_id, platform)` de `0007_social_posts.sql` es la pieza
 * central: cada operación de acá es un `upsert` contra esa clave, así que dos
 * corridas de la misma función no pueden crear dos filas ni postear dos veces.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { Red, SocialPost } from '@/types'

/** Los registros de una nota, para decidir qué falta postear. */
export async function registrosDeNota(notaId: string): Promise<SocialPost[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('social_posts').select('*').eq('nota_id', notaId)

  return (data ?? []) as SocialPost[]
}

/**
 * Marca una red como "en curso" **antes** de llamar a la API.
 *
 * Es el paso que evita el duplicado real: si se marcara después, dos corridas
 * simultáneas de la misma función leerían las dos `pending` y postearían las
 * dos. `attempts` se incrementa acá por lo mismo —el intento empezó, haya
 * salido o no—.
 *
 * Devuelve `false` si el upsert falló. El llamador **no tiene que postear** en
 * ese caso: sin registro no hay idempotencia, y postear a ciegas es justo lo
 * que este archivo existe para impedir.
 */
export async function marcarEnCurso(
  notaId: string,
  notaSlug: string,
  red: Red,
  intentosPrevios: number,
): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from('social_posts').upsert(
    {
      nota_id: notaId,
      nota_slug: notaSlug,
      platform: red,
      status: 'processing' as const,
      attempts: intentosPrevios + 1,
      error_message: null,
    },
    { onConflict: 'nota_id,platform' },
  )

  return !error
}

/** El posteo salió. Queda el id externo para poder encontrarlo después. */
export async function marcarExito(
  notaId: string,
  red: Red,
  datos: { externalPostId?: string; externalUrl?: string; simulado?: boolean },
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('social_posts')
    .update({
      status: 'success' as const,
      external_post_id: datos.externalPostId ?? null,
      external_url: datos.externalUrl ?? null,
      // Un posteo simulado se marca `success` igual —el pipeline funcionó— y
      // lo que lo delata es el mensaje. Sin esto, mirar el panel con el
      // dry-run puesto haría creer que se publicó de verdad.
      error_message: datos.simulado ? 'Simulado: no se posteó de verdad' : null,
    })
    .eq('nota_id', notaId)
    .eq('platform', red)
}

/**
 * El posteo falló, y por qué.
 *
 * Queda `failed` y no `pending`: un reintento futuro lo va a tomar igual
 * —`planDeFanout()` reintenta lo fallado— y la diferencia es que en el panel se
 * ve como lo que es.
 */
export async function marcarFallo(
  notaId: string,
  red: Red,
  motivo: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('social_posts')
    .update({ status: 'failed' as const, error_message: motivo })
    .eq('nota_id', notaId)
    .eq('platform', red)
}

/**
 * Deja constancia de una red que **no se intentó**, con el motivo.
 *
 * Sin esto, una red sin credenciales simplemente no aparece en el panel, y la
 * pregunta "¿por qué no salió en Instagram?" no tiene respuesta en ningún
 * lado. Se guarda como `failed` con la explicación, no como `pending`: pending
 * significaría que está por salir, y no lo está.
 *
 * **No pisa un posteo que ya salió.** Un `upsert` pelado acá convertiría en
 * `failed` la fila `success` de una nota que se republica con las
 * credenciales caídas: el posteo de la semana pasada existe igual, y decir que
 * falló sería mentir sobre algo que está publicado en Facebook. Por eso mira
 * antes. La carrera que eso deja abierta es inofensiva: lo que puede pasar es
 * que no se escriba un motivo, nunca que se postee dos veces.
 */
export async function registrarSalteo(
  notaId: string,
  notaSlug: string,
  red: Red,
  motivo: string,
): Promise<void> {
  const supabase = createAdminClient()

  const { data: existente } = await supabase
    .from('social_posts')
    .select('status')
    .eq('nota_id', notaId)
    .eq('platform', red)
    .maybeSingle()

  if (existente?.status === 'success' || existente?.status === 'processing') return

  await supabase.from('social_posts').upsert(
    {
      nota_id: notaId,
      nota_slug: notaSlug,
      platform: red,
      status: 'failed' as const,
      error_message: motivo,
    },
    { onConflict: 'nota_id,platform' },
  )
}
