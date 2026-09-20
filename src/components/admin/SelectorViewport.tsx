'use client'

import { Monitor, Smartphone, Tablet } from 'lucide-react'

/**
 * Los tres tamaños en los que se mira la preview.
 *
 * No son elegidos a ojo: 390px es el iPhone de referencia y el ancho al que el
 * sitio está diseñado mobile-first —CLAUDE.md fija 375px como piso—, y 834px es
 * el iPad vertical, que es donde se rompen los layouts que andan en los dos
 * extremos. Escritorio es el ancho disponible, sin cortar.
 *
 * El ancho se aplica al contenedor, no a una ventana aparte: no es un iframe.
 * Un iframe daría el viewport real —las media queries responderían a él— pero
 * obligaría a montar el árbol de nuevo adentro, y con él otra copia de los
 * estilos. Un contenedor angosto muestra cómo se acomoda el contenido, que es
 * lo que se está decidiendo acá; el corte exacto de las media queries se mira
 * en el navegador, que ya tiene la herramienta hecha.
 */

export type Viewport = 'escritorio' | 'tablet' | 'movil'

export const ANCHO_VIEWPORT: Record<Viewport, string> = {
  escritorio: '100%',
  tablet: '834px',
  movil: '390px',
}

const OPCIONES = [
  ['escritorio', 'Escritorio', Monitor],
  ['tablet', 'Tablet', Tablet],
  ['movil', 'Móvil', Smartphone],
] as const

interface Props {
  valor: Viewport
  onCambio: (v: Viewport) => void
}

export function SelectorViewport({ valor, onCambio }: Props) {
  return (
    <div role="group" aria-label="Ancho de la vista previa" className="flex items-center gap-1">
      {OPCIONES.map(([clave, nombre, Icono]) => (
        <button
          key={clave}
          type="button"
          onClick={() => onCambio(clave)}
          aria-pressed={valor === clave}
          title={nombre}
          className={`tactil flex min-w-11 items-center justify-center gap-1 px-2 text-[0.8rem] ${
            valor === clave ? 'bg-verde-900 text-white' : 'hover:bg-papel-alt'
          }`}
        >
          <Icono size={16} aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">{nombre}</span>
        </button>
      ))}
    </div>
  )
}
