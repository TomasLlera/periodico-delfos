import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import type { FilaTablaConEquipo } from '@/types'

/**
 * La tabla de posiciones de la portada: cuatro columnas y tipografía chica.
 *
 * **Es la versión corta a propósito.** La tabla entera tiene once columnas —PJ,
 * G, E, P, GF, GC, DG, PTS— y acá van las tres cosas que alguien mira de una
 * tabla al pasar: en qué puesto está cada uno, cuántos jugó y cuántos puntos
 * tiene. El resto está a un click, en el fixture.
 *
 * **Sigue siendo la versión corta aunque el bloque ya no esté en la columna
 * angosta.** La tabla pasó a ocupar el ancho entero, entre las notas y las
 * secciones, y la primera versión de eso mostraba las once columnas de `md`
 * para arriba. Se volvió a esta: en la portada la tabla es un dato de paso, y
 * once columnas la convierten en la pantalla de consulta que ya existe en
 * `/fixture`. Lo que cambió es dónde está, no cuánto muestra.
 *
 * **No es otra tabla, es la misma mirada corta.** Los datos salen de las mismas
 * filas que dibuja `<TablaPosiciones />`; lo único que cambia es cuántas
 * columnas se muestran. No hay un segundo cálculo que pueda contradecir al
 * primero.
 *
 * **Aldosivi va resaltado**, como en la tabla completa: es un medio sobre
 * Aldosivi y lo primero que busca el ojo es dónde está. Va con fondo, negrita y
 * color — nunca con color solo, que no se ve en escala de grises.
 *
 * Cuatro columnas entran en 375px sin desplazarse a lo ancho, así que no lleva
 * contenedor con `overflow`: no hay nada que scrollear.
 */
interface Props {
  filas: readonly FilaTablaConEquipo[]
  /** A qué fecha corresponde. Va en el `<caption>`, que es el dato que no se ve. */
  fecha: number | null
  temporada: string
}

export function TablaCompacta({ filas, fecha, temporada }: Props) {
  if (filas.length === 0) return null

  return (
    <table className="w-full border-collapse text-left">
      <caption className="mb-3 text-left font-display text-[0.8rem] leading-snug text-text-muted">
        {/* "Tras la fecha N" y no "actualizada a la fecha N": en la portada el
            dato es a qué altura del campeonato corresponde lo que se está
            mirando, no cuándo se cargó. */}
        {fecha !== null ? `Tras la fecha ${fecha} · ${temporada}` : temporada}
      </caption>

      <thead>
        <tr className="border-b-2 border-border-strong">
          <th scope="col" className="meta py-2 pr-2 text-[0.65rem]">
            <span className="sr-only">Posición</span>
            <span aria-hidden="true">#</span>
          </th>
          <th scope="col" className="meta py-2 text-[0.65rem]">
            Equipo
          </th>
          <th scope="col" className="meta py-2 pl-2 text-right text-[0.65rem]">
            <span className="sr-only">Partidos jugados</span>
            <span aria-hidden="true">PJ</span>
          </th>
          <th scope="col" className="meta py-2 pl-2 text-right text-[0.65rem]">
            <span className="sr-only">Puntos</span>
            <span aria-hidden="true">PTS</span>
          </th>
        </tr>
      </thead>

      <tbody>
        {filas.map((fila) => (
          <tr
            key={fila.id}
            className={`border-b border-border ${fila.equipo.es_aldosivi ? 'bg-bg-muted' : ''}`}
          >
            <td className="dato py-2 pr-2 text-[0.8rem] text-text-muted">{fila.posicion}</td>

            <th scope="row" className="py-2 font-normal">
              <span className="flex items-center gap-2">
                <EscudoEquipo equipo={fila.equipo} tamano={18} />
                <span
                  className={`font-display text-[0.85rem] leading-tight ${
                    fila.equipo.es_aldosivi ? 'font-bold text-accent-text' : 'text-text'
                  }`}
                >
                  {fila.equipo.nombre_corto}
                </span>
              </span>
            </th>

            <td className="dato py-2 pl-2 text-right text-[0.8rem] text-text-soft">
              {fila.jugados}
            </td>

            <td
              className={`dato py-2 pl-2 text-right text-[0.9rem] ${
                fila.equipo.es_aldosivi ? 'font-bold text-accent-text' : 'font-bold text-text'
              }`}
            >
              {fila.puntos}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
