'use client'

/**
 * De qué equipo es el evento que se está cargando: el nuestro o el rival.
 *
 * Dos botones y no un `<select>`: es una elección binaria que se hace con el
 * pulgar y sin mirar, y un desplegable son dos toques y una lista que tapa la
 * pantalla. `aria-pressed` es lo que hace que el elegido se anuncie como tal
 * sin depender del color.
 *
 * Estaba adentro de `PlanillaCarga`, que además de pasar las 300 líneas tenía
 * dos componentes en el mismo archivo.
 */

interface Props {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}

export function BotonLado({ activo, onClick, children }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`tactil flex-1 px-3 font-display text-[0.9rem] font-bold ${
        activo ? 'bg-verde-900 text-white' : 'border border-linea-fuerte hover:bg-papel-alt'
      }`}
    >
      {children}
    </button>
  )
}
