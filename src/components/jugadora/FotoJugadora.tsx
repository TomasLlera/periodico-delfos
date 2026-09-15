import { ImagenResponsive } from '@/components/content/ImagenResponsive'
import { iniciales } from '@/lib/plantel'
import type { Jugadora } from '@/types'

/**
 * La foto de una jugadora, con sus iniciales cuando no hay.
 *
 * El hueco no es un placeholder de desarrollo: hoy **ninguna** jugadora tiene
 * foto cargada, y va a seguir habiendo fichas sin foto cuando las haya. Una
 * tarjeta que colapsa sin imagen desarma la grilla del plantel entera, así que
 * el respaldo tiene el mismo alto que la foto y dibuja las iniciales, igual
 * que `<EscudoEquipo />` con los escudos que faltan.
 *
 * Va siempre con `alt=""`: el nombre está al lado como texto en todos los
 * lugares donde se usa.
 *
 * **El ancho lo pone el contenedor.** Adentro la foto es `w-full` y llena lo
 * que le den; mandarle un `w-12` por `className` no la achica, porque entre
 * dos utilidades de ancho gana la que Tailwind ordene última y no la que se
 * escribió después.
 */
interface Props {
  jugadora: Pick<Jugadora, 'nombre' | 'apellido' | 'foto_url'>
  /** Relación de aspecto, como utilidad de Tailwind. */
  aspecto?: string
  sizes?: string
  /** La de la ficha es el LCP de su página. */
  prioridad?: boolean
  /** `oscuro` va adentro de los bloques verdes; `claro`, sobre el crema. */
  variante?: 'claro' | 'oscuro'
  /** Para el recorte y los límites. **El ancho no**: lo pone el contenedor. */
  className?: string
}

export function FotoJugadora({
  jugadora,
  aspecto = 'aspect-[3/4]',
  sizes = '(min-width: 1024px) 240px, 45vw',
  prioridad = false,
  variante = 'claro',
  className = '',
}: Props) {
  if (jugadora.foto_url) {
    return (
      <ImagenResponsive
        src={jugadora.foto_url}
        alt=""
        sizes={sizes}
        prioridad={prioridad}
        className={`${aspecto} w-full object-cover object-top ${className}`}
      />
    )
  }

  return (
    <div
      aria-hidden="true"
      className={`${aspecto} flex w-full items-center justify-center ${
        variante === 'oscuro'
          ? 'bg-verde-600/25 text-white/45'
          : 'bg-papel-alt text-gris-tenue'
      } ${className}`}
    >
      <span className="marca text-[2rem] leading-none">{iniciales(jugadora)}</span>
    </div>
  )
}
