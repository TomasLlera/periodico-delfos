import { createAdminClient } from '@/lib/supabase/admin'
import { createClient, createStaticClient } from '@/lib/supabase/server'
import type { Categoria, NotaConRelaciones, NotaResumen, ResultadoBusqueda } from '@/types'

/**
 * Todas las queries de notas viven acá. Nunca inline en un componente.
 *
 * RLS ya filtra los borradores (ver 0008_rls.sql), pero igual se filtra por
 * `estado` de forma explícita: leer una query y saber qué devuelve sin tener
 * que ir a buscar la política vale más que el renglón que se ahorra.
 */

const CAMPOS_RESUMEN = `
  id, titulo, slug, bajada, imagen_portada, imagen_alt, imagen_credito,
  categoria, temporada_id, partido_id, autor_id, estado, publicada_en,
  destacada, auto_post, redes, created_at, updated_at,
  autor:autores(nombre, slug)
`

const CAMPOS_COMPLETOS = `
  *,
  autor:autores(*),
  temporada:temporadas(*),
  partido:partidos(
    *,
    equipo_local:equipos!partidos_equipo_local_id_fkey(*),
    equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(*),
    temporada:temporadas(*)
  )
`

export async function getNotaPorSlug(slug: string): Promise<NotaConRelaciones | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_COMPLETOS)
    .eq('slug', slug)
    .eq('estado', 'publicada')
    .maybeSingle()

  return data as unknown as NotaConRelaciones | null
}

/** La nota principal de la portada: la destacada más reciente. */
export async function getNotaPrincipal(): Promise<NotaResumen | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .order('destacada', { ascending: false })
    .order('publicada_en', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data as unknown as NotaResumen | null
}

/**
 * Últimas notas para la portada.
 *
 * `excluirIds` existe por una razón concreta: la home de WordPress muestra las
 * mismas notas cuatro veces. Ningún bloque de la portada nueva puede repetir
 * una nota que ya apareció en otro.
 */
export async function getUltimasNotas(opciones: {
  limite?: number
  excluirIds?: string[]
  categoria?: Categoria
  temporadaId?: string
  offset?: number
} = {}): Promise<NotaResumen[]> {
  const { limite = 4, excluirIds = [], categoria, temporadaId, offset = 0 } = opciones
  const supabase = await createClient()

  let query = supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .order('publicada_en', { ascending: false })
    .range(offset, offset + limite - 1)

  if (categoria) query = query.eq('categoria', categoria)
  if (temporadaId) query = query.eq('temporada_id', temporadaId)
  if (excluirIds.length > 0) query = query.not('id', 'in', `(${excluirIds.join(',')})`)

  const { data } = await query
  return (data ?? []) as unknown as NotaResumen[]
}

/** Listado paginado por categoría, para /cronicas y /analisis. */
export async function getNotasPorCategoria(
  categoria: Categoria,
  pagina = 1,
  porPagina = 12,
): Promise<{ notas: NotaResumen[]; total: number }> {
  const supabase = await createClient()
  const desde = (pagina - 1) * porPagina

  const { data, count } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN, { count: 'exact' })
    .eq('estado', 'publicada')
    .eq('categoria', categoria)
    .order('publicada_en', { ascending: false })
    .range(desde, desde + porPagina - 1)

  return { notas: (data ?? []) as unknown as NotaResumen[], total: count ?? 0 }
}

/**
 * Relacionadas, **primero las del mismo partido** y después las de la
 * temporada.
 *
 * El orden importa y no es un detalle de implementación. Un partido genera
 * tres notas —la previa, la crónica y el análisis— y ésas son las que de verdad
 * se siguen leyendo una detrás de otra: quien termina la crónica de Claypole
 * quiere la previa de Claypole, no una nota de hace dos meses de la misma
 * temporada. Es la misma idea que el sitio ya aplica al revés, desde la ficha
 * del partido hacia las notas (`getNotasDePartido`).
 *
 * Si no alcanzan, se completa con la temporada. Y si la nota no tiene ni
 * partido ni temporada, no se muestra nada: mejor eso que mostrar cualquier
 * cosa —hoy el sitio viejo pone partidos de la Primera C 2024 como contexto de
 * una nota de 2026.
 */
export async function getNotasRelacionadas(
  nota: Pick<NotaConRelaciones, 'id' | 'temporada_id' | 'categoria' | 'partido_id'>,
  limite = 3,
): Promise<NotaResumen[]> {
  const supabase = await createClient()

  const delPartido: NotaResumen[] = []

  if (nota.partido_id) {
    const { data } = await supabase
      .from('notas')
      .select(CAMPOS_RESUMEN)
      .eq('estado', 'publicada')
      .eq('partido_id', nota.partido_id)
      .neq('id', nota.id)
      .order('publicada_en', { ascending: false })
      .limit(limite)

    delPartido.push(...((data ?? []) as unknown as NotaResumen[]))
  }

  const faltan = limite - delPartido.length
  if (faltan <= 0 || !nota.temporada_id) return delPartido

  // Las de la temporada, salteando las que ya entraron por partido.
  const yaEstan = [nota.id, ...delPartido.map((n) => n.id)]
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .eq('temporada_id', nota.temporada_id)
    .not('id', 'in', `(${yaEstan.join(',')})`)
    .order('publicada_en', { ascending: false })
    .limit(faltan)

  return [...delPartido, ...((data ?? []) as unknown as NotaResumen[])]
}

