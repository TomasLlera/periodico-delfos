import { inngest, notaPublicada } from '@/lib/inngest/client'
import { componerCopy } from '@/lib/social/compose'
import { agotada, explicarSalteo, planDeFanout } from '@/lib/social/fanout'
import {
  marcarEnCurso,
  marcarExito,
  marcarFallo,
  registrarSalteo,
  registrosDeNota,
} from '@/lib/social/registro'
import { publicadorDe, tieneCredenciales } from '@/lib/social/redes'
import { getNotaParaPostear } from '@/lib/supabase/queries/notas'
import { getPartidosPorIds } from '@/lib/supabase/queries/partidos'
import type { Red } from '@/types'

/**
 * El fan-out: una nota publicada se postea a Facebook, Instagram y X.
 *
 * Es el Step 17 del Build Order y la pieza que el blueprint describe en § 6.1.
 * Lo que la hace durable no es que sea lenta, es que **cada red es un paso
 * aparte**: si Instagram falla, Facebook y X ya salieron y no se vuelven a
 * intentar. Un `Promise.all` que explota en el medio deja los tres en un
 * estado que nadie sabe cuál es.
 *
 * **La idempotencia no la da Inngest, la da `social_posts`.** Inngest reintenta
 * un paso que falló, y sin el `unique (nota_id, platform)` cada reintento
 * publicaría otra vez. Ese es el orden correcto de las cosas y conviene no
 * invertirlo al leerlo: el UNIQUE es la garantía, la cola es la comodidad.
 *
 * **Hoy no postea de verdad en ningún lado.** Los clientes de Meta y X son los
 * Steps 15 y 16 y están bloqueados por afuera —App Review de Meta, Developer
 * Portal de X—, así que `publicadorDe()` devuelve el simulado. El pipeline
 * entero funciona: compone el copy, escribe `social_posts` y se puede mirar en
 * el panel. Es el "primero en modo dry-run" que pide el blueprint.
 */
export const postearNota = inngest.createFunction(
  {
    id: 'postear-nota',
    name: 'Postear una nota publicada a las redes',
    // Dos posteos de la misma nota al mismo tiempo no pueden pasar: sería la
    // vía más corta a publicar dos veces. `concurrency` con la nota como clave
    // lo impide del lado de Inngest, además del UNIQUE del lado de la base.
    concurrency: { key: 'event.data.notaId', limit: 1 },
    retries: 3,
    triggers: [notaPublicada],
  },
  async ({ event, step, logger }) => {
    const { notaId, slug, forzado = false } = event.data

    /**
     * La nota se lee **adentro** de la función y no viaja en el evento: entre
     * el disparo y un reintento de mañana puede haberse corregido el título.
     */
    const nota = await step.run('leer-la-nota', () => getNotaParaPostear(notaId))

    if (!nota) {
      logger.warn(`La nota ${slug} ya no existe: no hay nada que postear.`)
      return { posteadas: [] as Red[] }
    }

    // Republicar una nota despublicada dispararía esto de nuevo; si mientras
    // tanto volvió a borrador, postearla sería publicar en las redes algo que
    // el sitio no muestra.
    if (nota.estado !== 'publicada') {
      logger.warn(`La nota ${slug} no está publicada: no se postea.`)
      return { posteadas: [] as Red[] }
    }

    const registros = await step.run('leer-los-posteos', () => registrosDeNota(notaId))

    const plan = planDeFanout(
      nota.redes,
      registros,
      (red) => tieneCredenciales(red, process.env),
      forzado,
    )

    const posteadas: Red[] = []

    for (const item of plan) {
      if (!item.intentar) {
        const motivo = explicarSalteo(item)

        // Sólo se deja constancia de lo que **no se pudo**, no de lo que no se
        // quiso: escribir una fila por cada red que el autor apagó a propósito
        // llenaría el panel de errores que no son errores.
        if (motivo && item.motivo === 'sin-credenciales') {
          await step.run(`anotar-salteo-${item.red}`, () =>
            registrarSalteo(notaId, nota.slug, item.red, motivo),
          )
        }

        if (motivo) logger.info(motivo)
        continue
      }

      if (agotada(item, forzado)) {
        await step.run(`anotar-agotada-${item.red}`, () =>
          marcarFallo(
            notaId,
            item.red,
            `Se intentó ${item.intentosPrevios} veces y no salió. Revisá las credenciales antes de reintentar.`,
          ),
        )
        continue
      }

      /** Una sola forma para las tres salidas del paso: la unión no sobrevive
          a la serialización de Inngest del otro lado. */
      type Salida = { ok: boolean; motivo: string | null }

      const salio: Salida = await step.run(`postear-${item.red}`, async (): Promise<Salida> => {
        // Marcar antes de llamar a la API, nunca después: si se marcara
        // después, dos corridas simultáneas leerían las dos `pending`.
        const listo = await marcarEnCurso(notaId, nota.slug, item.red, item.intentosPrevios)
        if (!listo) {
          // Sin registro no hay idempotencia. Postear igual sería apostar a que
          // no hay otra corrida, y la apuesta se paga publicando dos veces.
          return { ok: false, motivo: 'No se pudo escribir el registro del posteo.' }
        }

        const copy = componerCopy(item.red, {
          nota,
          partido: null,
          urlSitio: process.env.NEXT_PUBLIC_SITE_URL ?? '',
        })

        if (!copy.entra) {
          return { ok: false, motivo: `El copy no entra en ${item.red}: son ${copy.largo}.` }
        }

        const resultado = await publicadorDe(item.red, process.env)({
          copy,
          imagenUrl: nota.imagen_portada,
          notaSlug: nota.slug,
        })

        if (resultado.error) return { ok: false, motivo: resultado.error }

        await marcarExito(notaId, item.red, resultado)
        return { ok: true, motivo: null }
      })

      if (salio.ok) {
        posteadas.push(item.red)
        continue
      }

      await step.run(`anotar-fallo-${item.red}`, () =>
        marcarFallo(notaId, item.red, salio.motivo ?? 'No se pudo postear'),
      )
    }

    return { posteadas }
  },
)

/**
 * El partido de la nota, para que el copy pueda nombrar a las goleadoras.
 *
 * Queda escrito acá y **sin usar todavía**: `componerCopy()` lo acepta como
 * opcional y sin él pierde una línea, nada más. Se cablea junto con los
 * clientes de verdad, que es cuando el copy pasa a importar de verdad.
 */
export async function partidoDeLaNota(partidoId: string | null) {
  if (!partidoId) return null
  const [partido] = await getPartidosPorIds([partidoId])
  return partido ?? null
}
