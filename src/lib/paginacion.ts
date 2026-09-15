/**
 * La aritmética de los listados paginados. Pura y sin I/O, como el resto de
 * `lib/`: la página que se pide llega del querystring, que es entrada de
 * usuario y puede ser cualquier cosa.
 */

/** 12 entra en una grilla de 3 columnas sin dejar una fila coja. */
export const POR_PAGINA = 12

/**
 * Lee `?pagina=` y devuelve un entero mayor o igual a 1.
 *
 * Se valida con una expresión y no con `Number()`: `Number('1e3')` es 1000 y
 * `Number(' 2 ')` es 2, y ninguna de las dos es una página que alguien haya
 * escrito. Todo lo que no sea una cadena de dígitos vuelve a 1.
 */
export function paginaPedida(valor: string | string[] | undefined): number {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  if (!crudo || !/^\d+$/.test(crudo)) return 1

  const numero = Number(crudo)
  return numero < 1 ? 1 : numero
}

/**
 * Cuántas páginas hay. Nunca menos de una: un listado vacío es "página 1 de 1"
 * y no "página 1 de 0", que no se puede leer.
 */
export function contarPaginas(total: number, porPagina = POR_PAGINA): number {
  if (total <= 0 || porPagina <= 0) return 1
  return Math.ceil(total / porPagina)
}
