/**
 * El alta y la edición de una jugadora.
 *
 * La ficha es la de la persona, no la de la temporada: acá van el nombre, el
 * puesto natural, la foto y la bio. **El dorsal no está** —vive en `plantel`,
 * porque cambia de un año a otro—, y esa es la única decisión de este
 * formulario que hay que entender antes de usarlo.
 *
 * La lógica de la **página** de jugadora —edad, totales, goles ordenados— vive
 * en `src/lib/jugadora.ts`.
 */

import { z } from 'zod'
import {
  fechaOpcional,
  slugificar,
  textoOpcional,
  textoRequerido,
} from '@/lib/entidades/campos'
import type { Jugadora, Posicion } from '@/types'

const POSICIONES = [
  'arquera',
  'defensora',
  'mediocampista',
  'delantera',
  'dt',
  'ayudante',
] as const satisfies readonly Posicion[]

export const esquemaJugadora = z.object({
  nombre: textoRequerido('El nombre'),
  apellido: textoRequerido('El apellido'),
  slug: textoRequerido('El slug'),
  posicion: z.enum(POSICIONES),
  fecha_nacimiento: fechaOpcional,
  foto_url: textoOpcional,
  lugar_origen: textoOpcional,
  bio: textoOpcional,
  activa: z.boolean(),
})

export type EntradaJugadora = z.infer<typeof esquemaJugadora>

/** "Lucía Cortadi" → `lucia-cortadi`. Es la URL de `/jugadora/[slug]`. */
export function slugDeJugadora(nombre: string, apellido: string): string {
  return slugificar(`${nombre} ${apellido}`)
}

export function entradaDesdeJugadora(jugadora: Jugadora | null): EntradaJugadora {
  if (!jugadora) {
    return {
      nombre: '',
      apellido: '',
      slug: '',
      // Ninguna posición es "la más común" de verdad, pero el formulario
      // necesita arrancar en algo y el arco es el único puesto único del
      // equipo: si queda sin cambiar por error, se nota.
      posicion: 'arquera',
      fecha_nacimiento: null,
      foto_url: null,
      lugar_origen: null,
      bio: null,
      // Se carga porque está jugando; dar de baja es el caso raro.
      activa: true,
    }
  }

  return {
    nombre: jugadora.nombre,
    apellido: jugadora.apellido,
    slug: jugadora.slug,
    posicion: jugadora.posicion,
    fecha_nacimiento: jugadora.fecha_nacimiento,
    foto_url: jugadora.foto_url,
    lugar_origen: jugadora.lugar_origen,
    bio: jugadora.bio,
    activa: jugadora.activa,
  }
}

/**
 * Dar de baja no borra.
 *
 * Una jugadora que se fue del club sigue teniendo goles, tarjetas y partidos en
 * la base, y `eventos.jugadora_id` los referencia: borrarla dejaría la planilla
 * de la fecha 4 con un hueco donde había un gol. `activa = false` la saca del
 * plantel de este año y la deja en el archivo, que es lo que corresponde.
 */
export const POR_QUE_NO_SE_BORRA =
  'Las jugadoras no se borran: se marcan como inactivas. Sus goles y tarjetas quedan en las planillas de los partidos que jugó.'

/**
 * Cómo se nombra en una lista del panel: "Cortadi, Lucía".
 *
 * Apellido primero, al revés que en el sitio público. En una lista de treinta
 * nombres lo que se busca con el dedo es el apellido, y tenerlo alineado a la
 * izquierda es la diferencia entre encontrarlo y leer los treinta.
 */
export function nombreDeLista(
  jugadora: Pick<Jugadora, 'nombre' | 'apellido'>,
): string {
  return `${jugadora.apellido}, ${jugadora.nombre}`
}
