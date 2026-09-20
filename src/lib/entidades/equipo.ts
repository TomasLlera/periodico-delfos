/**
 * El alta y la edición de un equipo, sin React y sin Supabase.
 *
 * Un equipo es la entidad más chica del modelo y la que más lejos llega: el
 * escudo y el `nombre_corto` que se cargan acá aparecen en la planilla, en el
 * fixture, en la barra de estado de la portada y en el copy que sale a las
 * redes. Por eso `nombre_corto` es obligatorio aunque la base lo permita vacío
 * —no lo permite, es `not null`— y por eso vale la pena escribirlo bien una vez.
 */

import { z } from 'zod'
import { slugificar, textoOpcional, textoRequerido } from '@/lib/entidades/campos'
import type { Equipo } from '@/types'

export const esquemaEquipo = z.object({
  nombre: textoRequerido('El nombre'),
  nombre_corto: textoRequerido('El nombre corto'),
  apodo: textoOpcional,
  slug: textoRequerido('El slug'),
  escudo_url: textoOpcional,
  ciudad: textoOpcional,
  es_aldosivi: z.boolean(),
})

export type EntradaEquipo = z.infer<typeof esquemaEquipo>

/**
 * El slug sale del **nombre corto**, no del nombre completo.
 *
 * "Club Atlético Aldosivi" da `club-atletico-aldosivi`, que nadie escribe ni
 * reconoce; "Aldosivi" da `aldosivi`, que es lo que va a aparecer en
 * `/partido/fecha-4-aldosivi-claypole`. El nombre largo se usa una sola vez, en
 * la ficha; el corto se usa en todas partes.
 */
export function slugDeEquipo(nombreCorto: string): string {
  return slugificar(nombreCorto)
}

export function entradaDesdeEquipo(equipo: Equipo | null): EntradaEquipo {
  if (!equipo) {
    return {
      nombre: '',
      nombre_corto: '',
      apodo: null,
      slug: '',
      escudo_url: null,
      ciudad: null,
      // El rival es el caso normal: de veinte equipos cargados, uno solo es el
      // nuestro y ya está cargado desde el `seed.sql`.
      es_aldosivi: false,
    }
  }

  return {
    nombre: equipo.nombre,
    nombre_corto: equipo.nombre_corto,
    apodo: equipo.apodo,
    slug: equipo.slug,
    escudo_url: equipo.escudo_url,
    ciudad: equipo.ciudad,
    es_aldosivi: equipo.es_aldosivi,
  }
}

/**
 * El aviso de que marcar este equipo como propio le saca la marca al otro.
 *
 * `equipos_un_aldosivi_idx` deja una sola fila con `es_aldosivi`, así que el
 * action desmarca al anterior antes de guardar. Eso es lo correcto —las vistas
 * de goleadoras y estadísticas filtran por ese campo y dos filas romperían los
 * conteos— pero es un efecto a distancia sobre una fila que **no se está
 * editando**, y esas cosas se avisan antes, no después.
 *
 * Por eso lo que se compara es contra el equipo que tiene la marca hoy, y no
 * contra el que se está editando: un equipo nuevo marcado como propio también
 * le saca la marca a Aldosivi, y ese es justo el caso en que el aviso importa.
 */
export function avisoDeAldosivi(
  entrada: Pick<EntradaEquipo, 'es_aldosivi'>,
  aldosiviDeHoy: Pick<Equipo, 'id' | 'nombre_corto'> | null,
  idEditado: string | null,
): string | null {
  if (!entrada.es_aldosivi) return null
  if (!aldosiviDeHoy) return null
  if (aldosiviDeHoy.id === idEditado) return null

  return `Al guardar, este pasa a ser el equipo propio y ${aldosiviDeHoy.nombre_corto} deja de serlo.`
}
