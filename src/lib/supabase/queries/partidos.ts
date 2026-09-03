import { createClient } from '@/lib/supabase/server'
import type { PartidoCompleto, PartidoConEquipos } from '@/types'

/**
 * `partidos` tiene dos foreign keys a `equipos`, así que PostgREST necesita el
 * nombre del constraint para saber cuál es cuál. Sin el hint devuelve error.
 */
const CAMPOS_PARTIDO = `
  *,
  equipo_local:equipos!partidos_equipo_local_id_fkey(*),
  equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(*),
  temporada:temporadas(*)
`

const CAMPOS_COMPLETO = `
  ${CAMPOS_PARTIDO},
  eventos(
    *,
    jugadora:jugadoras!eventos_jugadora_id_fkey(id, nombre, apellido, slug),
    jugadora_sale:jugadoras!eventos_jugadora_sale_id_fkey(id, nombre, apellido, slug)
  ),
  formaciones(*, jugadora:jugadoras(*))
`

/** Todo lo que <PlanillaPartido /> necesita, en una sola query. */
export async function getPartidoPorSlug(slug: string): Promise<PartidoCompleto | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(CAMPOS_COMPLETO)
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return null

  const partido = data as unknown as PartidoCompleto
  // PostgREST no garantiza orden en las relaciones anidadas.
  partido.eventos.sort((a, b) => a.minuto - b.minuto || a.adicionado - b.adicionado)
  return partido
}

/** Fixture completo de una temporada, en orden de fecha. */
export async function getPartidosTemporada(
  temporadaId: string,
): Promise<PartidoConEquipos[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(CAMPOS_PARTIDO)
    .eq('temporada_id', temporadaId)
    .order('fecha_hora', { ascending: true })

  return (data ?? []) as unknown as PartidoConEquipos[]
}

/** Último partido jugado. Alimenta la barra de estado de la portada. */
export async function getUltimoPartido(): Promise<PartidoConEquipos | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(CAMPOS_PARTIDO)
    .eq('estado', 'finalizado')
    .order('fecha_hora', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as unknown as PartidoConEquipos | null
}

/** Próximo partido programado. Reemplaza las placas de imagen con texto adentro. */
export async function getProximoPartido(): Promise<PartidoConEquipos | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(CAMPOS_PARTIDO)
    .eq('estado', 'programado')
    .gte('fecha_hora', new Date().toISOString())
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .maybeSingle()

  return data as unknown as PartidoConEquipos | null
}

/** Historial contra un rival, para la ficha del partido. */
export async function getHistorialContra(
  equipoId: string,
  excluirPartidoId?: string,
): Promise<PartidoConEquipos[]> {
  const supabase = await createClient()
  let query = supabase
    .from('partidos')
    .select(CAMPOS_PARTIDO)
    .eq('estado', 'finalizado')
    .or(`equipo_local_id.eq.${equipoId},equipo_visitante_id.eq.${equipoId}`)
    .order('fecha_hora', { ascending: false })
    .limit(10)

  if (excluirPartidoId) query = query.neq('id', excluirPartidoId)

  const { data } = await query
  return (data ?? []) as unknown as PartidoConEquipos[]
}

export async function getSlugsPartidos(): Promise<{ slug: string }[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('partidos').select('slug')
  return data ?? []
}
