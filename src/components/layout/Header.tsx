import Link from 'next/link'
import { Search } from 'lucide-react'

/**
 * El header del rediseño de portal deportivo.
 *
 * Dos franjas sobre fondo casi negro: la marca arriba y la navegación abajo,
 * en cajas altas. La tipografía sigue siendo Archivo —no una condensada—; el
 * aire lo dan la caja alta, el tracking y el peso (`.titular`).
 *
 * El logo iba en `verde-900`, que no se redefinía en tema oscuro y quedaba en
 * ~1.3:1 contra el fondo (estaba anotado en HANDOFF.md como pendiente). Ahora
 * "PERIÓDICO" va en `verde-600`, que es el verde saturado del rediseño.
 *
 * **Falta la tira de resultados en vivo del mockup** (marcador del partido en
 * curso, próximo partido, fecha). No es un olvido: necesita datos reales de
 * `partidos` y es el `<BarraEstado />` del Step 19 del Build Order. Poner
 * resultados inventados en el header del sitio real sería peor que no tenerla.
 */
const SECCIONES = [
  { href: '/', label: 'Portada' },
  { href: '/cronicas', label: 'Crónicas' },
  { href: '/analisis', label: 'Análisis' },
  { href: '/plantel', label: 'Plantel' },
  { href: '/quienes-somos', label: 'Quiénes somos' },
] as const

export function Header() {
  return (
    <header className="franja border-b border-linea">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="group">
            <span className="flex items-center gap-2">
              <span className="titular text-2xl sm:text-3xl">
                <span className="text-verde-600">PERIÓDICO</span>{' '}
                <span className="text-tinta">DELFOS</span>
              </span>
              <span
                aria-hidden="true"
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-amarillo"
              />
            </span>
            <span className="meta mt-1 block text-amarillo">
              La voz de las Tiburonas
            </span>
          </Link>

          <Link
            href="/buscar"
            className="tactil flex items-center gap-2 rounded-sm border border-linea bg-tarjeta px-3 text-gris hover:border-verde-600 hover:text-tinta"
          >
            <Search size={18} aria-hidden="true" className="shrink-0" />
            <span className="hidden font-display text-[13px] sm:inline">
              Buscar crónicas, jugadoras…
            </span>
            <span className="sr-only sm:hidden">Buscar</span>
          </Link>
        </div>
      </div>

      {/* En 375px la nav scrollea en lugar de apilarse: no se come el alto del
          viewport antes de que aparezca la primera nota. */}
      <nav aria-label="Secciones" className="border-t border-linea bg-papel-alt">
        <div className="mx-auto max-w-[1200px] px-4">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECCIONES.map((seccion) => (
              <li key={seccion.href} className="shrink-0">
                <Link
                  href={seccion.href}
                  className="meta tactil flex items-center rounded-sm px-3 text-gris hover:bg-tarjeta-hover hover:text-verde-600"
                >
                  {seccion.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  )
}
