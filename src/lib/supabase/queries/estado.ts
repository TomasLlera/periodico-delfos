import { cache } from 'react'
import { createStaticClient, haySupabase } from '@/lib/supabase/server'
import { estadoTemporada, filaDeAldosivi } from '@/lib/temporada'
import type {
  FilaTablaConEquipo,
  Goleadora,
  PartidoConEquipos,
  Temporada,
} from '@/types'

/**
 * El estado deportivo de la temporada activa: lo que `<BarraEstado />` necesita
 * en el layout raíz —la barra va en todas las páginas del sitio (blueprint 7.2,
 * "fija arriba, siempre visible")— y lo que la portada usa para `<FechaAFecha />`
 * y `<Goleadoras />`, que son los puntos 4 y 5 del mismo 7.2.
 *
 * **Lee con `createStaticClient()` y no con `createClient()`.** No es un
 * detalle: `createClient()` pide las cookies, y una sola lectura con cookies
 * desde el layout raíz vuelve dinámicas **todas** las rutas del sitio, ISR
 * incluido. La barra no necesita sesión —muestra lo mismo para cualquiera— así
 * que el cliente anónimo es además el correcto.
 *
 * **Nunca tira.** Está en el layout raíz: si esto explota, no se cae una
 * página, se cae el sitio entero. Sin base, sin temporada activa o con la query
 * rota, devuelve todo en `null` y la barra no se dibuja.
 */
export interface EstadoDelSitio {
  temporada: Temporada | null
  ultimo: PartidoConEquipos | null
  proximo: PartidoConEquipos | null
  posicion: FilaTablaConEquipo | null
  /** El fixture entero: la franja de la portada se queda con una ventana. */
  fixture: PartidoConEquipos[]
  goleadoras: Goleadora[]
}

const VACIO: EstadoDelSitio = {
  temporada: null,
  ultimo: null,
  proximo: null,
  posicion: null,
  fixture: [],
  goleadoras: [],
}

/**
 * El widget de la portada es "top 5" (blueprint 7.2, punto 5). El corte lo
 * repite `<Goleadoras />`, que es lo que lo define; acá es para no traer una
 * tabla de treinta filas por una lista de cinco.
 */
const TOP_GOLEADORAS = 5

/**
 * `partidos` tiene dos foreign keys a `equipos`: PostgREST necesita el nombre
 * del constraint para saber cuál es cuál (igual que en `queries/partidos.ts`).
 */
const CAMPOS_PARTIDO = `
  *,
  equipo_local:equipos!partidos_equipo_local_id_fkey(*),
  equipo_visitante:equipos!partidos_equipo_visitante_id_fkey(*),
  temporada:temporadas(*)
`

async function leerEstadoDelSitio(): Promise<EstadoDelSitio> {
  if (!haySupabase()) return VACIO

  try {
    const supabase = createStaticClient()

    const { data: temporada } = await supabase
      .from('temporadas')
      .select('*')
      .eq('activa', true)
      .maybeSingle<Temporada>()

    if (!temporada) return VACIO

    // El fixture entero y no dos queries de "último" y "próximo": son una
    // docena de filas, y así el último y el próximo salen de `estadoTemporada()`
    // —la misma función que usa `/temporada/[slug]`, con sus tests—. Con dos
    // queries aparte, la barra y el fixture podrían contradecirse.
    const [partidos, tabla, goleadoras] = await Promise.all([
      supabase
        .from('partidos')
        .select(CAMPOS_PARTIDO)
        .eq('temporada_id', temporada.id)
        .order('fecha_hora', { ascending: true }),
      ultimaTabla(supabase, temporada.id),
      supabase
        .from('goleadoras')
        .select('*')
        .eq('temporada_id', temporada.id)
        .order('goles', { ascending: false })
        .limit(TOP_GOLEADORAS),
    ])

    const fixture = (partidos.data ?? []) as unknown as PartidoConEquipos[]
    const { ultimo, proximo } = estadoTemporada(fixture)

    return {
      temporada,
      ultimo,
      proximo,
      posicion: filaDeAldosivi(tabla),
      fixture,
      goleadoras: goleadoras.data ?? [],
    }
  } catch {
    return VACIO
  }
}

/**
 * **Memoizada por request con `cache()` de React.** El layout raíz la llama
 * para `<BarraEstado />` y la portada para la franja y las goleadoras, y las
 * dos cosas pasan en el mismo render: sin esto, cada visita a `/` leería el
 * fixture dos veces. Cualquier otra página paga una sola lectura, la del
 * layout, como antes.
 */
export const getEstadoDelSitio = cache(leerEstadoDelSitio)

/** La fila de cada equipo en la última fecha cargada de la tabla. */
async function ultimaTabla(
  supabase: ReturnType<typeof createStaticClient>,
  temporadaId: string,
): Promise<FilaTablaConEquipo[]> {
  const { data: ultima } = await supabase
    .from('tabla_posiciones')
    .select('fecha_numero')
    .eq('temporada_id', temporadaId)
    .order('fecha_numero', { ascending: false })
    .limit(1)
    .maybeSingle<{ fecha_numero: number }>()

  if (!ultima) return []

  const { data } = await supabase
    .from('tabla_posiciones')
    .select('*, equipo:equipos(*)')
    .eq('temporada_id', temporadaId)
    .eq('fecha_numero', ultima.fecha_numero)
    .order('posicion', { ascending: true })

  return (data ?? []) as unknown as FilaTablaConEquipo[]
}
