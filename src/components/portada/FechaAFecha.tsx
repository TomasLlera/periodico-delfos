import { ChipResultado } from '@/components/partido/ChipResultado'
import { CabeceraBloque } from '@/components/portada/CabeceraBloque'
import { cintaTemporada } from '@/lib/portada'
import type { VentanaCinta } from '@/lib/portada'
import type { PartidoConEquipos, Temporada } from '@/types'

/**
 * La franja de resultados de la temporada: unas pocas fechas alrededor de hoy,
 * en orden cronológico, con el próximo partido destacado. Es el punto 4 de la
 * portada del blueprint (7.2).
 *
 * La ventana —qué partidos entran— la decide `cintaTemporada()`, que está en
 * `lib/` y tiene tests: la cinta **no** muestra la temporada entera, porque un
 * contenedor con scroll horizontal arranca siempre en la fecha 1 y sin
 * JavaScript no hay forma de moverlo. Acá sólo se dibuja.
 *
 * **Sin partidos no se dibuja nada.** Es un widget deportivo: mientras no haya
 * base, la portada real no lo muestra y los marcadores sólo viven en
 * `/demo/portada` (regla no negociable 1).
 */
interface Props {
  partidos: readonly PartidoConEquipos[]
  /** Para el link al fixture completo. Sin temporada, el bloque va sin link. */
  temporada?: Temporada | null
  ventana?: VentanaCinta
}

export function FechaAFecha({ partidos, temporada = null, ventana }: Props) {
  const chips = cintaTemporada(partidos, ventana)

  if (chips.length === 0) return null

  return (
    <section aria-labelledby="fecha-a-fecha" className="mt-14">
      <CabeceraBloque
        id="fecha-a-fecha"
        titulo="Fecha a fecha"
        enlace={
          temporada
            ? { href: `/temporada/${temporada.slug}`, texto: 'El fixture completo' }
            : undefined
        }
      />

      {/* El scroll horizontal queda encerrado en esta lista, que mide lo que el
          contenedor de la portada: los chips son `shrink-0` y en mobile se
          arrastran. El `-mx-1` compensa exactamente al `px-1`, que existe para
          que el foco del primer chip no quede cortado contra el borde del
          contenedor con scroll. El `scroll-px-1` hace que el snap cuente ese
          padding: sin él, el navegador arranca la cinta con `scrollLeft` en 4
          y el filete de color del primer chip nace tapado.

          **`relative` no es decorativo.** Cada chip lleva un `sr-only`, que es
          `position: absolute`, y un absoluto sin ancestro posicionado se mide
          contra el documento: el `overflow-x` de acá no lo contiene y la
          página termina midiendo 1180px en un viewport de 375 sin que se note
          en la captura. Es el bug de scroll horizontal de siempre, con otra
          cara. */}
      <ul className="relative -mx-1 flex snap-x scroll-px-1 gap-3 overflow-x-auto px-1 pb-2">
        {chips.map((chip) => (
          <li key={chip.partido.id} className="flex">
            <ChipResultado chip={chip} />
          </li>
        ))}
      </ul>
    </section>
  )
}
