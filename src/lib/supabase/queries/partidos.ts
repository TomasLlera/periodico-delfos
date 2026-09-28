import { createClient, createStaticClient } from '@/lib/supabase/server'
import type { EventoConJugadora, PartidoCompleto, PartidoConEquipos } from '@/types'

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

/** Los dos hints de `eventos` a `jugadoras`, en un solo lugar. */
const CAMPOS_EVENTO = `
  *,
  jugadora:jugadoras!eventos_jugadora_id_fkey(id, nombre, apellido, slug),
  jugadora_sale:jugadoras!eventos_jugadora_sale_id_fkey(id, nombre, apellido, slug)
`

const CAMPOS_COMPLETO = `
  ${CAMPOS_PARTIDO},
  eventos(${CAMPOS_EVENTO}),
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

/** Un partido con todo —eventos y formaciones— por id, para la planilla de carga. */
export async function getPartidoPorId(id: string): Promise<PartidoCompleto | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('partidos').select(CAMPOS_COMPLETO).eq('id', id).maybeSingle()

  return data as unknown as PartidoCompleto | null
}

/**
 * Un partido con el resultado y cuánto tiene cargado, para el listado del panel.
 *
 * La cuenta viene de PostgREST —`eventos(count)`— y no de traer los eventos:
 * el listado sólo necesita saber si hay algo cargado, y bajar la planilla
 * entera de cincuenta partidos para contar filas sería pedir la base completa
 * para dibujar dos números.
 */
export interface PartidoDelPanel extends PartidoConEquipos {
  cargado: { formaciones: number; eventos: number }
}

export async function getPartidosParaPanel(limite = 100): Promise<PartidoDelPanel[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('partidos')
    .select(`${CAMPOS_PARTIDO}, eventos(count), formaciones(count)`)
    .order('fecha_hora', { ascending: false })
    .limit(limite)

  // PostgREST devuelve el agregado como un array de un elemento: `[{count: 3}]`,
  // y como array vacío cuando no hay ninguno.
  type ConCuentas = PartidoConEquipos & {
    eventos: { count: number }[]
    formaciones: { count: number }[]
  }

  return ((data ?? []) as unknown as ConCuentas[]).map((p) => ({
    ...p,
    cargado: {
      eventos: p.eventos[0]?.count ?? 0,
      formaciones: p.formaciones[0]?.count ?? 0,
    },
  }))
}

/**
 * Los eventos del último partido jugado, para el bloque de la portada.
 *
 * Recibe el id en lugar de buscar el partido: `getEstadoDelSitio()` ya devuelve
 * `ultimo` —memoizado y compartido con la barra de estado— y volver a
 * resolverlo acá abriría la puerta a que el bloque y la barra muestren partidos
 * distintos.
 *
 * **Es una lectura aparte y no un campo más de `getEstadoDelSitio()`.** Esa
 * función la llama el layout raíz para la barra, o sea todas las páginas del
 * sitio: meterle los eventos haría que cada página lea la planilla de un
 * partido que no dibuja. Los goles los necesita la portada y nadie más.
 *
 * **`createStaticClient()` y no `createClient()`**, por lo mismo que
 * `getEstadoDelSitio()`: pedir las cookies desde la portada la volvería
 * dinámica y se perdería el ISR de 60s.
 */
export async function getEventosDePartido(
  partidoId: string,
): Promise<EventoConJugadora[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('eventos')
    .select(CAMPOS_EVENTO)
    .eq('partido_id', partidoId)
    .order('minuto', { ascending: true })
    .order('adicionado', { ascending: true })

  return (data ?? []) as unknown as EventoConJugadora[]
}
