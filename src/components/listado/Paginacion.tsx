import Link from 'next/link'

/**
 * La paginación de los listados.
 *
 * **Son links, no botones.** Sin JavaScript tienen que funcionar igual, y
 * además son la forma en que un buscador llega a las notas viejas: con 70 notas
 * migradas y 12 por página, la última crónica de 2023 está a seis clicks de la
 * portada y ningún crawler la encuentra si la paginación es un `onClick`.
 *
 * Por eso también se dibujan todos los números en lugar de sólo
 * anterior/siguiente: cada página queda a un salto de cualquier otra. Si algún
 * día son treinta, la fila envuelve; no vale la pena el recorte con puntos
 * suspensivos hasta que moleste de verdad.
 *
 * `rel="prev"` y `rel="next"` van en los dos extremos, que es lo que une la
 * serie para un buscador.
 */
interface Props {
  /** Ruta sin query: `/cronicas`. */
  base: string
  pagina: number
  totalPaginas: number
}

const ENLACE =
  'tactil inline-flex items-center justify-center border px-3 font-display text-[0.9rem] font-bold'

/** La página 1 es la ruta limpia: `/cronicas`, no `/cronicas?pagina=1`. */
export function hrefDePagina(base: string, pagina: number): string {
  return pagina <= 1 ? base : `${base}?pagina=${pagina}`
}

export function Paginacion({ base, pagina, totalPaginas }: Props) {
  if (totalPaginas <= 1) return null

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1)

  return (
    <nav aria-label="Paginación" className="mt-12 border-t border-linea pt-6">
      <ul className="flex flex-wrap items-center gap-2">
        <li>
          {pagina > 1 ? (
            <Link
              href={hrefDePagina(base, pagina - 1)}
              rel="prev"
              className={`${ENLACE} border-linea-fuerte bg-tarjeta hover:border-verde-600 hover:text-verde-600`}
            >
              ← Anterior
            </Link>
          ) : (
            <span className={`${ENLACE} border-linea text-gris-tenue`} aria-hidden="true">
              ← Anterior
            </span>
          )}
        </li>

        {paginas.map((n) => (
          <li key={n}>
            {n === pagina ? (
              // `aria-current` y no sólo el color: el filete amarillo no se lo
              // puede leer nadie con un lector de pantalla.
              <span
                aria-current="page"
                className={`${ENLACE} dato border-verde-900 bg-verde-900 text-white`}
              >
                {n}
              </span>
            ) : (
              <Link
                href={hrefDePagina(base, n)}
                aria-label={`Página ${n}`}
                className={`${ENLACE} dato border-linea-fuerte bg-tarjeta hover:border-verde-600 hover:text-verde-600`}
              >
                {n}
              </Link>
            )}
          </li>
        ))}

        <li>
          {pagina < totalPaginas ? (
            <Link
              href={hrefDePagina(base, pagina + 1)}
              rel="next"
              className={`${ENLACE} border-linea-fuerte bg-tarjeta hover:border-verde-600 hover:text-verde-600`}
            >
              Siguiente →
            </Link>
          ) : (
            <span className={`${ENLACE} border-linea text-gris-tenue`} aria-hidden="true">
              Siguiente →
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
