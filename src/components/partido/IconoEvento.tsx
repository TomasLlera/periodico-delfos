import { ArrowDown, ArrowDownUp, ArrowUp, Cross, RectangleVertical, X } from 'lucide-react'
import type { TipoEvento } from '@/types'

/** Los cambios se dibujan flecha por flecha, una por jugadora. */
export type IconoTipo = TipoEvento | 'entra' | 'sale'

interface Props {
  tipo: IconoTipo
  className?: string
}

/**
 * Iconos de la planilla, de lucide.
 *
 * Son decorativos a propósito: el significado de cada evento va siempre en la
 * frase que arma `describirEvento()`, así que acá van con `aria-hidden`. La
 * amarilla y la roja se distinguen además por luminancia —#FFC72C es claro,
 * #C42127 es oscuro—, no sólo por tono, para que se lean en escala de grises.
 *
 * **La pelota es la única excepción y no es un descuido: lucide no tiene una
 * pelota de fútbol.** `Goal` es una bandera sobre un blanco y `Volleyball` es
 * una pelota de vóley con sus curvas; ninguna de las dos puede ser lo que marca
 * un gol en un medio de fútbol. Se dibuja a mano abajo, en `<Pelota />`.
 */
export function IconoEvento({ tipo, className = 'h-3.75 w-3.75' }: Props) {
  const medida = `${className} shrink-0`

  switch (tipo) {
    case 'gol':
    case 'gol_penal':
    case 'gol_en_contra':
      return <Pelota className={medida} />

    case 'penal_errado':
      return (
        <span className={`relative inline-flex ${medida}`} aria-hidden="true">
          <Pelota className="h-full w-full" />
          <X {...TRAZO} className="absolute inset-0 h-full w-full stroke-roja" />
        </span>
      )

    case 'amarilla':
      return <Tarjeta className={`${medida} fill-amarillo`} />

    case 'roja':
      return <Tarjeta className={`${medida} fill-roja`} />

    case 'doble_amarilla':
      // Las dos superpuestas, como en una planilla impresa. Cada tarjeta ocupa
      // la mitad del ancho de su lienzo, así que el ±18% las cruza sin taparlas.
      return (
        <span className={`relative inline-flex ${medida}`} aria-hidden="true">
          <Tarjeta className="absolute inset-0 h-full w-full translate-x-[-18%] fill-amarillo" />
          <Tarjeta className="absolute inset-0 h-full w-full translate-x-[18%] fill-roja" />
        </span>
      )

    case 'cambio':
      return <ArrowDownUp {...TRAZO} className={medida} />

    case 'entra':
      return <ArrowUp {...TRAZO} className={`${medida} stroke-verde-600`} />

    case 'sale':
      return <ArrowDown {...TRAZO} className={`${medida} stroke-roja`} />

    case 'lesion':
      return <Cross {...TRAZO} className={`${medida} fill-roja stroke-roja`} />
  }
}

/**
 * A 15px, el trazo 2 que trae lucide sobre un lienzo de 24 queda en 1,25px y se
 * ve anémico al lado de la tipografía de la planilla.
 */
const TRAZO = { strokeWidth: 2.25, 'aria-hidden': true, focusable: 'false' } as const

/**
 * El borde despega la tarjeta del fondo cuando el papel y el color de la
 * tarjeta se parecen. Va con el token de tinta y no con un rgba fijo para que
 * en tema oscuro siga siendo un borde visible en vez de negro sobre negro.
 */
function Tarjeta({ className }: { className?: string }) {
  return (
    <RectangleVertical
      className={`${className} stroke-tinta/35`}
      strokeWidth={1.5}
      aria-hidden="true"
      focusable="false"
    />
  )
}

/**
 * La pelota, a mano por lo que dice el comentario de arriba.
 *
 * A 15px una pelota dibujada con líneas se lee como un blanco de tiro. En
 * negativo —círculo lleno, pentágono calado— se reconoce enseguida.
 */
function Pelota({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="6.25" className="fill-current" />
      <path d="M8 4.1 11.1 6.35 9.92 10H6.08L4.9 6.35Z" className="fill-papel" />
    </svg>
  )
}
