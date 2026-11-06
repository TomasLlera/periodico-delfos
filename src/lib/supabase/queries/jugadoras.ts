import { exigir } from '@/lib/supabase/exigir'
import { createClient, createStaticClient } from '@/lib/supabase/server'
import type {
  EstadisticasJugadora,
  GolDeJugadora,
  Jugadora,
  JugadoraEnPlantel,
  Posicion,
} from '@/types'

/**
 * El orden y los nombres de los puestos viven en `src/lib/plantel.ts`, no acá:
 * son presentación pura, y desde este archivo arrastraban el cliente de
 * Supabase —y con él `next/headers`— adentro de cualquier test que los tocara.
 */

/**
 * El plantel de una temporada.
 *
 * **Ya no lee `plantel.dorsal`, porque esa columna no existe.** La migración
 * `0020` la borró —el dorsal pasó a ser el de cada partido, en
 * `formaciones`— pero su commit tocó sólo el SQL y no el código, así que esta
 * query siguió pidiendo la columna y Postgres contestaba `42703: column
 * plantel.dorsal does not exist`. Resultado: `/plantel/[temporadaSlug]` y
 * `/jugadora/[slug]` tiraban **500** en el sitio público.
 *
 * Estuvo oculto un tiempo: con el `loading.tsx` que había en la raíz, la
 * excepción llegaba cuando la respuesta ya había salido con status 200, así
 * que la página se veía rota pero el monitoreo —y el test de `/plantel`— la
 * veían bien. Se descubrió al arreglar los 404.
 *
 * **El número que se muestra ahora es el último que usó.** Es lo que queda
 * cuando el dorsal es por partido: la jugadora puede haber jugado con el 9 en
 * marzo y con el 11 en agosto, y el plantel tiene que mostrar uno. El último
 * es el que la hinchada le reconoce hoy. Si nunca entró a una planilla, va sin
 * número, que es la verdad: todavía no usó ninguno.
 */
export async function getPlantel(temporadaId: string): Promise<JugadoraEnPlantel[]> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('plantel')
    .select('posicion, capitana, jugadora:jugadoras(*)')
    .eq('temporada_id', temporadaId), 'getPlantel')

  type Fila = {
    posicion: Posicion | null
    capitana: boolean
    jugadora: Jugadora
  }

  const filas = (data ?? []) as unknown as Fila[]

  // El orden ya no sale del `.order()` de la query: el dorsal vive en otra
  // tabla. Lo pone `ordenarPlantel()` en `src/lib/plantel.ts`, que es la que
  // tiene los tests del criterio —por número, y las que no tienen al final.
  const dorsales = await dorsalesDeLaTemporada(
    supabase,
    temporadaId,
    filas.map((fila) => fila.jugadora.id),
  )

  return filas.map((fila) => ({
    ...fila.jugadora,
    dorsal: dorsales.get(fila.jugadora.id) ?? null,
    // La posición del plantel manda: puede cambiar entre temporadas.
    posicion_temporada: fila.posicion ?? fila.jugadora.posicion,
    capitana: fila.capitana,
  }))
}

/**
 * El último dorsal que usó cada jugadora en la temporada, desde `formaciones`.
 *
 * **Una sola consulta para todo el plantel** y no una por jugadora: son treinta
 * y tres, y treinta y tres viajes a la base por treinta y tres números es
 * exactamente lo que el proyecto ya evita en `getTitulosPorSlugs()`.
 *
 * Filtra por `jugadora_id` y no por equipo. Desde la `0020` las formaciones
 * incluyen a los dos equipos del partido, así que sin este filtro entraría el
 * dorsal de una rival; acotarlo a las jugadoras del plantel es más directo que
 * ir a buscar cuál de los dos equipos es Aldosivi.
 *
 * Devuelve un `Map` por lo mismo que `getTitulosPorSlugs()`: las claves son
 * ids y un `Record` respondería a cosas como `constructor` con algo que no es
 * un dorsal.
 */
