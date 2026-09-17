import { ChipResultado } from '@/components/partido/ChipResultado'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { estadoTemporada, ventanaFechaAFecha } from '@/lib/temporada'
import type { PartidoConEquipos, Temporada } from '@/types'

/**
 * La franja de resultados de la temporada, con el próximo partido destacado.
 *
 * Recibe la temporada entera y muestra sólo una ventana —los últimos jugados y
 * los que vienen, ver `ventanaFechaAFecha()`—: una tira que arranca en la fecha
 * 1 deja el próximo partido fuera de la pantalla, y sin JavaScript no se la
 * puede abrir scrolleada. El fixture completo está en el link de la cabecera.
 *
 * En 375px scrollea la franja, no el documento. Cada ficha es un link, así que
 * el contenedor ya se recorre con el teclado sin `tabindex`.
 */
interface Props {
  id: string
  partidos: readonly PartidoConEquipos[]
  temporada: Temporada
}

export function FechaAFecha({ id, partidos, temporada }: Props) {
  const visibles = ventanaFechaAFecha(partidos)
  const { proximo } = estadoTemporada(partidos)

  return (
    <section aria-labelledby={id} className="mt-14">
      <CabeceraBloque
        id={id}
        titulo="Fecha a fecha"
        enlace={{ href: `/temporada/${temporada.slug}`, texto: 'Fixture completo' }}
      />

      {visibles.length === 0 ? (
        <p className="max-w-medida font-body text-gris">
          Todavía no hay partidos cargados en {temporada.nombre}. Cada uno se
          carga desde el admin con su planilla, y de ahí sale sola esta franja.
        </p>
      ) : (
        <ol className="flex items-stretch gap-3 overflow-x-auto pb-2">
          {visibles.map((partido) => (
            <li key={partido.id} className="shrink-0">
              <ChipResultado partido={partido} destacado={partido.id === proximo?.id} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
