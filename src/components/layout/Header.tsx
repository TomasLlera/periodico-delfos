import Link from 'next/link'

const SECCIONES = [
  { href: '/cronicas', label: 'Crónicas' },
  { href: '/analisis', label: 'Análisis' },
  { href: '/plantel', label: 'Plantel' },
  { href: '/quienes-somos', label: 'Quiénes somos' },
] as const

export function Header() {
  return (
    <header className="border-b border-[var(--color-linea)]">
      <div className="mx-auto max-w-[1200px] px-4">
        <div className="flex items-center justify-between gap-4 py-4">
          <Link href="/" className="group">
            <span className="block font-[family-name:var(--font-display)] text-2xl font-bold tracking-[-0.02em] text-[var(--color-verde-900)] sm:text-3xl">
              Periódico Delfos
            </span>
            <span className="meta block">
              Fútbol femenino de Aldosivi
            </span>
          </Link>

          <Link
            href="/buscar"
            className="tactil flex items-center justify-center rounded-[4px] px-3 text-[var(--color-verde-600)] hover:bg-[var(--color-verde-100)]"
            aria-label="Buscar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </Link>
        </div>

        {/* En 375px la nav scrollea en lugar de apilarse: no se come el alto
            del viewport antes de que aparezca la primera nota. */}
        <nav aria-label="Secciones">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECCIONES.map((seccion) => (
              <li key={seccion.href} className="shrink-0">
                <Link
                  href={seccion.href}
                  className="tactil flex items-center rounded-[2px] px-3 font-[family-name:var(--font-display)] text-[13px] font-medium uppercase tracking-[0.06em] text-[var(--color-tinta)] hover:text-[var(--color-verde-600)]"
                >
                  {seccion.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
