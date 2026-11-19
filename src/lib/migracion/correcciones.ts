/**
 * Títulos de WordPress que dicen mal el campeonato.
 *
 * La temporada de una nota migrada sale del sufijo de su título
 * (`limpiarTitulo()`), que es el único lugar donde WordPress la guardaba. Eso
 * funciona mientras el título esté bien escrito, y hay uno que no lo está:
 *
 *     Tiburonas 7-0 Laferrere: Semifinales – Aldosivi Femenino en la Primera B 2023
 *
 * El cuerpo de esa misma nota dice "Primera C 2023 – Torneo Apertura", y los
 * cuartos de final del mismo torneo —el 1-0 a Quilmes— también son Primera C
 * 2023. En 2023 las Tiburonas jugaban la Primera C: el ascenso a la B llegó
 * con el título de 2024. El "Primera B" del título es un error de tipeo.
 *
 * **Por qué esto vive en el repo y no se arregla en la base.** Un `update` a
 * `notas.temporada_id` dura hasta la próxima corrida: el script deduce la
 * temporada del título, no la encuentra, y la deja en `null` otra vez. La
 * corrección tiene que estar donde se deduce, o no es una corrección sino un
 * parche que se pisa solo.
 *
 * **No se corrige a ojo.** Cada entrada necesita que el cuerpo de la nota, u
 * otra nota del mismo torneo, diga explícitamente cuál es el campeonato. Si el
 * título está mal y no hay con qué contrastarlo, la nota queda sin temporada y
 * la asigna una persona desde el panel.
 */

import type { ReferenciaTemporada } from '@/lib/migracion/tipos'

/** Slug de la nota → slug de la temporada que corresponde de verdad. */
export const CORRECCIONES_DE_TEMPORADA: Readonly<Record<string, string>> = {
  'tiburonas-7-0-laferrere-semifinales-aldosivi-femenino-en-la-primera-b-2023':
    'primera-c-2023',
}

/** "primera-c-2023" → la referencia completa. El formato es el de `titulo.ts`. */
function referenciaDesdeSlug(slug: string): ReferenciaTemporada | null {
  const partes = /^primera-([a-z])-(\d{4})$/.exec(slug)
  if (!partes) return null

  const letra = (partes[1] ?? '').toUpperCase()
  const anio = Number(partes[2])
  const division = `Primera ${letra}`

  return { nombre: `${division} ${anio}`, slug, division, anio }
}

/**
 * La temporada de una nota, con la corrección aplicada si tiene una.
 *
 * Devuelve la detectada cuando no hay nada que corregir, así que se puede
 * llamar siempre.
 */
export function temporadaCorregida(
  slugDeLaNota: string,
  detectada: ReferenciaTemporada | null,
  correcciones: Readonly<Record<string, string>> = CORRECCIONES_DE_TEMPORADA,
): ReferenciaTemporada | null {
  const slug = correcciones[slugDeLaNota]
  if (slug === undefined) return detectada

  return referenciaDesdeSlug(slug) ?? detectada
}
