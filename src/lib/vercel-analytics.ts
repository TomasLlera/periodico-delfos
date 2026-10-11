import 'server-only'
import type { Rango } from '@/lib/estadisticas'
import { fechasDelRango } from '@/lib/estadisticas'

/**
 * El cliente de la API de Web Analytics de Vercel.
 *
 * **`import 'server-only'` arriba de todo, y es la línea más importante del
 * archivo.** `VERCEL_TOKEN` es un token de cuenta: con él se pueden leer y
 * tocar todos los proyectos de Tomás, no sólo éste. Esa importación hace que el
 * build falle si alguna vez alguien importa este módulo desde un componente
 * cliente, en vez de descubrirlo cuando el token ya viajó al navegador de todos
 * los lectores.
 *
 * Por lo mismo las variables van **sin** `NEXT_PUBLIC_`: ese prefijo las
 * incrusta en el bundle.
 *
 * **La respuesta se cachea 15 minutos** (`next.revalidate`). Las visitas de un
 * diario chico no cambian de minuto a minuto, y sin cache cada vez que alguien
 * abre la pantalla —o aprieta 7/30 días y vuelve— sale un pedido a Vercel por
 * cada una de las cinco consultas.
 *
 * **Nunca tira.** Devuelve `{ error }` en vez de romper: la pantalla tiene que
 * poder decir qué pasó —falta el token, la API contestó 403, no hay datos
 * todavía— y no mostrar la página de error de Next, que no explica nada.
 */

/** Lo que la API agrupa. El nombre es el que vuelve como clave en cada fila. */
export type Dimension = 'day' | 'requestPath' | 'referrerHostname' | 'deviceType' | 'country'

const BASE = 'https://api.vercel.com/v1/query/web-analytics/visits/aggregate'

/** Quince minutos. Ver el comentario de arriba. */
const CACHE_SEGUNDOS = 15 * 60

export interface RespuestaAnalytics {
  filas: Record<string, unknown>[]
  error?: string
}

/** `null` si falta algo. Lo que devuelve es lo que la pantalla necesita decir. */
function configuracion(): { token: string; projectId: string; teamId?: string } | null {
  const token = process.env.VERCEL_TOKEN?.trim()
  const projectId = process.env.VERCEL_PROJECT_ID?.trim()

  // El string vacío es el caso que pasa de verdad: una variable declarada en
  // Vercel y sin valor, que es lo que queda al importar un `.env.example`.
  if (!token || !projectId) return null

  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  return { token, projectId, ...(teamId ? { teamId } : {}) }
}

/** `true` si la pantalla puede intentar consultar. Lo usa el estado de error. */
export function hayCredenciales(): boolean {
  return configuracion() !== null
}

/**
 * Una consulta agrupada.
 *
 * `teamId` va sólo si el proyecto es de un equipo: mandarlo vacío en un
 * proyecto personal devuelve 403, que es el error más difícil de diagnosticar
 * de los que tira esta API.
 */
export async function consultarVisitas(
  por: Dimension,
  rango: Rango,
  limite?: number,
): Promise<RespuestaAnalytics> {
  const config = configuracion()
  if (!config) {
    return { filas: [], error: 'Faltan VERCEL_TOKEN o VERCEL_PROJECT_ID en el servidor.' }
  }

  const { since, until } = fechasDelRango(rango)

  const parametros = new URLSearchParams({ projectId: config.projectId, since, until, by: por })
  if (config.teamId) parametros.set('teamId', config.teamId)
  if (limite) parametros.set('limit', String(limite))

  try {
    const respuesta = await fetch(`${BASE}?${parametros}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      next: { revalidate: CACHE_SEGUNDOS },
    })

    if (!respuesta.ok) {
      // El código importa y se dice: 403 casi siempre es el `teamId` puesto o
      // faltante al revés de lo que corresponde, y 404 es un `projectId` de
      // otro proyecto. Un "no se pudo" genérico deja a alguien revisando el
      // token, que es lo único que suele estar bien.
      return { filas: [], error: `La API de Vercel respondió ${respuesta.status}.` }
    }

    const cuerpo: unknown = await respuesta.json()
    const filas = (cuerpo as { data?: unknown }).data

    return { filas: Array.isArray(filas) ? (filas as Record<string, unknown>[]) : [] }
  } catch {
    return { filas: [], error: 'No se pudo contactar a la API de Vercel.' }
  }
}
