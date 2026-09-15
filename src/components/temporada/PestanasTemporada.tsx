import Link from 'next/link'
import { PESTANAS, PESTANA_POR_OMISION, type Pestana } from '@/lib/temporada'

/**
 * Las tres vistas de la temporada: fixture, tabla y goleadoras.
 *
 * **Son links, no `role="tablist"`.** Unas pestañas ARIA de verdad necesitan
 * manejo de foco con flechas y estado en el cliente, y esta página es un
 * Server Component: unas pestañas falsas —el `role` puesto sin el teclado que
 * implica— son peores que unos links, que ya se navegan con Tab y se anuncian
 * solos. Con la vista en la URL, además, cada pestaña se puede compartir.
 *
 * La del fixture apunta a la ruta pelada, sin `?ver=fixture`: es la canonical,
 * y no tiene sentido tener dos URLs para la misma página.
 */
interface Props {
  slug: string
  actual: Pestana
}

const BASE =
  'tactil -mb-px flex items-center border-b-[3px] px-4 font-display text-[0.9rem] font-bold tracking-[0.02em]'

export function PestanasTemporada({ slug, actual }: Props) {
  return (
    // Igual que la nav del header: en 375px scrollea en lugar de apilarse.
    <nav aria-label="Vistas de la temporada" className="border-b border-linea">
      <ul className="-mx-4 flex overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PESTANAS.map((pestana) => {
          const activa = pestana.clave === actual
          const href =
            pestana.clave === PESTANA_POR_OMISION
              ? `/temporada/${slug}`
              : `/temporada/${slug}?ver=${pestana.clave}`

          return (
            <li key={pestana.clave} className="shrink-0">
              <Link
                href={href}
                aria-current={activa ? 'page' : undefined}
                className={
                  activa
                    ? `${BASE} border-verde-600 text-verde-600`
                    : `${BASE} border-transparent text-gris hover:text-tinta`
                }
              >
                {pestana.titulo}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
