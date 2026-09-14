import Link from 'next/link'

/**
 * Todos los destinos son reales.
 *
 * El footer de WordPress arrastra links del demo import del theme: Cookies
 * apunta a /blog/, Términos a /contact-2/ y Contacto a /contact-3/. Y los
 * títulos están en inglés ("Useful Links", "Read More"). Acá no.
 */
const SECCIONES = [
  {
    titulo: 'El equipo',
    links: [
      { href: '/plantel', label: 'Plantel' },
      { href: '/cronicas', label: 'Crónicas' },
      { href: '/analisis', label: 'Análisis' },
    ],
  },
  {
    titulo: 'El medio',
    links: [
      { href: '/quienes-somos', label: 'Quiénes somos' },
      { href: '/contacto', label: 'Contacto' },
      { href: '/privacidad', label: 'Privacidad' },
    ],
  },
] as const

export function Footer() {
  const anio = new Date().getFullYear()

  return (
    <footer className="franja mt-16 border-t-4 border-amarillo">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="titular text-xl">
              <span className="text-verde-600">PERIÓDICO</span>{' '}
              <span className="text-tinta">DELFOS</span>
            </p>
            <p className="mt-3 max-w-[40ch] font-display text-sm leading-relaxed text-gris">
              El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis y
              estadísticas de las Tiburonas, desde Mar del Plata.
            </p>

            <p className="mt-4 inline-flex items-center gap-2 rounded-sm border border-linea bg-tarjeta px-3 py-1">
              <span
                aria-hidden="true"
                className="inline-block h-2 w-2 rounded-full bg-verde-600"
              />
              <span className="meta text-tinta">Mar del Plata, Argentina</span>
            </p>
          </div>

          {SECCIONES.map((seccion) => (
            <nav key={seccion.titulo} aria-label={seccion.titulo}>
              <h2 className="meta text-amarillo">{seccion.titulo}</h2>
              <ul className="mt-3 space-y-2">
                {seccion.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-display text-sm text-gris underline-offset-4 hover:text-verde-600 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-linea pt-6 font-display text-[13px] text-gris-tenue">
          © {anio} Periódico Delfos · Hecho para el fútbol femenino argentino
        </p>
      </div>
    </footer>
  )
}
