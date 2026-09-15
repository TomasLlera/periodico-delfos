'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

  return (
    // En 375px la nav scrollea en lugar de apilarse: no se come el alto del
    // viewport antes de que aparezca la primera nota.
    <nav aria-label="Secciones" className="border-t border-white/15">
      <div className="mx-auto max-w-[1200px] px-4">
        <ul className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
      </div>
    </nav>
  )
}