/** Notas donde aparece una jugadora: las de los partidos que jugó. */
export async function getNotasDeJugadora(
  jugadoraId: string,
  limite = 5,
): Promise<NotaResumen[]> {
  const supabase = await createClient()

  const { data: formaciones } = await supabase
    .from('formaciones')
    .select('partido_id')
    .eq('jugadora_id', jugadoraId)

  const partidoIds = (formaciones ?? []).map((f) => f.partido_id)
  if (partidoIds.length === 0) return []

  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .in('partido_id', partidoIds)
    .order('publicada_en', { ascending: false })
    .limit(limite)

  return (data ?? []) as unknown as NotaResumen[]
}

/**
 * Para `generateStaticParams` y el sitemap.
 *
 * Usa el cliente estático, no el de request: los dos corren en build, donde
 * pedir cookies tira "`cookies` was called outside a request scope".
 */
export async function getSlugsNotas(): Promise<{ slug: string; updated_at: string }[]> {
  const supabase = createStaticClient()
  const { data } = await supabase
    .from('notas')
    .select('slug, updated_at')
    .eq('estado', 'publicada')

  return data ?? []
}

/**
 * Búsqueda full-text. La función vive en `0009_busqueda.sql` y es
 * `SECURITY INVOKER`, así que RLS sigue filtrando los borradores.
 *
 * El tipo de vuelta se declara acá: `rpc()` no lo conoce, y sin esto los
 * resultados entran al componente como `any` y se pierde la regla no
 * negociable 1.
 */
export async function buscarNotas(
  termino: string,
  limite = 20,
): Promise<ResultadoBusqueda[]> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('buscar_notas', { termino, limite })
  return (data ?? []) as unknown as ResultadoBusqueda[]
}

/**
 * Las notas escritas sobre un partido, para su ficha.
 *
 * Es la vuelta del link que la planilla embebida ya hace al revés: desde la
 * crónica se llega al partido, y desde el partido a todo lo que se escribió
 * sobre él —la previa, la crónica y el análisis posterior.
 */
export async function getNotasDePartido(
  partidoId: string,
  limite = 5,
): Promise<NotaResumen[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .eq('partido_id', partidoId)
    .order('publicada_en', { ascending: false })
    .limit(limite)

  return (data ?? []) as unknown as NotaResumen[]
}

// ============================================
// Admin
// ============================================

/**
 * Todas las notas para el listado del panel: borradores, publicadas y
 * archivadas.
 *
 * **Es la única query de notas que no filtra por `estado`**, y por eso lleva el
 * nombre que lleva. Las públicas filtran de más a propósito —RLS ya lo hace,
 * pero leer la query y saber qué devuelve vale más que el renglón ahorrado—;
 * acá el punto es exactamente ver lo que el sitio no muestra.
 *
 * No es un agujero: RLS deja leer borradores sólo a `es_autor()`. La misma
 * llamada hecha por un anónimo devuelve únicamente las publicadas.
 *
 * Ordena por `updated_at` y no por `publicada_en`: en el panel lo que importa
 * es qué tocaste último, y un borrador nunca tiene fecha de publicación.
 */
export async function getNotasDelAdmin(): Promise<NotaResumen[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .order('updated_at', { ascending: false })

  return (data ?? []) as unknown as NotaResumen[]
}

/**
 * Una nota por id, con su cuerpo, para abrirla en el editor.
 *
 * Por id y no por slug: el slug es la URL pública y no se recalcula al
 * renombrar (regla no negociable 8), así que dentro del panel la identidad de
 * la nota es el id y nada más.
 */
export async function getNotaPorId(id: string): Promise<NotaConRelaciones | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_COMPLETOS)
    .eq('id', id)
    .maybeSingle()

  return data as unknown as NotaConRelaciones | null
}

/**
 * Las notas que se pueden anclar desde el cuerpo de otra.
 *
 * **Sólo publicadas.** Anclar un borrador dejaría en el texto un link a una URL
 * que para el lector es un 404: RLS no le muestra borradores a nadie que no sea
 * el autor. El día que ese borrador se publique el link empieza a andar, pero
 * mientras tanto rompe la nota que lo cita.
 *
 * Trae lo mínimo para elegir y armar el href. No pagina: son setenta notas y el
 * selector filtra en el navegador, que con esa cantidad es instantáneo y no
 * pega a la base con cada tecla.
 */
export async function getNotasParaEnlazar(): Promise<
  { id: string; titulo: string; slug: string; categoria: Categoria }[]
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select('id, titulo, slug, categoria')
    .eq('estado', 'publicada')
    .order('publicada_en', { ascending: false })

  return data ?? []
}

/**
 * Una nota por id **sin sesión**, para las funciones de Inngest.
 *
 * Es la misma consulta que `getNotaPorId()` con un cliente distinto, y la
 * diferencia importa. `createClient()` lee las cookies del request: adentro de
 * una función durable no hay usuario, así que la consulta correría como
 * anónima y RLS devolvería sólo lo publicado. Hoy eso alcanzaría —al fan-out
 * sólo le llegan notas publicadas— pero es una coincidencia, no un diseño:
 * bastaría con querer postear una nota programada para que devuelva `null` sin
 * explicar por qué.
 *
 * Usa la service role, que bypassea RLS, y es uno de los dos únicos lugares
 * donde corresponde: procesos de servidor sin usuario (el otro es el script de
 * migración). **Nunca importar esto desde una pantalla del panel**: ahí escribe
 * y lee la sesión del autor.
 */
export async function getNotaParaPostear(id: string): Promise<NotaConRelaciones | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_COMPLETOS)
    .eq('id', id)
    .maybeSingle()

  return data as unknown as NotaConRelaciones | null
}
