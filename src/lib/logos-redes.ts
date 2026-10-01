/**
 * Los logos de las redes, como trazos SVG, y cómo se llama cada una.
 *
 * **Van dibujados a mano, y es la excepción prevista en la regla 6 de
 * CLAUDE.md.** No es preferencia: `lucide-react` **no tiene ni uno**. La versión
 * 1 de la biblioteca sacó todos los logos de marca —se verificó contra el
 * paquete instalado: `Instagram`, `Youtube`, `Facebook` y `Twitter` ya no
 * existen como exports— porque son marcas registradas y no le pertenecen. Es el
 * mismo caso que la pelota de `IconoEvento`: el glifo no está.
 *
 * **Están acá y no en el componente que los dibuja** porque los usan dos cosas
 * que no se parecen en nada: los links a las cuentas del medio en el chrome
 * (`<RedesDelMedio />`) y la tarjeta de un posteo citado en el cuerpo de una
 * nota (`<PosteoCitado />`). Copiar un `path` de 600 caracteres en el segundo
 * lugar es garantizar que el día que se corrija uno queden distintos.
 *
 * Son los trazos oficiales de cada marca, en una grilla de 24×24 y pensados
 * para `fill="currentColor"`: el color lo pone la utilidad del tema y nunca un
 * atributo del SVG.
 */

/** Las redes que el proyecto sabe dibujar. */
export type ClaveDeRed = 'instagram' | 'x' | 'youtube' | 'facebook'

export const TRAZOS_DE_RED: Record<ClaveDeRed, string> = {
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
}

/**
 * El nombre que se muestra, que no es la clave.
 *
 * `x` se escribe "X" y no "Twitter": es como se llama hoy la plataforma, aunque
 * el link pegado venga de `twitter.com` —`datosDePosteo()` acepta los dos
 * dominios y los normaliza a uno—.
 */
export const NOMBRE_DE_RED: Record<ClaveDeRed, string> = {
  instagram: 'Instagram',
  x: 'X',
  youtube: 'YouTube',
  facebook: 'Facebook',
}
