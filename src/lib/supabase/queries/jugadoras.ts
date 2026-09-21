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

export async function getPlantel(temporadaId: string): Promise<JugadoraEnPlantel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('plantel')
    .select('dorsal, posicion, capitana, jugadora:jugadoras(*)')
    .eq('temporada_id', temporadaId)
    .order('dorsal', { ascending: true, nullsFirst: false })

  type Fila = {
    dorsal: number | null
    posicion: Posicion | null
    capitana: boolean
    jugadora: Jugadora
  }

  return ((data ?? []) as unknown as Fila[]).map((fila) => ({
    ...fila.jugadora,
    dorsal: fila.dorsal,
    // La posición del plantel manda: puede cambiar entre temporadas.
    posicion_temporada: fila.posicion ?? fila.jugadora.posicion,
    capitana: fila.capitana,
  }))
}

export async function getJugadoraPorSlug(slug: string): Promise<Jugadora | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('jugadoras')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

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

  const { data } = await query
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

  const { data } = await query
  return (data ?? []) as unknown as GolDeJugadora[]
}

/** Para `generateStaticParams` y el sitemap: corre en build, sin cookies. */
export async function getSlugsJugadoras(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient()
  const { data } = await supabase.from('jugadoras').select('slug')
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
  const { data } = await supabase
    .from('jugadoras')
    .select('*')
    .order('apellido', { ascending: true })
    .order('nombre', { ascending: true })

  return data ?? []
}

export async function getJugadoraPorId(id: string): Promise<Jugadora | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('jugadoras').select('*').eq('id', id).maybeSingle()

  return data
}
