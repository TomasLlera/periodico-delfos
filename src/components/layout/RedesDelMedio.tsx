import { redesDelMedio, type RedDelMedio } from '@/lib/redes-del-medio'

/**
 * Los íconos de las cuentas del medio, para la cabecera y para el pie.
 *
 * **Si no hay ninguna cargada no devuelve nada**, ni un hueco ni un título de
 * sección vacío. Ver `redesDelMedio()`: los handles son un dato de Charlie y
 * hasta que estén en el entorno este componente es invisible.
 *
 * El ícono va con `aria-hidden` y el nombre de la cuenta en `.sr-only`: un link
 * que es sólo un dibujo no tiene texto que leer, y "Instagram" suelto tampoco
 * dice de quién es la cuenta. Por eso la etiqueta es "Periódico Delfos en
 * Instagram" y la arma `redesDelMedio()`.
 *
 * **Los cuatro logos van dibujados a mano, y es la excepción prevista en la
 * regla 6 de CLAUDE.md.** No es preferencia: `lucide-react` **no tiene ni uno**.
 * La versión 1 de la biblioteca sacó todos los logos de marca —se verificó
 * contra el paquete instalado: `Instagram`, `Youtube`, `Facebook` y `Twitter`
 * ya no existen como exports— porque son marcas registradas y no le pertenecen.
 * Es el mismo caso que la pelota de `IconoEvento`: el glifo no está.
 *
 * Son los paths oficiales de cada marca, en `currentColor`, para que el color
 * lo ponga la utilidad del tema y no un atributo del SVG.
 */

const TRAZOS: Record<RedDelMedio['clave'], string> = {
  instagram:
    'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  youtube:
    'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
}

function Icono({ clave, size }: { clave: RedDelMedio['clave']; size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS[clave]} />
    </svg>
  )
}

interface Props {
  /** `cabecera` va sobre el bloque verde; `pie`, en la columna "Seguinos". */
  variante?: 'cabecera' | 'pie'
  className?: string
}

export function RedesDelMedio({ variante = 'cabecera', className = '' }: Props) {
  const redes = redesDelMedio()
  if (redes.length === 0) return null

  const enCabecera = variante === 'cabecera'

  return (
    <ul className={`flex items-center ${enCabecera ? 'gap-1' : 'gap-2'} ${className}`}>
      {redes.map((red) => (
        <li key={red.clave}>
          <a
            href={red.url}
            target="_blank"
            // `me` además de `noopener`: le dice al navegador y a los
            // verificadores que esa cuenta es de este mismo sitio, que es lo
            // que usan Mastodon y los validadores de identidad.
            rel="noopener noreferrer me"
            className={
              enCabecera
                ? 'tactil flex w-9 items-center justify-center text-header-text/60 hover:text-block-accent'
                : 'tactil flex min-h-11 w-9 items-center justify-center hover:text-accent-text'
            }
          >
            <Icono clave={red.clave} size={enCabecera ? 16 : 18} />
            <span className="sr-only">{red.etiqueta}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
