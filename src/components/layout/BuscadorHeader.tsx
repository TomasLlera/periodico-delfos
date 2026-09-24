'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * El buscador de la cabecera: un campo en escritorio, una lupa que se despliega
 * en celular.
 *
 * **Es `<details>` y no un botón con estado.** CLAUDE.md pide que el buscador
 * ande sin JavaScript —es un `<form method="get">`, no un componente que
 * consulta— y `<details>` abre y cierra solo, sin JS, exponiendo `aria-expanded`
 * en el `<summary>` sin que haya que escribirlo. Un `useState` habría dejado la
 * lupa muerta con el JS caído, que es justo el caso que la regla protege.
 *
 * Lo que sí necesita JS son las dos cortesías que `<details>` no trae: el foco
 * al campo cuando se abre y el cierre con Escape. Las dos se degradan a nada:
 * sin JS el panel abre igual y se cierra tocando la lupa otra vez.
 *
 * En escritorio el `<details>` se apaga entero (`md:hidden`) y va el campo de
 * siempre, que ahí tiene ancho de sobra.
 */
export function BuscadorHeader() {
  const caja = useRef<HTMLDetailsElement>(null)
  const campo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const detalle = caja.current
    if (!detalle) return

    const alAbrir = () => {
      if (detalle.open) campo.current?.focus()
    }

    const alEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape' && detalle.open) {
        detalle.open = false
        // El foco vuelve a la lupa: si se queda en el campo que se acaba de
        // esconder, el navegador lo manda al `<body>` y quien navega con
        // teclado tiene que recorrer la cabecera entera otra vez.
        detalle.querySelector('summary')?.focus()
      }
    }

    detalle.addEventListener('toggle', alAbrir)
    document.addEventListener('keydown', alEscape)

    return () => {
      detalle.removeEventListener('toggle', alAbrir)
      document.removeEventListener('keydown', alEscape)
    }
  }, [])

  return (
    <>
      {/* Celular: la lupa, y el campo desplegado abajo de la cabecera. */}
      <details ref={caja} className="group md:hidden">
        <summary
          className="tactil flex w-11 cursor-pointer items-center justify-center rounded-sm border border-white/20 bg-white/10 text-white marker:content-none [&::-webkit-details-marker]:hidden"
          aria-label="Buscar"
        >
          <Search size={18} aria-hidden="true" className="group-open:hidden" />
          <X size={18} aria-hidden="true" className="hidden group-open:block" />
        </summary>

        {/* `absolute` contra la cabecera y no en el flujo: empujar la nav hacia
            abajo al abrir mueve la página entera debajo del dedo. */}
        <div className="absolute inset-x-0 top-full z-20 bg-verde-900 px-[clamp(1rem,4vw,2rem)] pb-3 pt-1">
          <Formulario refCampo={campo} />
        </div>
      </details>

      {/* Escritorio: el campo, siempre visible. */}
      <div className="hidden md:block">
        <Formulario />
      </div>
    </>
  )
}

/**
 * El form de verdad, uno solo para los dos lados.
 *
 * `method="get"` contra `/buscar`, que es lo que hace que ande sin JS: el
 * navegador arma `/buscar?q=…` solo. `name="q"` tiene que coincidir con el
 * parámetro que lee la página.
 */
function Formulario({ refCampo }: { refCampo?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <form action="/buscar" method="get" role="search" className="flex items-center gap-2">
      <label htmlFor={refCampo ? 'q-movil' : 'q-cabecera'} className="sr-only">
        Buscar crónicas y jugadoras
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-white/20 bg-white/10 px-[0.9rem]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-white/70" />
        <input
          ref={refCampo}
          id={refCampo ? 'q-movil' : 'q-cabecera'}
          name="q"
          type="search"
          placeholder="Buscar crónicas, jugadoras…"
          className="tactil w-full min-w-0 bg-transparent font-display text-[0.85rem] text-white placeholder:text-white/70 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="tactil shrink-0 rounded-sm bg-amarillo px-3 font-display text-[0.8rem] font-bold text-tinta md:hidden"
      >
        Buscar
      </button>
    </form>
  )
}
