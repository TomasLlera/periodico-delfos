/**
 * El alta y la edición de una temporada.
 *
 * La temporada es el eje de todo lo deportivo: el plantel, el fixture, la tabla
 * y las goleadoras cuelgan de ella, y la portada mira la que está marcada como
 * activa. Es la primera fila que hay que cargar en una base vacía.
 *
 * La lógica de la **página** de temporada —pestañas, fixture, balance— vive en
 * `src/lib/temporada.ts`. Acá está sólo lo que decide si una temporada se puede
 * guardar.
 */

import { z } from 'zod'
import { enteroRequerido, slugificar, textoOpcional, textoRequerido } from '@/lib/entidades/campos'
import type { Temporada } from '@/types'

/**
 * El rango de años.
 *
 * El piso es 2015 porque no hay datos más viejos que eso ni los va a haber: el
 * archivo que se migra desde WordPress arranca mucho después. El techo es el
 * año que viene, que es hasta donde se puede programar un campeonato. Fuera de
 * ahí es un error de tipeo, y el lugar de atajarlo es el formulario.
 */
export const ANIO_MINIMO = 2015
export const anioMaximo = (hoy: Date): number => hoy.getFullYear() + 1

export const esquemaTemporada = z.object({
  nombre: textoRequerido('El nombre'),
  slug: textoRequerido('El slug'),
  division: textoRequerido('La división'),
  anio: enteroRequerido('El año', ANIO_MINIMO, 2100),
  zona: textoOpcional,
  activa: z.boolean(),
})

export type EntradaTemporada = z.infer<typeof esquemaTemporada>

/**
 * "Primera B" + 2026 → `primera-b-2026`.
 *
 * Se arma de la división y el año y no del nombre libre porque el nombre suele
 * traer la zona —"Primera B 2026 · Zona B"— y la URL de la temporada no la
 * necesita: la zona es un dato de la fila, no otra temporada.
 */
export function slugDeTemporada(division: string, anio: number): string {
  const base = slugificar(division)
  return base ? `${base}-${anio}` : `${anio}`
}

/** "Primera B 2026". Lo que se ve en el `<select>` de cualquier formulario. */
export function nombreDeTemporada(division: string, anio: number): string {
  return `${division.trim()} ${anio}`.trim()
}

export function entradaDesdeTemporada(temporada: Temporada | null, hoy: Date): EntradaTemporada {
  if (!temporada) {
    return {
      nombre: '',
      slug: '',
      division: '',
      // El año en curso: una temporada se carga cuando arranca, no de archivo.
      anio: hoy.getFullYear(),
      zona: null,
      // Se marca a mano y con el aviso puesto, porque desmarca a la otra.
      activa: false,
    }
  }

  return {
    nombre: temporada.nombre,
    slug: temporada.slug,
    division: temporada.division,
    anio: temporada.anio,
    zona: temporada.zona,
    activa: temporada.activa,
  }
}

/**
 * El aviso de que activar esta temporada desactiva la otra.
 *
 * Mismo caso que el equipo propio: `temporadas_una_activa_idx` deja una sola
 * fila activa, el action desactiva la anterior, y eso toca una fila que no se
 * está editando. La diferencia es que acá se nota enseguida —la portada entera
 * pasa a mostrar la temporada nueva—, así que el aviso dice qué se apaga.
 */
export function avisoDeActiva(
  entrada: Pick<EntradaTemporada, 'activa'>,
  activaDeHoy: Pick<Temporada, 'id' | 'nombre'> | null,
  idEditado: string | null,
): string | null {
  if (!entrada.activa) return null
  if (!activaDeHoy) return null
  if (activaDeHoy.id === idEditado) return null

  return `Al guardar, la portada pasa a mostrar esta temporada y ${activaDeHoy.nombre} deja de estar activa.`
}
