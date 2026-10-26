import { exigir } from '@/lib/supabase/exigir'
import { createClient, createStaticClient } from '@/lib/supabase/server'
import { agruparTablaPorFecha, filaDeAldosivi, type TablaDeFecha } from '@/lib/temporada'
import type { FilaTablaConEquipo, Goleadora, Temporada } from '@/types'

/** La temporada en curso. Hay un índice único que garantiza que sea una sola. */
export async function getTemporadaActiva(): Promise<Temporada | null> {
  const supabase = createStaticClient()
  const { data } = exigir(await supabase
    .from('temporadas')
    .select('*')
    .eq('activa', true)
    .maybeSingle(), 'getTemporadaActiva')

  return data
}

export async function getTemporadaPorSlug(slug: string): Promise<Temporada | null> {
  const supabase = createStaticClient()
  const { data } = exigir(await supabase
    .from('temporadas')
    .select('*')
    .eq('slug', slug)
    .maybeSingle(), 'getTemporadaPorSlug')

  return data
}

export async function getTemporadas(): Promise<Temporada[]> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('temporadas')
    .select('*')
    .order('anio', { ascending: false }), 'getTemporadas')

  return data ?? []
}

/**
 * Para `generateStaticParams` y el sitemap: corre en build, sin cookies.
 *
 * No puede ser `getTemporadas()`, que pide las cookies del request y en build
 * corta con "`cookies` was called outside a request scope". Es el mismo par
 * que ya tienen notas y partidos.
 */
export async function getSlugsTemporadas(): Promise<{ slug: string }[]> {
  const supabase = createStaticClient()
  const { data } = exigir(await supabase.from('temporadas').select('slug'), 'getSlugsTemporadas')
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
  const supabase = createStaticClient()

  let fecha = fechaNumero ?? null
  if (fecha === null) {
    const { data: ultima } = exigir(await supabase
      .from('tabla_posiciones')
      .select('fecha_numero')
      .eq('temporada_id', temporadaId)
      .order('fecha_numero', { ascending: false })
      .limit(1)
      .maybeSingle(), 'getTablaPosiciones')

    fecha = ultima?.fecha_numero ?? null
  }

  if (fecha === null) return { filas: [], fecha: null }

  const { data } = exigir(await supabase
    .from('tabla_posiciones')
    .select('*, equipo:equipos(*)')
    .eq('temporada_id', temporadaId)
    .eq('fecha_numero', fecha)
    .order('posicion', { ascending: true }), 'getTablaPosiciones')

  return { filas: (data ?? []) as unknown as FilaTablaConEquipo[], fecha }
}

/**
 * **Todas** las tablas de la temporada, una sola consulta, agrupadas por fecha.
 *
 * Es lo que necesita el selector de fecha del fixture: trayendo las catorce
 * fechas juntas, cambiar de fecha pasa en el cliente y la página no tiene que
 * leer `?fecha=` en el servidor —que es lo que la sacaría del prerender—. El
 * costo es el tamaño: once filas por fecha, con el equipo embebido, son unos
 * pocos kilobytes de JSON y se pagan una vez cada sesenta segundos de ISR.
 *
 * `createStaticClient()` y no `createClient()`: sin cookies, para no volver
 * dinámica la página que la llama.
 */
export async function getTablasDeLaTemporada(temporadaId: string): Promise<TablaDeFecha[]> {
  const supabase = createStaticClient()

  const { data } = exigir(await supabase
    .from('tabla_posiciones')
    .select('*, equipo:equipos(*)')
    .eq('temporada_id', temporadaId)
    .order('fecha_numero', { ascending: true })
    .order('posicion', { ascending: true }), 'getTablasDeLaTemporada')

  return agruparTablaPorFecha((data ?? []) as unknown as FilaTablaConEquipo[])
}

/** Posición de Aldosivi en la última fecha. Para la barra de estado. */
export async function getPosicionAldosivi(
  temporadaId: string,
): Promise<FilaTablaConEquipo | null> {
  const { filas } = await getTablaPosiciones(temporadaId)
  return filaDeAldosivi(filas)
}

/** Desde la vista `goleadoras`. Cero mantenimiento: se calcula sola. */
export async function getGoleadoras(
  temporadaId: string,
  limite = 5,
): Promise<Goleadora[]> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('goleadoras')
    .select('*')
    .eq('temporada_id', temporadaId)
    .order('goles', { ascending: false })
    .limit(limite), 'getGoleadoras')

  return data ?? []
}

/** Una temporada por id. Para el formulario de edición del panel. */
export async function getTemporadaPorId(id: string): Promise<Temporada | null> {
  const supabase = await createClient()
  const { data } = exigir(await supabase.from('temporadas').select('*').eq('id', id).maybeSingle(), 'getTemporadaPorId')

  return data
}

/**
 * Las fechas que ya tienen tabla cargada, de la más nueva a la más vieja.
 *
 * La pantalla de la tabla abre en la fecha siguiente a la última, y para saber
 * cuál es no hace falta traer las once filas de cada fecha: alcanza con los
 * números.
 */
export async function getFechasConTabla(temporadaId: string): Promise<number[]> {
  const supabase = await createClient()
  const { data } = exigir(await supabase
    .from('tabla_posiciones')
    .select('fecha_numero')
    .eq('temporada_id', temporadaId)
    .order('fecha_numero', { ascending: false }), 'getFechasConTabla')

  return [...new Set((data ?? []).map((f) => f.fecha_numero as number))]
}
