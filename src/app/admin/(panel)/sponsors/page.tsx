import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Pencil, Plus } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'
import {
  ETIQUETA_ESTADO_SPONSOR,
  ETIQUETA_UBICACION,
  estadoDeSponsor,
  hoyEnArgentina,
} from '@/lib/sponsors'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getSponsorsDelAdmin } from '@/lib/supabase/queries/sponsors'

/**
 * Los espacios de publicidad.
 *
 * **Sólo para editores**, igual que la pantalla de autores: vender un espacio no
 * es una tarea de redacción. Se chequea acá además de en el action, y la defensa
 * real es la política `gestion_editor` de la `0016`.
 *
 * **Muestra los vencidos y los que todavía no arrancaron**, que es justamente
 * lo que el sitio público no puede ver. Es la pantalla donde se controla una
 * campaña, así que esconder lo que no está al aire sería esconder la mitad del
 * trabajo.
 *
 * Dinámica y sin cache, como todo el panel: el que mira es el que escribe.
 */
export const metadata: Metadata = { title: 'Sponsors' }
export const dynamic = 'force-dynamic'

/** El color del estado. El texto lo dice igual: el color solo no alcanza. */
const TONO = {
  activo: 'bg-text text-bg',
  programado: 'border border-border-control text-text-muted',
  vencido: 'border border-border-control text-text-muted',
  apagado: 'border border-danger text-danger',
} as const

export default async function Sponsors() {
  const yo = await getAutorDeLaSesion()
  if (!yo) redirect('/admin/login')
  if (yo.rol !== 'editor') redirect('/admin')

  const sponsors = await getSponsorsDelAdmin()
  const hoy = hoyEnArgentina()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <h1 className="titular text-[1.6rem]">Sponsors</h1>

        <Link
          href="/admin/sponsors/nuevo"
          className="tactil ml-auto flex items-center gap-2 bg-accent px-4 font-display text-[0.9rem] font-extrabold text-accent-contrast hover:bg-accent/90"
        >
          <Plus size={16} aria-hidden="true" />
          Sponsor nuevo
        </Link>
      </div>

      {sponsors.length === 0 ? (
        <Aviso>
          Todavía no hay sponsors cargados. Mientras no haya ninguno vigente, los
          huecos no se dibujan en el sitio: no queda un recuadro vacío ni un
          «espacio disponible».
        </Aviso>
      ) : (
        <ul>
          {sponsors.map((sponsor) => {
            const estado = estadoDeSponsor(sponsor, hoy)

            return (
              <li
                key={sponsor.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border py-3"
              >
                <span className={`meta px-2 py-0.5 ${TONO[estado]}`}>
                  {ETIQUETA_ESTADO_SPONSOR[estado]}
                </span>

                <Link
                  href={`/admin/sponsors/${sponsor.id}`}
                  className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
                >
                  {sponsor.nombre}
                </Link>

                <span className="text-[0.85rem] text-text-muted">
                  {ETIQUETA_UBICACION[sponsor.ubicacion]}
                </span>

                <span className="ml-auto flex items-center gap-3 text-[0.85rem] text-text-muted">
                  {/* Las fechas en `dato` —la tipografía monoespaciada— para que
                      una columna de vencimientos se lea de arriba abajo sin
                      bailar. */}
                  <span className="dato">
                    {sponsor.desde}
                    {sponsor.hasta ? ` → ${sponsor.hasta}` : ' → sin fin'}
                  </span>
                  <Link
                    href={`/admin/sponsors/${sponsor.id}`}
                    className="tactil flex items-center gap-1 hover:underline"
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Editar
                  </Link>
                </span>
              </li>
            )
          })}
        </ul>
      )}

      <p className="mt-6 text-[0.85rem] text-text-muted">
        Las medidas que hay que pedirle al anunciante: <strong>728 × 90</strong>{' '}
        para los dos huecos de la portada y <strong>300 × 250</strong> para el de
        la columna de las notas.
      </p>
    </main>
  )
}
