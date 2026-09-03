import { createClient } from '@/lib/supabase/server'
import type { FilaTablaConEquipo, Goleadora, Temporada } from '@/types'

/** La temporada en curso. Hay un índice único que garantiza que sea una sola. */
export async function getTemporadaActiva(): Promise<Temporada | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('temporadas')
    .select('*')
    .eq('activa', true)
    .maybeSingle()

  return data
}

export async function getTemporadaPorSlug(slug: string): Promise<Temporada | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('temporadas')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  return data
}

export async function getTemporadas(): Promise<Temporada[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('temporadas')
    .select('*')
    .order('anio', { ascending: false })

  return data ?? []
}

/**
 * Tabla de posiciones de la última fecha cargada, o de una fecha puntual.
 *
 * Esta tabla se carga a mano (ver 0004): el medio no cubre todos los partidos
 * de la zona, así que no se puede calcular desde `partidos`.
 */
export async function getTablaPosiciones(
  temporadaId: string,
  fechaNumero?: number,
): Promise<{ filas: FilaTablaConEquipo[]; fecha: number | null }> {
  const supabase = await createClient()

  let fecha = fechaNumero ?? null
  if (fecha === null) {
    const { data: ultima } = await supabase
      .from('tabla_posiciones')
      .select('fecha_numero')
      .eq('temporada_id', temporadaId)
      .order('fecha_numero', { ascending: false })
      .limit(1)
      .maybeSingle()

    fecha = ultima?.fecha_numero ?? null
  }

  if (fecha === null) return { filas: [], fecha: null }

  const { data } = await supabase
    .from('tabla_posiciones')
    .select('*, equipo:equipos(*)')
    .eq('temporada_id', temporadaId)
    .eq('fecha_numero', fecha)
    .order('posicion', { ascending: true })

  return { filas: (data ?? []) as unknown as FilaTablaConEquipo[], fecha }
}

/** Posición de Aldosivi en la última fecha. Para la barra de estado. */
export async function getPosicionAldosivi(
  temporadaId: string,
): Promise<FilaTablaConEquipo | null> {
  const { filas } = await getTablaPosiciones(temporadaId)
  return filas.find((f) => f.equipo.es_aldosivi) ?? null
}

/** Desde la vista `goleadoras`. Cero mantenimiento: se calcula sola. */
export async function getGoleadoras(
  temporadaId: string,
  limite = 5,
): Promise<Goleadora[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('goleadoras')
    .select('*')
    .eq('temporada_id', temporadaId)
    .order('goles', { ascending: false })
    .limit(limite)

  return data ?? []
}
