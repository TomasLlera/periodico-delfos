/**
 * La caja de autor del pie de la nota: foto, bio y redes.
 *
 * Un medio de una sola persona vive de que se sepa quién lo escribe, así que
 * la caja va aunque el autor no tenga foto ni bio cargadas: el nombre y el
 * link a Quiénes somos son lo mínimo, y nunca faltan.
 */

import Link from 'next/link'
import type { Autor } from '@/types'

export function CajaAutor({ autor }: { autor: Autor }) {
  return (
    <aside className="mt-12 flex gap-4 rounded-md border border-linea bg-papel-alt p-4 sm:p-5">
      {autor.foto_url && (
        <img
          src={autor.foto_url}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
      )}

      <div className="min-w-0">
        <p className="meta">Quién lo escribe</p>
        <p className="mt-1 font-display text-[17px] font-semibold">{autor.nombre}</p>

        {autor.bio && (
          <p className="mt-2 max-w-[60ch] font-body text-[15px] leading-relaxed text-gris">
            {autor.bio}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/quienes-somos"
            className="meta text-verde-600 hover:underline"
          >
            Quiénes somos
          </Link>

          {autor.instagram && (
            <EnlaceRed
              href={`https://instagram.com/${autor.instagram.replace(/^@/, '')}`}
              etiqueta={`${autor.nombre} en Instagram`}
            >
              <LogoInstagram />
              <span className="meta">@{autor.instagram.replace(/^@/, '')}</span>
            </EnlaceRed>
          )}

          {autor.x_handle && (
            <EnlaceRed
              href={`https://x.com/${autor.x_handle.replace(/^@/, '')}`}
              etiqueta={`${autor.nombre} en X`}
            >
              <LogoX />
              <span className="meta">@{autor.x_handle.replace(/^@/, '')}</span>
            </EnlaceRed>
          )}
        </div>
      </div>
    </aside>
  )
}

function EnlaceRed({
  href,
  etiqueta,
  children,
}: {
  href: string
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      rel="noopener noreferrer"
      aria-label={etiqueta}
      className="flex items-center gap-1.5 text-gris hover:text-verde-600"
    >
      {children}
    </a>
  )
}

/**
 * Los logos de marca se dibujan a mano porque **lucide v1 los sacó de la
 * biblioteca**: `Instagram` y el pájaro de Twitter existían en la v0 y ya no.
 * Es la misma excepción que la pelota de `IconoEvento.tsx`, no un descuido.
 * Van con `fill="currentColor"` para que hereden el color del link en los dos
 * temas.
 */
function LogoX() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23.2 22h-6.5l-5.1-6.6L5.8 22H2.7l7.6-8.7L1.9 2h6.6l4.6 6.1L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
    </svg>
  )
}

function LogoInstagram() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M17.5 6.5h.01" />
    </svg>
  )
}
