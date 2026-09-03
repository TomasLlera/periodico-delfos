import type { Equipo } from '@/types'

interface Props {
  equipo: Equipo
  /** Lado del cuadrado: un número en px o cualquier medida CSS (`clamp(…)`). */
  tamano?: number | string
}

/**
 * Escudo del equipo, con iniciales como respaldo.
 *
 * Va con `alt=""` siempre: el nombre del equipo está al lado como texto en
 * todos los lugares donde se usa. Repetirlo sería ruido para el lector de
 * pantalla.
 */
export function EscudoEquipo({ equipo, tamano = 32 }: Props) {
  const lado = typeof tamano === 'number' ? `${tamano}px` : tamano

  if (equipo.escudo_url) {
    return (
      <img
        src={equipo.escudo_url}
        alt=""
        // Los atributos sólo aceptan px: con una medida fluida el tamaño lo
        // pone el style y se pierde la reserva de espacio, que en un escudo de
        // 30px no mueve el layout.
        width={typeof tamano === 'number' ? tamano : undefined}
        height={typeof tamano === 'number' ? tamano : undefined}
        loading="lazy"
        decoding="async"
        className="shrink-0 object-contain"
        style={{ width: lado, height: lado }}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-verde-100 font-display font-semibold leading-none text-verde-600"
      style={{ width: lado, height: lado, fontSize: `calc(${lado} * 0.36)` }}
    >
      {iniciales(equipo.nombre_corto)}
    </span>
  )
}

/** "All Boys" → "AB" · "Aldosivi" → "ALD" */
function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase()
  return palabras
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase()
}
