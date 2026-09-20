import { createClient, createStaticClient } from '@/lib/supabase/server'
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

/**
 * Los partidos que embebe el cuerpo de una nota, en **una sola** consulta.
 *
 * `<CuerpoTipTap />` no consulta la base: recibe un mapa ya armado. La página
 * junta los ids con `partidoIdsDelCuerpo()` y los pide todos de una; pedirlos
 * desde cada nodo `planilla` serían N consultas en serie.
 */
export async function getPartidosPorIds(
  ids: readonly string[],
): Promise<PartidoCompleto[]> {
  if (ids.length === 0) return []

  const supabase = await createClient()
  const { data } = await supabase.from('partidos').select(CAMPOS_COMPLETO).in('id', ids)

  const partidos = (data ?? []) as unknown as PartidoCompleto[]
  for (const partido of partidos) {
    // PostgREST no garantiza orden en las relaciones anidadas.
    partido.eventos.sort((a, b) => a.minuto - b.minuto || a.adicionado - b.adicionado)
  }
  return partidos
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

/** Para `generateStaticParams` y el sitemap: corre en build, sin cookies. */
export async function getSlugsPartidos(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient()
  const { data } = await supabase.from('partidos').select('slug')
  return data ?? []
}

/**
 * Los partidos para el selector del editor de notas.
 *
 * Trae equipos y temporada pero **no eventos ni formaciones**: en un `<select>`
 * sólo se muestra "Fecha 4 · Aldosivi 6-1 Claypole", así que traer la planilla
 * entera de cada partido sería pedir de más para dibujar una línea.
 *
 * Los más recientes primero, que es el orden en que se escriben las notas: la
 * crónica se escribe el mismo día del partido.
 */
export async function getPartidosParaEditor(limite = 50): Promise<PartidoConEquipos[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(CAMPOS_PARTIDO)
    .order('fecha_hora', { ascending: false })
    .limit(limite)

  return (data ?? []) as unknown as PartidoConEquipos[]
}
