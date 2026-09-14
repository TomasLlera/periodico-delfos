import { createClient, createStaticClient } from '@/lib/supabase/server'
import type { Categoria, NotaConRelaciones, NotaResumen } from '@/types'

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
 * Relacionadas de la MISMA temporada.
 *
 * Hoy el sitio muestra partidos de la Primera C 2024 como contexto de una nota
 * de 2026. Si la nota no tiene temporada, es mejor no mostrar nada que mostrar
 * cualquier cosa.
 */
export async function getNotasRelacionadas(
  nota: Pick<NotaConRelaciones, 'id' | 'temporada_id' | 'categoria'>,
  limite = 3,
): Promise<NotaResumen[]> {
  if (!nota.temporada_id) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('notas')
    .select(CAMPOS_RESUMEN)
    .eq('estado', 'publicada')
    .eq('temporada_id', nota.temporada_id)
    .neq('id', nota.id)
    .order('publicada_en', { ascending: false })
    .limit(limite)

  return (data ?? []) as unknown as NotaResumen[]
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

export async function buscarNotas(termino: string, limite = 20) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('buscar_notas', { termino, limite })
  return data ?? []
}
