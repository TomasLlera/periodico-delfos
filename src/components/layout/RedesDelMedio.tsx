import { LogoDeRed } from '@/components/layout/LogoDeRed'
import { redesDelMedio } from '@/lib/redes-del-medio'

/**
 * Los íconos de las cuentas del medio, para la cabecera y para el pie.
 *
 * **Si no hay ninguna cargada no devuelve nada**, ni un hueco ni un título de
 * sección vacío. Ver `redesDelMedio()`: los handles son un dato de Charlie y
 * hasta que estén en el entorno este componente es invisible.
 *
 * El logo va con `aria-hidden` —lo pone `<LogoDeRed />`— y el nombre de la
 * cuenta en `.sr-only`: un link que es sólo un dibujo no tiene texto que leer,
 * y "Instagram" suelto tampoco dice de quién es la cuenta. Por eso la etiqueta
 * es "Periódico Delfos en Instagram" y la arma `redesDelMedio()`.
 *
 * Los trazos de los cuatro logos viven en `lib/logos-redes.ts`, que explica por
 * qué van dibujados a mano: `lucide-react` v1 no trae ninguno.
 */
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
            <LogoDeRed clave={red.clave} size={enCabecera ? 16 : 18} />
            <span className="sr-only">{red.etiqueta}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
