import { revalidatePath } from 'next/cache'
import { inngest, notaPublicada } from '@/lib/inngest/client'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Red } from '@/types'

/**
 * Publica las notas programadas que ya vencieron.
 *
 * **Es el primer cron del proyecto.** Todo lo demás en Inngest arranca por un
 * evento que dispara alguien; esto corre solo cada cinco minutos y mira si hay
 * algo para sacar.
 *
 * **Cinco minutos y no uno.** Un diario de fútbol femenino no necesita salir al
 * segundo exacto, y una corrida por minuto son 43.200 invocaciones por mes para
 * que la enorme mayoría no encuentre nada. Con cinco, el peor caso es que una
 * nota salga cuatro minutos y pico tarde, que para esto no es nada.
 *
 * **Usa la service role, y es una de las dos únicas veces que se justifica.**
 * Las escrituras del panel van con la sesión del autor porque hay un autor del
 * otro lado; acá no hay nadie: corre en el servidor de Inngest, sin cookies y
 * sin sesión, y RLS sobre `notas` pide `es_autor()`. La alternativa sería una
 * política nueva que deje publicar sin sesión, que es abrir una puerta más
 * grande que la que cierra.
 *
 * **`publicada_en` es el momento real y no el programado.** Si el trabajo corre
 * tarde —porque Inngest tuvo demora o porque la corrida anterior falló—, la
 * fecha que ve el lector es cuando la nota efectivamente salió. Poner la hora
 * pedida sería escribir en la portada que algo se publicó a las 9:00 cuando a
 * las 9:00 no estaba, y esa fecha además ordena la portada y alimenta el RSS.
 *
 * **Cada nota es un `step` propio.** Si una falla —un slug repetido, una fila
 * borrada entre la lectura y el update— las demás salen igual, y el reintento
 * de Inngest no vuelve a publicar las que ya salieron.
 *
 * **El posteo a redes sale del mismo evento que la publicación manual.** Es lo
 * que evita el peor final posible de esta función: que una nota programada se
 * publique en el sitio y no llegue a ninguna red, con nadie mirando porque
 * nadie apretó nada.
 */

/** Cuántas saca por corrida. Un tope flojo para que una cola rara no se desboque. */
const POR_CORRIDA = 20

interface NotaProgramada {
  id: string
  slug: string
  auto_post: boolean
  redes: Red[]
}

export const publicarProgramadas = inngest.createFunction(
  {
    id: 'publicar-programadas',
    name: 'Publicar las notas programadas que ya vencieron',
    // Dos corridas a la vez tomarían las mismas filas y publicarían dos veces.
    concurrency: { limit: 1 },
    retries: 2,
    triggers: [{ cron: '*/5 * * * *' }],
  },
  async ({ step, logger }) => {
    const vencidas = await step.run('buscar-las-vencidas', async () => {
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('notas')
        .select('id, slug, auto_post, redes')
        .eq('estado', 'programada')
        .lte('publicar_en', new Date().toISOString())
        .order('publicar_en', { ascending: true })
        .limit(POR_CORRIDA)

      if (error) throw new Error(`No se pudieron leer las programadas: ${error.message}`)
      return (data ?? []) as NotaProgramada[]
    })

    if (vencidas.length === 0) return { publicadas: 0 }

    const publicadas: string[] = []

    for (const nota of vencidas) {
      // El `.eq('estado', 'programada')` del update no sobra: entre la lectura
      // y esta línea alguien pudo publicarla a mano desde el panel. Sin eso, le
      // pisaríamos la fecha y dispararíamos un segundo posteo.
      const salio = await step.run(`publicar-${nota.id}`, async () => {
        const supabase = createAdminClient()
        const { data, error } = await supabase
          .from('notas')
          .update({ estado: 'publicada', publicada_en: new Date().toISOString() })
          .eq('id', nota.id)
          .eq('estado', 'programada')
          .select('id')
          .maybeSingle()

        if (error) throw new Error(`No se pudo publicar ${nota.slug}: ${error.message}`)
        return data !== null
      })

      if (!salio) {
        logger.info(`La nota ${nota.slug} ya no estaba programada: alguien la tocó antes.`)
        continue
      }

      publicadas.push(nota.slug)

      if (nota.auto_post && nota.redes.length > 0) {
        await step.sendEvent(`postear-${nota.id}`, notaPublicada.create({
          notaId: nota.id,
          slug: nota.slug,
        }))
      }
    }

    // Después de todas y no adentro del bucle: revalidar la portada una vez por
    // nota sería pedirle a Next que rearme la misma página cinco veces seguidas.
    if (publicadas.length > 0) {
      await step.run('revalidar', async () => {
        revalidatePath('/')
        revalidatePath('/cronicas')
        revalidatePath('/analisis')
        for (const slug of publicadas) revalidatePath(`/nota/${slug}`)
      })
    }

    logger.info(`Salieron ${publicadas.length} notas programadas.`)

    return { publicadas: publicadas.length, slugs: publicadas }
  },
)
