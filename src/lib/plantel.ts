/**
 * El plantel agrupado por puesto. Lógica pura: sin JSX y sin base.
 *
 * Las constantes de puesto vivían en `queries/jugadoras.ts`, que importa el
 * cliente de Supabase y con él `next/headers`: cualquier test que las tocara
 * arrastraba medio Next. Acá se pueden testear solas, que es lo que se hace en
 * `plantel.test.ts`.
 */

import type { JugadoraEnPlantel, Posicion } from '@/types'

/**
 * Los grupos del plantel, en el orden en que se dibujan. **No es alfabético a
 * propósito**: es el orden de una formación, del arco hacia adelante, que es
 * como se lee un plantel en cualquier programa de partido.
 *
 * `dt` y `ayudante` caen en el mismo grupo: el cuerpo técnico se lista junto,
 * y separarlo en dos bloques de una persona cada uno es ruido.
 */
export const GRUPOS_PLANTEL: readonly {
  clave: string
  titulo: string
  posiciones: readonly Posicion[]
}[] = [
  { clave: 'arqueras', titulo: 'Arqueras', posiciones: ['arquera'] },
  { clave: 'defensoras', titulo: 'Defensoras', posiciones: ['defensora'] },
  { clave: 'mediocampistas', titulo: 'Mediocampistas', posiciones: ['mediocampista'] },
  { clave: 'delanteras', titulo: 'Delanteras', posiciones: ['delantera'] },
  { clave: 'cuerpo-tecnico', titulo: 'Cuerpo técnico', posiciones: ['dt', 'ayudante'] },
]

/** El puesto de una sola jugadora, en singular. Para su ficha. */
export const NOMBRE_PUESTO: Record<Posicion, string> = {
  arquera: 'Arquera',
  defensora: 'Defensora',
  mediocampista: 'Mediocampista',
  delantera: 'Delantera',
  dt: 'Directora técnica',
  ayudante: 'Ayudante de campo',
}

export interface GrupoPlantel {
  clave: string
  titulo: string
  jugadoras: JugadoraEnPlantel[]
}

/**
 * El puesto que vale para una jugadora en una temporada.
 *
 * **La posición del plantel le gana a la de la ficha**: una defensora puede
 * jugar de mediocampista una temporada entera, y el plantel de ese año tiene
 * que mostrarla donde jugó. `posicion_temporada` es nullable, y ahí cae de
 * vuelta a la de la ficha.
 */
export function puestoEnTemporada(jugadora: JugadoraEnPlantel): Posicion {
  return jugadora.posicion_temporada ?? jugadora.posicion
}

/**
 * Agrupa el plantel por puesto.
 *
 * Los grupos vacíos no salen: un plantel sin arqueras cargadas todavía no
 * necesita un título "Arqueras" con nada abajo.
 */
export function agruparPorPuesto(
  plantel: readonly JugadoraEnPlantel[],
): GrupoPlantel[] {
  return GRUPOS_PLANTEL.map((grupo) => ({
    clave: grupo.clave,
    titulo: grupo.titulo,
    jugadoras: ordenarPlantel(
      plantel.filter((jugadora) => grupo.posiciones.includes(puestoEnTemporada(jugadora))),
    ),
  })).filter((grupo) => grupo.jugadoras.length > 0)
}

/**
 * Por dorsal, y las que no tienen al final.
 *
 * Un `null` ordenado como número se va al principio y deja el plantel
 * arrancando con las jugadoras sin número, que es justo al revés de lo que
 * espera cualquiera que mire una lista de dorsales. Es el mismo criterio que
 * `ordenarFormaciones()` en `partido.ts`.
 */
export function ordenarPlantel(
  jugadoras: readonly JugadoraEnPlantel[],
): JugadoraEnPlantel[] {
  return [...jugadoras].sort((a, b) => {
    const da = a.dorsal ?? Number.MAX_SAFE_INTEGER
    const db = b.dorsal ?? Number.MAX_SAFE_INTEGER
    return da - db || a.apellido.localeCompare(b.apellido, 'es')
  })
}

/** "Lucía Cortadi". Se usa en la ficha, el alt de la foto y el `<title>`. */
export function nombreCompleto(
  jugadora: Pick<JugadoraEnPlantel, 'nombre' | 'apellido'>,
): string {
  return `${jugadora.nombre} ${jugadora.apellido}`.trim()
}

/**
 * Las iniciales, para cuando no hay foto. "Lucía Cortadi" → "LC".
 *
 * Mismo criterio que el respaldo del escudo en `<EscudoEquipo />`: un hueco
 * gris sin nada adentro parece una imagen rota.
 */
export function iniciales(
  jugadora: Pick<JugadoraEnPlantel, 'nombre' | 'apellido'>,
): string {
  const letras = [jugadora.nombre, jugadora.apellido]
    .map((parte) => parte.trim()[0] ?? '')
    .join('')
  return letras.toUpperCase() || '?'
}