async function dorsalesDeLaTemporada(
  supabase: Awaited<ReturnType<typeof createClient>>,
  temporadaId: string,
  jugadoraIds: readonly string[],
): Promise<Map<string, number>> {
  if (jugadoraIds.length === 0) return new Map()

  const { data } = exigir(await supabase
    .from('formaciones')
    .select('jugadora_id, dorsal, partido:partidos!inner(fecha_hora, temporada_id)')
    .eq('partido.temporada_id', temporadaId)
    .in('jugadora_id', [...jugadoraIds])
    .not('dorsal', 'is', null)
    // Del partido más viejo al más nuevo, así el último que se escribe en el
    // mapa es el último que usó.
    .order('fecha_hora', { ascending: true, referencedTable: 'partidos' }), 'dorsalesDeLaTemporada')

  type Fila = { jugadora_id: string; dorsal: number }

  const dorsales = new Map<string, number>()
  for (const fila of (data ?? []) as unknown as Fila[]) {
    dorsales.set(fila.jugadora_id, fila.dorsal)
  }

  return dorsales
}

export async function getJugadoraPorSlug(slug: string): Promise<Jugadora | null> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('jugadoras')
    .select('*')
    .eq('slug', slug)
    .maybeSingle(), 'getJugadoraPorSlug')

  return data
}

/** Desde la vista `estadisticas_jugadora`. Nunca se escribe a mano. */
export async function getEstadisticasJugadora(
  jugadoraId: string,
  temporadaId?: string,
): Promise<EstadisticasJugadora[]> {
  const supabase = await createClient()
  let query = supabase
    .from('estadisticas_jugadora')
    .select('*')
    .eq('jugadora_id', jugadoraId)

  if (temporadaId) query = query.eq('temporada_id', temporadaId)

  const { data } = exigir(await query, 'getEstadisticasJugadora')
  return data ?? []
}

/**
 * Los goles de una jugadora con el minuto y el rival de cada uno.
 * Es la respuesta a "¿cuántos goles lleva Cortadi esta temporada?".
 */
export async function getGolesDeJugadora(
  jugadoraId: string,
  temporadaId?: string,
): Promise<GolDeJugadora[]> {
  const supabase = await createClient()
  let query = supabase
    .from('eventos')
    .select(
      `*,
       partido:partidos!inner(
         slug, fecha_numero, fecha_hora, temporada_id,
         equipo_local:equipos!partidos_equipo_local_id_fkey(nombre_corto, es_aldosivi),
         equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(nombre_corto, es_aldosivi)
       )`,
    )
    .eq('jugadora_id', jugadoraId)
    .in('tipo', ['gol', 'gol_penal'])

  if (temporadaId) query = query.eq('partido.temporada_id', temporadaId)

  const { data } = exigir(await query, 'getGolesDeJugadora')
  return (data ?? []) as unknown as GolDeJugadora[]
}

/** Para `generateStaticParams` y el sitemap: corre en build, sin cookies. */
export async function getSlugsJugadoras(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient()
  const { data } = exigir(await supabase.from('jugadoras').select('slug'), 'getSlugsJugadoras')
  return data ?? []
}

/**
 * Todas las jugadoras, activas e inactivas, para el listado del panel.
 *
 * Las inactivas **también** vienen: son las que se fueron del club, siguen
 * teniendo goles en las planillas viejas y hay que poder encontrarlas para
 * corregirles un dato o reactivarlas. El listado las separa; la base no.
 *
 * Por apellido, que es como se busca un nombre en una lista de treinta.
 */
export async function getJugadoras(): Promise<Jugadora[]> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('jugadoras')
    .select('*')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true }), 'getJugadoras')

  return data ?? []
}

export async function getJugadoraPorId(id: string): Promise<Jugadora | null> {
  const supabase = await createClient()
  const { data } = exigir(await supabase.from('jugadoras').select('*').eq('id', id).maybeSingle(), 'getJugadoraPorId')

  return data
}
