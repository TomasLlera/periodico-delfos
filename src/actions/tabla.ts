'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaFilaTabla } from '@/lib/entidades/tabla'
import { revalidarTabla } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * La tabla de posiciones: la única carga manual de datos deportivos del
 * proyecto, y por qué (blueprint § 4.4).
 *
 * No se calcula desde `partidos` porque el medio cubre a Aldosivi y no al
 * campeonato entero: para calcularla habría que cargar los partidos de los
 * otros diez equipos, que es más trabajo del que ahorra. La excepción está
 * acotada a esta tabla y nunca llega al texto de una nota.
 *
 * Se guarda **la fecha entera de una vez** y no fila por fila. Es lo que pasa
 * de verdad —se copia la tabla publicada el lunes, once filas juntas— y es lo
 * único que deja chequear que no falte un equipo ni se repita un puesto antes
 * de escribir nada.
 */
export async function guardarTabla(
  temporadaId: string,
  fechaNumero: number,
  filas: readonly unknown[],
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseadas = []
  const motivos: string[] = []

  for (const [indice, fila] of filas.entries()) {
    const parseo = esquemaFilaTabla.safeParse(fila)
    if (parseo.success) {
      parseadas.push(parseo.data)
      continue
    }

    // El número de fila importa: "los puntos no cuadran" sin decir en cuál de
    // las once obliga a revisarlas todas.
    for (const issue of parseo.error.issues) {
      motivos.push('Fila ' + (indice + 1) + ': ' + issue.message)
    }
  }

  if (motivos.length > 0) return { error: 'La tabla no cierra', motivos }

  const supabase = await createClient()

  // La fecha se reemplaza entera: es una foto del campeonato a esa altura, y
  // corregir un dato es volver a cargar la foto, no parchear una fila.
  const { error: errorBorrado } = await supabase
    .from('tabla_posiciones')
    .delete()
    .eq('temporada_id', temporadaId)
    .eq('fecha_numero', fechaNumero)

  if (errorBorrado) return { error: 'No se pudo guardar la tabla' }

  if (parseadas.length > 0) {
    const { error } = await supabase.from('tabla_posiciones').insert(parseadas)

    if (error) {
      return {
        error: errorDeBase(
          error,
          'Hay dos equipos en el mismo puesto, o un equipo cargado dos veces',
        ),
      }
    }
  }

  revalidarTabla()

  return { id: temporadaId }
}

/** Borra una fecha entera de la tabla. Se carga y se descarga igual: completa. */
export async function borrarFechaDeTabla(
  temporadaId: string,
  fechaNumero: number,
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tabla_posiciones')
    .delete()
    .eq('temporada_id', temporadaId)
    .eq('fecha_numero', fechaNumero)

  if (error) return { error: 'No se pudo borrar la fecha' }

  revalidarTabla()

  return { id: temporadaId }
}
