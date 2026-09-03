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
    <footer className="mt-16 border-t-4 border-[var(--color-amarillo)] bg-[var(--color-verde-900)] text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-[2fr_1fr_1fr]">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl font-bold">
              Periódico Delfos
            </p>
            <p className="mt-2 max-w-[40ch] text-sm leading-relaxed text-white/70">
              El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis y
              estadísticas de las Tiburonas, desde Mar del Plata.
            </p>
          </div>

          {SECCIONES.map((seccion) => (
            <nav key={seccion.titulo} aria-label={seccion.titulo}>
              <h2 className="font-[family-name:var(--font-display)] text-[13px] font-medium uppercase tracking-[0.06em] text-[var(--color-amarillo)]">
                {seccion.titulo}
              </h2>
              <ul className="mt-3 space-y-2">
                {seccion.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/80 underline-offset-4 hover:text-white hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-10 border-t border-white/15 pt-6 text-[13px] text-white/60">
          © {anio} Periódico Delfos · Mar del Plata, Argentina
        </p>
      </div>
    </footer>
  )
}
