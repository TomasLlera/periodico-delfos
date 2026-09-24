'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

/**
 * La navegación de secciones, con el filete amarillo abajo de la activa.
 *
 * **Por qué es un componente cliente**, siendo que el resto del chrome no lo
 * es: `aria-current` necesita saber en qué ruta estamos, y el App Router no le
 * da la ruta a un layout de servidor. La alternativa —leerla de un header que
 * ponga el middleware— obliga a `headers()`, que saca a la página del
 * prerender y tira abajo las 8 rutas estáticas del build. Así que se aisla acá
 * lo mínimo: el `<ul>` y nada más. El resto del `Header` sigue en el servidor.
 *
 * `/plantel` y `/fixture` son puertas cortas: el blueprint tiene las páginas
 * scopeadas por temporada (`/plantel/[temporadaSlug]`, `/temporada/[slug]`) y
 * la nav no puede linkear a un slug que cambia cada año. Las dos rutas cortas
 * redirigen a la temporada en curso cuando hay una cargada.
 *
 * Por eso `/fixture` declara `/temporada` como prefijo propio: después del
 * redirect la URL es `/temporada/primera-b-2026`, y sin esto la nav se apagaría
 * entera justo en la página a la que acaba de mandar. `/plantel` no lo necesita
 * porque `/plantel/[temporadaSlug]` ya cuelga de su misma ruta.
 */
const SECCIONES = [
  { href: '/', label: 'Portada' },
  { href: '/cronicas', label: 'Crónicas' },
  { href: '/analisis', label: 'Análisis' },
  { href: '/plantel', label: 'Plantel' },
  { href: '/fixture', label: 'Fixture y tabla', prefijos: ['/temporada'] },
  { href: '/quienes-somos', label: 'Quiénes somos' },
] as const

const BASE =
  'tactil flex items-center border-b-[3px] px-[1.15rem] font-display text-[0.9rem] font-bold tracking-[0.02em]'

export function NavPrincipal() {
  const pathname = usePathname()
  const lista = useRef<HTMLUListElement>(null)
  const [hayMas, setHayMas] = useState(false)

  /**
   * Dos cosas que sólo se saben midiendo, y por eso no se pueden resolver con
   * una media query: si la tira desborda —para dibujar el degradado— y dónde
   * quedó la sección activa.
   *
   * **La activa se centra moviendo `scrollLeft` y no con `scrollIntoView()`.**
   * `scrollIntoView` sube por todos los ancestros scrolleables hasta el
   * documento: entrar a "Quiénes somos" en un celular dejaba la página
   * arrancada unos píxeles más abajo del principio, que se lee como que el
   * sitio carga mal. Tocando `scrollLeft` se mueve la tira y nada más.
   */
  useEffect(() => {
    const ul = lista.current
    if (!ul) return

    const medir = () => setHayMas(ul.scrollWidth - ul.clientWidth - ul.scrollLeft > 1)
    medir()

    const activa = ul.querySelector<HTMLElement>('[aria-current="page"]')
    if (activa) {
      ul.scrollLeft = Math.max(0, activa.offsetLeft - (ul.clientWidth - activa.offsetWidth) / 2)
      medir()
    }

    const observador = new ResizeObserver(medir)
    observador.observe(ul)
    ul.addEventListener('scroll', medir, { passive: true })

    return () => {
      observador.disconnect()
      ul.removeEventListener('scroll', medir)
    }
  }, [pathname])

  return (
    // En 375px la nav scrollea en lugar de apilarse: no se come el alto del
    // viewport antes de que aparezca la primera nota.
    <nav aria-label="Secciones" className="border-t border-white/15">
      {/* `relative` porque el degradado va posicionado contra esta caja. Es la
          regla 5 de CLAUDE.md mirada del otro lado: un contenedor con scroll
          horizontal y algo absoluto adentro necesita ser el ancestro
          posicionado, o lo absoluto se mide contra el documento. */}
      <div className="contenedor relative">
        <ul
          ref={lista}
          className="-mx-[clamp(1rem,4vw,2rem)] flex overflow-x-auto px-[clamp(1rem,4vw,2rem)] scrollbar-none"
        >
          {SECCIONES.map((seccion) => {
            // La portada matchea exacta; el resto también con sus hijas, para
            // que `/nota/x` no deje la nav entera apagada más adelante.
            const rutas: readonly string[] = [
              seccion.href,
              ...('prefijos' in seccion ? seccion.prefijos : []),
            ]

            const activa =
              seccion.href === '/'
                ? pathname === '/'
                : rutas.some(
                    (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`),
                  )

            return (
              <li key={seccion.href} className="shrink-0">
                <Link
                  href={seccion.href}
                  aria-current={activa ? 'page' : undefined}
                  className={
                    activa
                      ? `${BASE} border-amarillo text-amarillo`
                      : `${BASE} border-transparent text-white hover:bg-white/10`
                  }
                >
                  {seccion.label}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* El aviso de que hay más secciones a la derecha. Sin esto la tira
            parece terminar donde termina la pantalla y las dos últimas no las
            busca nadie. `pointer-events-none` para no comerse el toque del
            último ítem, que queda abajo. */}
        {hayMas && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-verde-900 to-transparent"
          />
        )}
      </div>
    </nav>
  )
}
