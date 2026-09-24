import Link from 'next/link'
import { etiquetaFecha } from '@/lib/formato'
import {
  ETIQUETA_ESTADO,
  golesResumidos,
  ladosDelPartido,
  tituloAccesible,
} from '@/lib/partido'
import type { EventoConJugadora, PartidoConEquipos } from '@/types'

/**
 * El último resultado, pegado abajo de la tapa.
 *
 * **Reemplaza a `<FechaAFecha />` en la portada**, que no estaba en el boceto y
 * era la tercera puerta a la misma información: la barra de estado ya lleva el
 * último resultado y la posición en la tabla arriba de todas las páginas, y la
 * nav tiene "Fixture y tabla". La franja no se tiró; su lugar es
 * `/temporada/[slug]`, donde el fixture es el contenido y no una repetición.
 *
 * **Es una franja de tres renglones centrados, y no el bloque a dos columnas
 * del boceto.** El boceto pone el marcador a la izquierda y los goles en una
 * columna lateral con su propio filete: con la planilla cargada eso medía 200px
 * de alto en escritorio para decir un resultado. Apilado y centrado —estado,
 * marcador, goles en una línea— el mismo contenido entra en menos de la mitad.
 * Es la forma en que lo muestran los marcadores deportivos, y por la misma
 * razón: esto es un dato de servicio, no una nota.
 *
 * **Un solo layout para todos los anchos.** Los dos que había —una card de tres
 * líneas en celular y el bloque del boceto en escritorio— eran dos diseños para
 * el mismo dato, y el de escritorio era el que sobraba de alto.
 *
 * **Los goles van agrupados por equipo y no coloreados uno por uno.** "Aldosivi
 * Larea 12', Cortadi 23'" dice de quién es cada gol con palabras; distinguirlos
 * sólo por el color del texto deja afuera a quien no ve esa diferencia (WCAG
 * 1.4.1). El color acompaña, no informa solo.
 */

/**
 * Cuántos goles se nombran antes de mandar a la ficha.
 *
 * El corte existe por el partido que hay cargado: la fecha 4 contra Claypole
 * terminó 6-1, y siete goles en un renglón lo parten en tres. Los que sobran se
 * cuentan y el link los ofrece.
 */
const GOLES_VISIBLES = 5

interface Props {
  id: string
  partido: PartidoConEquipos
  eventos: readonly EventoConJugadora[]
  /** Sólo lo cambia el banco de pruebas, como en `<ChipResultado />`. */
  rutaBase?: string
}

export function UltimoResultado({ id, partido, eventos, rutaBase = '/partido' }: Props) {
  const lados = ladosDelPartido(partido)
  const { lineas, restantes } = golesResumidos({ ...partido, eventos }, GOLES_VISIBLES)
  const hayResultado = lados.golesIzquierda !== null && lados.golesDerecha !== null
  const hayPlanilla = lineas.length > 0

  // `ladosDelPartido()` pone a Aldosivi siempre a la izquierda, sea local o
  // visitante, así que el lado de cada gol se decide comparando contra el
  // equipo que quedó de ese lado y no contra local/visitante.
  const golesIzquierda = lineas.filter((l) => l.esDeAldosivi === lados.izquierda.es_aldosivi)
  const golesDerecha = lineas.filter((l) => l.esDeAldosivi !== lados.izquierda.es_aldosivi)

  return (
    <section
      aria-labelledby={id}
      className="mt-[1.4rem] border border-linea bg-tarjeta px-4 py-2 text-center"
    >
      <h2 id={id} className="sr-only">
        Último resultado. {tituloAccesible(partido)}
      </h2>

      {/* Renglón 1: de qué partido se trata y en qué estado está. */}
      <p className="meta flex flex-wrap items-baseline justify-center gap-x-2 text-[0.6rem] text-gris">
        <span>{etiquetaFecha(partido)}</span>
        <span className="text-verde-600">{ETIQUETA_ESTADO[partido.estado]}</span>
      </p>

      {/* Renglón 2: el marcador. `minmax(0,1fr)` en los nombres para que uno
          largo de una sola palabra —"Comunicaciones"— encoja en lugar de empujar
          la caja del resultado fuera de la tarjeta. */}
      <div
        aria-hidden="true"
        className="mt-0.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3"
      >
        <span className="block min-w-0 truncate text-right font-display text-[clamp(0.8rem,2.6vw,1rem)] font-extrabold uppercase leading-none text-tinta">
          {lados.izquierda.nombre_corto}
        </span>

        {hayResultado ? (
          <span className="dato bg-tinta px-2 py-[0.15rem] text-[clamp(1.05rem,3.4vw,1.45rem)] font-medium leading-none tracking-[-0.03em] text-amarillo">
            {lados.golesIzquierda}-{lados.golesDerecha}
          </span>
        ) : (
          <span className="font-display text-[0.9rem] font-semibold uppercase leading-none text-gris">
            vs
          </span>
        )}

        <span className="block min-w-0 truncate text-left font-display text-[clamp(0.8rem,2.6vw,1rem)] font-extrabold uppercase leading-none text-tinta">
          {lados.derecha.nombre_corto}
        </span>
      </div>

      {/* Renglón 3: los goles en una línea, y la puerta a la ficha. */}
      <p className="mt-1 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-0.5 text-[0.72rem] leading-snug">
        {hayPlanilla ? (
          <>
            <GolesDe equipo={lados.izquierda.nombre_corto} goles={golesIzquierda} />
            <GolesDe equipo={lados.derecha.nombre_corto} goles={golesDerecha} />
            <Link
              href={`${rutaBase}/${partido.slug}`}
              className="font-display font-bold text-verde-600 underline underline-offset-[3px]"
            >
              {restantes > 0 ? `+${restantes} y la planilla` : 'La planilla'}
            </Link>
          </>
        ) : (
          // Un partido puede estar cargado sin planilla: el resultado entra
          // primero y los goles se cargan después. Sin planilla el link no
          // lleva a nada que no se esté viendo ya, así que no se dibuja.
          <span className="meta border border-linea px-1.5 text-[0.6rem] leading-[1.6] text-gris">
            Planilla pendiente
          </span>
        )}
      </p>
    </section>
  )
}

/**
 * "Aldosivi Larea 12', Cortadi 23' (p)" — un equipo y sus goles.
 *
 * No dibuja nada si ese equipo no convirtió: un "Claypole" suelto sin goles
 * detrás se lee como un dato que falta.
 */
function GolesDe({
  equipo,
  goles,
}: {
  equipo: string
  goles: readonly { clave: string; minuto: string; quien: string; accesible: string }[]
}) {
  if (goles.length === 0) return null

  return (
    <span className="text-gris">
      <span className="font-display font-bold text-tinta">{equipo}</span>{' '}
      {goles.map((gol, i) => (
        <span key={gol.clave}>
          <span className="sr-only">{gol.accesible}</span>
          <span aria-hidden="true">
            {i > 0 && ', '}
            {gol.quien} <span className="dato">{gol.minuto}</span>
          </span>
        </span>
      ))}
    </span>
  )
}
