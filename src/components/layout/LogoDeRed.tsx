import { TRAZOS_DE_RED, type ClaveDeRed } from '@/lib/logos-redes'

/**
 * El logo de una red, en `currentColor`.
 *
 * **Siempre `aria-hidden`.** Un logo nunca es la etiqueta de nada: quien lo usa
 * pone el texto al lado —"@tiburonas en Instagram"— o un `.sr-only`. Un link
 * que es sólo un dibujo no tiene nada que leer, y "Instagram" suelto tampoco
 * dice de quién es la cuenta.
 *
 * `focusable="false"` es por Internet Explorer y por los navegadores viejos de
 * Android, que meten el `<svg>` en el orden de tabulación: una lista de cuatro
 * cuentas pasaba a ser ocho tabs.
 */
interface Props {
  clave: ClaveDeRed
  size: number
}

export function LogoDeRed({ clave, size }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d={TRAZOS_DE_RED[clave]} />
    </svg>
  )
}
