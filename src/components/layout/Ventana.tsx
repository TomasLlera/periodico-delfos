'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

/**
 * La ventana que se abre encima de la página, para las rutas interceptadas.
 *
 * **Es `<dialog>` nativo y no un `<div>` con `role="dialog"`.** La trampa de
 * foco, la tecla Escape, el foco que vuelve al elemento que abrió la ventana y
 * el `inert` de todo lo que queda atrás los hace el navegador con
 * `showModal()`. Escritos a mano son doscientas líneas y tres bugs; acá son
 * cero.
 *
 * **Cerrar es volver atrás.** La ventana existe porque una ruta se interceptó:
 * la URL de la página que está abajo ya cambió a la del partido. Si la ventana
 * se cerrara sin navegar, la URL quedaría mintiendo. Por eso `router.back()`, y
 * por eso el botón de atrás del navegador también la cierra.
 *
 * El `<dialog>` se abre en un efecto y no con el atributo `open`: `open` lo
 * dibuja pero **no** como modal —sin trampa de foco y sin `::backdrop`—, que es
 * el error clásico con este elemento.
 */
interface Props {
  /** El título de la ventana, que es también su nombre accesible. */
  titulo: string
  children: React.ReactNode
}

export function Ventana({ titulo, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const router = useRouter()

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo || dialogo.open) return

    dialogo.showModal()

    // El fondo no scrollea mientras la ventana está abierta: en 375px el dedo
    // arrastra la página de atrás en lugar de la planilla.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  return (
    <dialog
      ref={ref}
      aria-labelledby="titulo-ventana"
      onClose={() => router.back()}
      // Clic en el fondo. El `<dialog>` ocupa toda la pantalla y el contenido
      // vive en el `<div>` de adentro, así que un clic cuyo destino sea el
      // diálogo mismo es un clic afuera del contenido.
      onClick={(evento) => {
        if (evento.target === ref.current) ref.current?.close()
      }}
      className="m-0 max-h-dvh max-w-none bg-transparent p-0 backdrop:bg-negro-cancha/70 sm:max-h-dvh"
    >
      <div className="flex min-h-dvh w-dvw items-end justify-center sm:items-center sm:p-6">
        <div className="tarjeta relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg border border-linea sm:max-h-[85dvh] sm:max-w-[680px] sm:rounded-lg">
          <div className="flex items-center justify-between gap-4 border-b border-linea px-4 py-3">
            <h2 id="titulo-ventana" className="titular text-[1.05rem] leading-tight">
              {titulo}
            </h2>

            {/* 44px de área táctil, como manda el sistema de diseño. */}
            <button
              type="button"
              onClick={() => ref.current?.close()}
              className="tactil -mr-2 flex shrink-0 items-center justify-center rounded text-gris transition-colors hover:text-tinta"
            >
              <X aria-hidden="true" size={20} />
              <span className="sr-only">Cerrar</span>
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        </div>
      </div>
    </dialog>
  )
}
