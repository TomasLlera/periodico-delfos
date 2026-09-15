/**
 * El saneado del término de búsqueda. Puro: `?q=` es entrada de usuario.
 */

/**
 * Menos de dos caracteres no es una búsqueda: `websearch_to_tsquery` con una
 * sola letra devuelve media base y la página tarda en dibujar lo que nadie
 * pidió.
 */
export const LARGO_MINIMO = 2

/** Más que esto no es una búsqueda, es un pegado accidental. */
const LARGO_MAXIMO = 100

export type TerminoBuscado =
  | { estado: 'vacio' }
  | { estado: 'corto' }
  | { estado: 'listo'; termino: string }

export function terminoBuscado(valor: string | string[] | undefined): TerminoBuscado {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  // Los espacios de más vienen de pegar texto, y colapsarlos evita que
  // "Aldosivi   Morón" no encuentre lo mismo que "Aldosivi Morón".
  const termino = (crudo ?? '').trim().replace(/\s+/g, ' ').slice(0, LARGO_MAXIMO)

  if (termino.length === 0) return { estado: 'vacio' }
  if (termino.length < LARGO_MINIMO) return { estado: 'corto' }
  return { estado: 'listo', termino }
}
