/**
 * Quiénes juegan un partido, como estado de una pantalla.
 *
 * La formación es lo que hace que la planilla de carga funcione: `enCancha()`
 * arranca de las titulares, y un partido sin formación abre la planilla con la
 * grilla vacía. Esta es la lógica que decide qué se ve y qué se guarda, sin
 * React y sin base.
 */

import type { FormacionConJugadora, JugadoraEnPlantel, Posicion } from '@/types'

/** Los tres lugares posibles de una jugadora en un partido. */
export type Convocatoria = 'titular' | 'suplente' | 'fuera'

export interface FilaConvocatoria {
  jugadora_id: string
  apellido: string
  nombre: string
  dorsal: number | null
  posicion: Posicion | null
  convocatoria: Convocatoria
  /** `true` si está en la formación pero ya no en el plantel de la temporada. */
  fueraDelPlantel: boolean
}

/** Once en cancha. Es lo que cuenta la pantalla para avisar si falta alguna. */
export const TITULARES_ESPERADAS = 11

/**
 * La lista con la que abre la pantalla: el plantel de la temporada, más lo que
 * ya estuviera guardado en la formación del partido.
 *
 * Los dos lados hacen falta. El plantel es el universo de quién puede jugar,
 * pero la formación guardada puede tener a alguien que ya no está en el
 * plantel —una jugadora que se fue a mitad de año, o un partido cargado por
 * SQL antes de que existiera esta pantalla—, y esconderla borraría de la
 * planilla a quien de hecho jugó. Esas aparecen marcadas.
 *
 * El dorsal y la posición salen de la formación si ya está guardada, y del
 * plantel si no: lo que jugó ese día le gana a lo que dice la temporada.
 */
export function filasDeConvocatoria(
  plantel: readonly JugadoraEnPlantel[],
  formacion: readonly FormacionConJugadora[],
): FilaConvocatoria[] {
  const guardadas = new Map(formacion.map((f) => [f.jugadora_id, f]))

  const delPlantel: FilaConvocatoria[] = plantel.map((j) => {
    const guardada = guardadas.get(j.id)
    return {
      jugadora_id: j.id,
      apellido: j.apellido,
      nombre: j.nombre,
      dorsal: guardada?.dorsal ?? j.dorsal,
      posicion: guardada?.posicion ?? j.posicion_temporada ?? j.posicion,
      convocatoria: guardada ? (guardada.es_titular ? 'titular' : 'suplente') : 'fuera',
      fueraDelPlantel: false,
    }
  })

  const enPlantel = new Set(plantel.map((j) => j.id))
  const sueltas: FilaConvocatoria[] = formacion
    .filter((f) => !enPlantel.has(f.jugadora_id))
    .map((f) => ({
      jugadora_id: f.jugadora_id,
      apellido: f.jugadora.apellido,
      nombre: f.jugadora.nombre,
      dorsal: f.dorsal,
      posicion: f.posicion,
      convocatoria: f.es_titular ? 'titular' : 'suplente',
      fueraDelPlantel: true,
    }))

  return [...delPlantel, ...sueltas].sort((a, b) => {
    // Las convocadas arriba: son las que se tocan. El resto, por apellido.
    const pesoA = a.convocatoria === 'fuera' ? 1 : 0
    const pesoB = b.convocatoria === 'fuera' ? 1 : 0
    return pesoA - pesoB || a.apellido.localeCompare(b.apellido, 'es')
  })
}

/** Lo que va a la base: las convocadas, con su dorsal y su puesto de ese día. */
export function filasParaGuardar(filas: readonly FilaConvocatoria[]) {
  return filas
    .filter((f) => f.convocatoria !== 'fuera')
    .map((f) => ({
      jugadora_id: f.jugadora_id,
      es_titular: f.convocatoria === 'titular',
      dorsal: f.dorsal,
      posicion: f.posicion,
    }))
}

export function contar(filas: readonly FilaConvocatoria[], cual: Convocatoria): number {
  return filas.filter((f) => f.convocatoria === cual).length
}

/**
 * Lo que está raro en la formación, sin bloquear el guardado.
 *
 * Un equipo puede terminar con diez por una expulsión, y una formación se
 * guarda a medias mientras se arma. Lo que no puede pasar es que esté mal y
 * nadie lo diga: la planilla va a dibujar la grilla con esto, y una titular de
 * menos es un gol que después no se le puede cargar a nadie.
 */
export function avisosDeFormacion(filas: readonly FilaConvocatoria[]): string[] {
  const avisos: string[] = []
  const titulares = contar(filas, 'titular')

  if (titulares !== TITULARES_ESPERADAS) {
    avisos.push(
      titulares === 0
        ? 'Todavía no hay titulares: la planilla va a abrir con la grilla vacía.'
        : `Hay ${titulares} titulares y lo normal son ${TITULARES_ESPERADAS}.`,
    )
  }

  const sinDorsal = filas.filter((f) => f.convocatoria !== 'fuera' && f.dorsal === null)
  if (sinDorsal.length > 0) {
    avisos.push(
      `${sinDorsal.length} convocada${sinDorsal.length > 1 ? 's' : ''} sin dorsal: se carga en el plantel de la temporada.`,
    )
  }

  return avisos
}
