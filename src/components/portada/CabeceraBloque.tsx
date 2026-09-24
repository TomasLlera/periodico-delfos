import Link from 'next/link'

/**
 * La cabecera de un bloque de la portada: título grande y, a la derecha, el
 * link al listado completo. El filete grueso de abajo es lo que separa un
 * bloque del siguiente, y por eso va acá y no en cada sección.
 *
 * `id` no es opcional: cada bloque se cuelga de un `aria-labelledby`, así que
 * la portada se recorre por secciones con nombre en lugar de ser una sola
 * bolsa de artículos.
 */
interface Props {
  id: string
  titulo: string
  enlace?: { href: string; texto: string }
  /**
   * Nivel del encabezado. `2` en la portada, donde cada bloque es una sección
   * de una página que ya tiene su `<h1>`; `1` en las páginas donde este bloque
   * **es** el título —`/buscar`, `/plantel` y `/fixture` sin temporada—, que
   * hasta ahora quedaban sin ningún `<h1>`.
   */
  nivel?: 1 | 2
}

export function CabeceraBloque({ id, titulo, enlace, nivel = 2 }: Props) {
  const Titulo = nivel === 1 ? 'h1' : 'h2'

  return (
    // `flex-wrap` y `min-w-0`, los dos, y ninguno es decorativo. Sin `min-w-0`
    // el título no puede encogerse por debajo de su palabra más larga, y sin
    // `flex-wrap` el link no tiene adónde ir: en la columna angosta del aside
    // —donde vive `<Goleadoras />`— "La tabla completa" se salía del filete y
    // quedaba cortado contra el borde. Se veía a 1024px y a 320px, que son los
    // dos anchos donde esa columna se pone más flaca.
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b-[3px] border-tinta pb-2">
      <Titulo id={id} className="marca min-w-0 text-[1.6rem] uppercase md:text-[1.9rem]">
        {titulo}
      </Titulo>

      {enlace && (
        <Link
          href={enlace.href}
          className="font-display text-[0.85rem] font-bold text-verde-600 underline underline-offset-[3px]"
        >
          {enlace.texto}
        </Link>
      )}
    </div>
  )
}
