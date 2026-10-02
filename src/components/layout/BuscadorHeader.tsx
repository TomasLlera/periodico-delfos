'use client'

import { Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

/**
 * El buscador de la cabecera: una lupa que despliega el campo, en todos los
 * anchos.
 *
 * **Antes era un campo siempre visible de 768 para arriba.** Se plegó también en
 * escritorio cuando la cabecera pasó a ser fija: un campo de texto en una barra
 * que acompaña todo el scroll se lleva la mitad del alto que hay que ahorrar, y
 * obliga a elegir entre un campo angosto y una marca chica. Plegado, los tres
 * controles de la derecha miden lo mismo y la cabecera compacta entra en una
 * línea. Es lo que hacen los diarios grandes —Olé entre ellos— por la misma
 * razón: buscar es algo que se hace una vez cada varias visitas, y el titular
 * es lo que se mira siempre.
 *
 * **Es `<details>` y no un botón con estado.** CLAUDE.md pide que el buscador
 * ande sin JavaScript —es un `<form method="get">`, no un componente que
 * consulta— y `<details>` abre y cierra solo, sin JS, exponiendo `aria-expanded`
 * en el `<summary>` sin que haya que escribirlo. Un `useState` habría dejado la
 * lupa muerta con el JS caído, que es justo el caso que la regla protege. Y es
 * lo que hace que plegarlo en escritorio no sea una pérdida: sin JS, la lupa
 * sigue abriendo el campo.
 *
 * Lo que sí necesita JS son las dos cortesías que `<details>` no trae: el foco
 * al campo cuando se abre y el cierre con Escape. Las dos se degradan a nada:
 * sin JS el panel abre igual y se cierra tocando la lupa otra vez.
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
    <details ref={caja} className="group">
      <summary
        className="tactil flex w-11 cursor-pointer items-center justify-center rounded-sm border border-header-text/20 bg-header-text/10 text-header-text transition-colors marker:content-none hover:border-block-accent hover:text-block-accent [&::-webkit-details-marker]:hidden"
        aria-label="Buscar"
      >
        <Search size={18} aria-hidden="true" className="group-open:hidden" />
        <X size={18} aria-hidden="true" className="hidden group-open:block" />
      </summary>

      {/* `absolute` contra la cabecera y no en el flujo: empujar la nav hacia
          abajo al abrir mueve la página entera debajo del dedo. El panel cruza
          el ancho completo, pero el formulario se alinea a la derecha en
          escritorio, debajo de la lupa que lo abrió. */}
      <div className="absolute inset-x-0 top-full z-20 border-b border-block-border bg-header-bg px-[clamp(1rem,4vw,2rem)] pb-3 pt-1">
        <div className="md:ml-auto md:max-w-[34rem]">
          <Formulario refCampo={campo} />
        </div>
      </div>
    </details>
  )
}

/**
 * El form de verdad.
 *
 * `method="get"` contra `/buscar`, que es lo que hace que ande sin JS: el
 * navegador arma `/buscar?q=…` solo. `name="q"` tiene que coincidir con el
 * parámetro que lee la página.
 *
 * **El botón de enviar es visible en todos los anchos.** Antes se escondía de
 * 768 para arriba, donde el campo estaba siempre a la vista y se daba por
 * sabido que Enter alcanza. Ahora el campo aparece recién al tocar la lupa, y
 * un panel que se abre sin una salida visible deja a cualquiera buscando dónde
 * apretar.
 */
function Formulario({ refCampo }: { refCampo: React.RefObject<HTMLInputElement | null> }) {
  return (
    <form action="/buscar" method="get" role="search" className="flex items-center gap-2">
      <label htmlFor="q-cabecera" className="sr-only">
        Buscar crónicas y jugadoras
      </label>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-sm border border-header-text/20 bg-header-text/10 px-[0.9rem]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-header-text/70" />
        <input
          ref={refCampo}
          id="q-cabecera"
          name="q"
          type="search"
          placeholder="Buscar crónicas, jugadoras…"
          className="tactil w-full min-w-0 bg-transparent font-display text-[0.85rem] text-header-text placeholder:text-header-text/70 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="tactil shrink-0 rounded-sm bg-accent px-3 font-display text-[0.8rem] font-bold text-accent-contrast"
      >
        Buscar
      </button>
    </form>
  )
}
