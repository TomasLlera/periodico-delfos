import type { UsoCrudo } from '@/lib/dorsales'
import { exigir } from '@/lib/supabase/exigir'
import { createClient } from '@/lib/supabase/server'

/**
 * Las convocatorias de Aldosivi en un campeonato, con el número de cada una.
 *
 * Es el dato crudo de `/dorsales/[temporadaSlug]`: una fila por jugadora y por
 * partido. Agruparlo y contarlo es `dorsalesPorJugadora()`, en `lib/dorsales.ts`.
 *
 * **Se cuenta desde `formaciones` y no desde `plantel`**, que es lo que
 * habilitó la `0020`: el dorsal pasó a ser el de cada partido. Estar en el
 * plantel no dice con qué número salió a la cancha —ni si salió—, y la
 * pregunta de Carlos es exactamente ésa.
 *
 * **Filtra por el equipo propio y no por las jugadoras del plantel.** Desde la
 * `0020` la formación de un partido incluye a los dos equipos, así que sin
 * filtro entrarían las rivales. Se filtra por `es_aldosivi` —el mismo pivote
 * con el que el sitio entero decide qué es "nosotros"— y no por una lista de
 * ids, porque el día que el medio cubra un segundo equipo esto se convierte en
 * un parámetro y no en una reescritura.
 */
export async function getDorsalesDeTemporada(temporadaId: string): Promise<UsoCrudo[]> {
  const supabase = await createClient()

  const { data: aldosivi } = exigir(await supabase
    .from('equipos')
    .select('id')
    .eq('es_aldosivi', true)
    .maybeSingle(), 'getDorsalesDeTemporada/equipo')

  // Base recién creada, antes del `seed.sql`: no hay equipo propio y por lo
  // tanto no hay dorsales que mostrar.
  if (!aldosivi) return []

  const { data } = exigir(await supabase
    .from('formaciones')
    .select('dorsal, jugadora:jugadoras!inner(id, nombre, apellido, slug), partido:partidos!inner(temporada_id)')
    .eq('partido.temporada_id', temporadaId)
    .eq('equipo_id', aldosivi.id), 'getDorsalesDeTemporada')

  type Fila = {
    dorsal: number | null
    jugadora: { id: string; nombre: string; apellido: string; slug: string }
  }

  return ((data ?? []) as unknown as Fila[]).map((fila) => ({
    jugadora_id: fila.jugadora.id,
    nombre: fila.jugadora.nombre,
    apellido: fila.jugadora.apellido,
    slug: fila.jugadora.slug,
    dorsal: fila.dorsal,
  }))
}

/**
 * Cuántos partidos de la temporada tienen formación cargada.
 *
 * Es el denominador que vuelve legible el resto: "el 10 en 5 partidos" no dice
 * lo mismo si la temporada lleva 6 fechas que si lleva 30. Y cuando da cero,
 * es la diferencia entre "todavía no se cargó ninguna planilla" y "el equipo
 * no usó números", que son dos cosas muy distintas de explicarle al lector.
 */
export async function getPartidosConFormacion(temporadaId: string): Promise<number> {
  const supabase = await createClient()

  const { data } = exigir(await supabase
    .from('formaciones')
    .select('partido_id, partido:partidos!inner(temporada_id)')
    .eq('partido.temporada_id', temporadaId), 'getPartidosConFormacion')

  type Fila = { partido_id: string }

  return new Set(((data ?? []) as unknown as Fila[]).map((f) => f.partido_id)).size
}
