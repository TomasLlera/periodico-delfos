import type { ReactNode } from 'react'
import Link from 'next/link'
import { fechaHoraPartido, rival } from '@/lib/formato'
import { ETIQUETA_ESTADO, ladosDelPartido, tituloAccesible } from '@/lib/partido'
import type { FilaTablaConEquipo, PartidoConEquipos, Temporada } from '@/types'

/**
 * La tira de datos que los dos bocetos tienen arriba de la cabecera: último
 * resultado, próximo partido y posición en la tabla.
 *
 * **No consulta nada**: recibe los tres datos ya leídos. Es lo que permite
 * mirarla en `/demo/widgets` sin base, y lo que la deja fuera de `/` hasta que
 * haya datos deportivos cargados —un marcador inventado en el borde superior
 * de todas las páginas es la peor forma posible de romper la regla no
 * negociable 1—.
 *
 * **Va estática arriba de todo, no `fixed`.** El blueprint la pide "fija
 * arriba, siempre visible" y los dos bocetos la dibujan como la primera franja
 * del documento: pegada al viewport se comería 40px de alto en 375px, que es
 * donde el titular de tapa ya entra justo.
 *
 * Los colores no dependen del tema: `negro-cancha` es oscuro en los dos, así
 * que acá el fondo manda sobre el tema, como en la cabecera. El amarillo del
 * marcador lleva texto `negro-cancha` y no `tinta`, que en oscuro es casi
 * blanco y sobre amarillo no llega a AA (medido: 8.02:1 en claro, 9.62:1 en
 * oscuro).
 */
interface Props {
  temporada: Temporada
  ultimo: PartidoConEquipos | null
  proximo: PartidoConEquipos | null
  posicion: FilaTablaConEquipo | null
}

export function BarraEstado({ temporada, ultimo, proximo, posicion }: Props) {
  const piezas: { id: string; nodo: ReactNode }[] = []

  if (ultimo) piezas.push({ id: 'ultimo', nodo: <Ultimo partido={ultimo} /> })
  if (proximo) piezas.push({ id: 'proximo', nodo: <Proximo partido={proximo} /> })
  if (posicion) {
    piezas.push({ id: 'tabla', nodo: <Posicion fila={posicion} temporada={temporada} /> })
  }

  // Sin ninguno de los tres datos la barra no se dibuja. Una franja que diga
  // "todavía no hay resultados" arriba de todas las páginas es ruido fijo.
  if (piezas.length === 0) return null

  return (
    <aside
      aria-label={`Aldosivi en ${temporada.nombre}`}
      className="bg-negro-cancha text-white"
    >
      {/* En 375px scrollea esta tira y no el documento: los tres datos no
          entran en una línea y ninguno se puede abreviar más. */}
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 py-2 text-[0.8rem] sm:gap-5">
        {piezas.map((pieza, indice) => (
          <div key={pieza.id} className="flex shrink-0 items-center gap-4 sm:gap-5">
            {indice > 0 && (
              <span aria-hidden="true" className="text-white/25">
                |
              </span>
            )}
            {pieza.nodo}
          </div>
        ))}
      </div>
    </aside>
  )
}

/**
 * El texto visible va con `aria-hidden` y el nombre accesible sale del
 * `sr-only`, como en `<PlanillaCompacta />`: "2 - 1" leído en voz alta no dice
 * de quién es cada número.
 *
 * `relative` es lo que mantiene ese `sr-only` adentro de la barra: es
 * `position:absolute`, y sin ancestro posicionado se ubica contra el documento.
 * En una tira que scrollea horizontal eso estira el ancho de la página entera.
 */
function Dato({ href, children, descripcion }: {
  href: string
  children: ReactNode
  descripcion: string
}) {
  return (
    <Link
      href={href}
      className="relative flex shrink-0 items-center gap-2 hover:text-amarillo"
    >
      <span className="sr-only">{descripcion}</span>
      <span aria-hidden="true" className="flex items-center gap-2">
        {children}
      </span>
    </Link>
  )
}

function Etiqueta({ children }: { children: ReactNode }) {
  return <span className="meta text-[0.65rem] text-white/60">{children}</span>
}

function Ultimo({ partido }: { partido: PartidoConEquipos }) {
  const lados = ladosDelPartido(partido)

  return (
    <Dato
      href={`/partido/${partido.slug}`}
      descripcion={`Último partido. ${tituloAccesible(partido)}`}
    >
      <Etiqueta>{partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : 'Último'}</Etiqueta>
      <span className="font-display font-semibold">{lados.izquierda.nombre_corto}</span>
      <span className="dato bg-amarillo px-1.5 py-[0.1rem] font-bold text-negro-cancha">
        {lados.golesIzquierda} - {lados.golesDerecha}
      </span>
      <span className="font-display">{lados.derecha.nombre_corto}</span>
      {partido.estado !== 'finalizado' && (
        <span className="meta text-[0.65rem] text-amarillo">
          {ETIQUETA_ESTADO[partido.estado]}
        </span>
      )}
    </Dato>
  )
}

function Proximo({ partido }: { partido: PartidoConEquipos }) {
  const otro = rival(partido)
  const condicion = partido.equipo_local.es_aldosivi ? 'Local' : 'Visitante'

  return (
    <Dato
      href={`/partido/${partido.slug}`}
      descripcion={`Próximo partido. ${tituloAccesible(partido)}`}
    >
      <Etiqueta>Próximo</Etiqueta>
      <span className="font-display font-semibold">vs. {otro.nombre_corto}</span>
      <Etiqueta>{condicion}</Etiqueta>
      <span className="dato text-white/70">{fechaHoraPartido(partido.fecha_hora)}</span>
    </Dato>
  )
}

function Posicion({
  fila,
  temporada,
}: {
  fila: FilaTablaConEquipo
  temporada: Temporada
}) {
  const puntos = `${fila.puntos} ${fila.puntos === 1 ? 'punto' : 'puntos'}`

  return (
    <Dato
      href={`/temporada/${temporada.slug}?ver=tabla`}
      descripcion={`Tabla de posiciones: Aldosivi va ${fila.posicion} con ${puntos}, a la fecha ${fila.fecha_numero}.`}
    >
      <Etiqueta>Tabla</Etiqueta>
      <span className="dato font-bold">{fila.posicion}°</span>
      <span className="dato text-white/70">{fila.puntos} pts</span>
    </Dato>
  )
}
