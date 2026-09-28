'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { COLOR_BARRA_NAVEGADOR, type Tema } from '@/lib/colores'

/** Lo que dura el fundido de `globals.css` (180ms), con margen. */
const DURACION_FUNDIDO = 250

/**
 * El botón sol/luna de la cabecera: fuerza el tema claro o el oscuro.
 *
 * Hasta que alguien lo toca, el sitio sigue al sistema. Al tocarlo la elección
 * queda en `localStorage` (lo hace `next-themes`) y le gana al sistema.
 *
 * **Es un toggle y no un menú de tres opciones**: `aria-pressed` dice si el
 * modo oscuro está puesto, y el nombre accesible no cambia al apretarlo —
 * "Modo oscuro, presionado" se entiende; un nombre que alterna entre "Activar"
 * y "Desactivar" junto con el estado se lee al revés.
 *
 * **El icono no depende del estado de React.** En el servidor no se sabe el
 * tema, y un icono elegido con `resolvedTheme` sale mal en el primer pintado o
 * rompe la hidratación. Van los dos, y el CSS muestra uno según `data-theme`,
 * que ya está puesto antes del primer pintado. `aria-pressed` sí espera al
 * montaje: antes vale lo mismo en servidor y cliente.
 *
 * También actualiza `<meta name="theme-color">`: los dos que emite el layout
 * responden al tema del sistema, y con un tema forzado dirían el equivocado.
 */
export function ToggleTema({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  const tema: Tema | null =
    montado && (resolvedTheme === 'dark' || resolvedTheme === 'light') ? resolvedTheme : null

  useEffect(() => {
    if (!tema) return
    for (const meta of document.querySelectorAll('meta[name="theme-color"]')) {
      meta.setAttribute('content', COLOR_BARRA_NAVEGADOR[tema])
    }
  }, [tema])

  function alternar() {
    const raiz = document.documentElement
    raiz.classList.add('tema-cambiando')
    setTheme(tema === 'dark' ? 'light' : 'dark')
    window.setTimeout(() => raiz.classList.remove('tema-cambiando'), DURACION_FUNDIDO)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Modo oscuro"
      aria-pressed={tema === 'dark'}
      className={`tactil flex w-11 shrink-0 items-center justify-center rounded-sm border border-header-text/20 bg-header-text/10 text-header-text transition-colors hover:border-block-accent hover:text-block-accent ${className}`}
    >
      <Moon size={18} aria-hidden="true" className="oscuro:hidden" />
      <Sun size={18} aria-hidden="true" className="hidden oscuro:block" />
    </button>
  )
}
