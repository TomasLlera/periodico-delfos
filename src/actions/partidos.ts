'use server'

import { errorDeBase, type ResultadoEntidad } from '@/lib/entidades/campos'
import { esquemaPartido, filaDePartido } from '@/lib/entidades/partido'
import { revalidarPartidos } from '@/lib/revalidar'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Alta y edición de la **ficha** de un partido: cuándo, contra quién, dónde y
 * el resultado. Los goles uno por uno son la planilla, en `eventos.ts`.
 *
 * El resultado que se escribe acá es una declaración, no la cuenta de los
 * goles: la planilla la verifica con `chequearMarcador()` y avisa cuando no
 * coinciden, sin corregir ninguno de los dos. Es la regla no negociable 2
 * aplicada al panel — el dato fino vive en `eventos`, y esta pantalla es la
 * que crea la fila de la que cuelgan.
 */
export async function guardarPartido(
  datos: unknown,
  id: string | null,
): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const parseo = esquemaPartido.safeParse(datos)
  if (!parseo.success) {
    return { error: 'Faltan datos', motivos: parseo.error.issues.map((i) => i.message) }
  }

  const fila = filaDePartido(parseo.data)
  if (!fila) return { error: 'La fecha y la hora no son válidas' }

  const supabase = await createClient()

  const { data, error } = id
    ? await supabase.from('partidos').update(fila).eq('id', id).select('id, slug').single()
    : await supabase.from('partidos').insert(fila).select('id, slug').single()

  if (error) {
    // Dos únicos distintos pueden saltar acá: el slug y
    // `partidos_fecha_unica_idx`, que no deja dos partidos en la misma fecha
    // del mismo campeonato. El segundo es el que pasa de verdad cuando se
    // carga el fixture de corrido y se repite un número.
    return {
      error: errorDeBase(
        error,
        'Ya hay un partido con ese slug, o ya existe esa fecha en esta temporada',
      ),
    }
  }

  revalidarPartidos(data.slug)

  return { id: data.id }
}

/**
 * Borra un partido, pero **sólo si todavía no tiene nada cargado**.
 *
 * `eventos` y `formaciones` son `on delete cascade`: borrar un partido con la
 * planilla cargada se lleva los goles, las tarjetas y quiénes jugaron, en
 * silencio y sin vuelta atrás. Por eso se chequea antes y se niega diciendo
 * cuánto se llevaría puesto.
 *
 * El caso que este borrado sí resuelve es el real: el partido cargado con el
 * rival equivocado hace treinta segundos, antes de tocar la planilla. Para
 * cualquier otro, editar la ficha alcanza.
 */
export async function borrarPartido(id: string): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const supabase = await createClient()

  const [{ count: eventos }, { count: formaciones }] = await Promise.all([
    supabase.from('eventos').select('*', { count: 'exact', head: true }).eq('partido_id', id),
    supabase.from('formaciones').select('*', { count: 'exact', head: true }).eq('partido_id', id),
  ])

  if ((eventos ?? 0) > 0 || (formaciones ?? 0) > 0) {
    const cargado = [
      (eventos ?? 0) > 0 ? eventos + ' eventos' : null,
      (formaciones ?? 0) > 0 ? formaciones + ' jugadoras en la formación' : null,
    ]
      .filter(Boolean)
      .join(' y ')

    return {
      error:
        'Este partido ya tiene ' +
        cargado +
        '. Borrarlo los borraría también: si el partido no se jugó, marcalo como suspendido.',
    }
  }

  const { error } = await supabase.from('partidos').delete().eq('id', id)

  if (error) {
    return {
      error:
        error.code === '23503'
          ? 'No se puede borrar: hay una nota enlazada a este partido'
          : 'No se pudo borrar el partido',
    }
  }

  revalidarPartidos()

  return { id }
}
