import { EventoPlanilla } from '@/components/partido/EventoPlanilla'
import { agruparPorMinuto, ladosDelPartido } from '@/lib/partido'
import type { PartidoCompleto } from '@/types'

interface Props {
  partido: PartidoCompleto
}

/**
 * La línea de tiempo **horizontal**: los minutos avanzan de izquierda a derecha
 * sobre un eje central, con los eventos de Aldosivi arriba y los del rival
 * abajo.
 *
 * Era vertical y se dio vuelta porque dentro de una nota la versión vertical
 * crece hacia abajo tanto como eventos tenga el partido, y empuja el resto del
 * artículo fuera de la pantalla. En horizontal ocupa un alto fijo: un partido
 * de dos goles y uno de nueve miden lo mismo.
 *
 * Lo que **no** cambió, porque no es cuestión de layout:
 *
 * - Cada minuto sigue siendo un `<li>` con la frase completa de lo que pasó, y
 *   la grilla visual sigue con `aria-hidden`. Una tabla leída celda por celda
 *   —"Cortadi", "23 apóstrofo", vacío— no comunica nada; lo que se escucha es
 *   "Minuto 23. Gol de Aldosivi: Lucía Cortadi.".
 * - `agruparPorMinuto()` no se tocó: es lógica pura y no sabe de layout.
 * - No hay links a jugadoras acá adentro: un elemento enfocable dentro de un
 *   contenedor `aria-hidden` es una trampa de teclado.
 *
 * El scroll horizontal vive **sólo** en esta tira, nunca en el body de la
 * página. `grid-rows-subgrid` es lo que mantiene el eje de minutos derecho: sin
 * él cada columna resuelve sus tres filas por su cuenta y el eje queda en
 * escalera cuando una columna tiene dos eventos y su vecina ninguno.
 */
export function LineaDeTiempo({ partido }: Props) {
  const grupos = agruparPorMinuto(partido)

  if (grupos.length === 0) {
    return (
      <p className="py-6 text-center font-display text-sm text-gris">
        {partido.estado === 'programado'
          ? 'El partido todavía no se jugó.'
          : 'Sin goles ni tarjetas cargadas en este partido.'}
      </p>
    )
  }

  const lados = ladosDelPartido(partido)

  return (
    <div className="font-display">
      {/* Arriba y abajo del eje hay dos equipos y nada que lo diga: en vertical
          lo resolvía la cabecera con los escudos a izquierda y derecha. Va
          `aria-hidden` porque cada frase del `sr-only` ya nombra al equipo. */}
      <p
        aria-hidden="true"
        className="meta mb-1 flex items-center justify-center gap-2 text-[11px]"
      >
        <span>↑ {lados.izquierda.nombre_corto}</span>
        <span>·</span>
        <span>↓ {lados.derecha.nombre_corto}</span>
      </p>

      {/* `relative` no es decorativo: los `sr-only` de cada evento y los iconos
          son `position: absolute`, y sin un contenedor posicionado su bloque
          contenedor es la página. Se escapaban del scroll horizontal y estiraban
          el documento a 1117px en un viewport de 375 — scroll lateral en toda la
          página, en la planilla, en la nota y en la ficha de partido. Con esto
          el contenedor con scroll pasa a ser su bloque contenedor y quedan
          adentro. */}
      {/* `tabIndex={0}` y `role="group"`: un contenedor que scrollea tiene que
          poder recorrerse con el teclado.

          Adentro no hay nada enfocable —los eventos son iconos con su texto en
          un `sr-only`, no links— así que sin esto la línea de tiempo se puede
          arrastrar con el dedo y con el mouse y **no** con las flechas: quien
          navega sin mouse no llega a los goles del segundo tiempo. Es la regla
          `scrollable-region-focusable` de WCAG, y la encontró la auditoría de
          axe del Step 20.

          El `role` con nombre va junto con el `tabIndex` y no es adorno: una
          parada de tabulación sin nombre se anuncia como "grupo" y no dice
          dónde está parado el foco. */}
      <div
        tabIndex={0}
        role="group"
        aria-label="Línea de tiempo del partido, minuto a minuto"
        className="relative -mx-4 overflow-x-auto px-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-600 sm:mx-0 sm:px-0"
      >
        <ol className="grid w-max min-w-full auto-cols-[minmax(4.75rem,1fr)] grid-flow-col grid-rows-[1fr_auto_1fr]">
          {grupos.map((grupo) => (
            <li key={grupo.clave} className="row-span-3 grid grid-rows-subgrid">
              {/* `sr-only` es `position: absolute`, así que no ocupa una fila
                  de la subgrilla. */}
              <span className="sr-only">{grupo.descripcion}</span>

              <span
                aria-hidden="true"
                className="flex flex-col items-center justify-end gap-1.5 px-1 pb-2"
              >
                {grupo.aldosivi.map((evento) => (
                  <EventoPlanilla key={evento.id} evento={evento} alineacion="centro" />
                ))}
              </span>

              <span
                aria-hidden="true"
                className="flex items-center justify-center border-y border-linea bg-papel-alt"
              >
                <span className="dato px-1 py-1 text-[12px] font-medium text-gris sm:text-[13px]">
                  {grupo.etiqueta}
                </span>
              </span>

              <span
                aria-hidden="true"
                className="flex flex-col items-center justify-start gap-1.5 px-1 pt-2"
              >
                {grupo.rival.map((evento) => (
                  <EventoPlanilla key={evento.id} evento={evento} alineacion="centro" />
                ))}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
