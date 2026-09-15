import Link from 'next/link'
import { FotoJugadora } from '@/components/jugadora/FotoJugadora'
import type { Goleadora } from '@/types'

/**
 * Las goleadoras de la temporada.
 *
 * Sale de la vista `goleadoras` (ver `0006_vistas.sql`), que cuenta los goles
 * desde los eventos de cada planilla: **cero mantenimiento**. No hay una tabla
 * de goleadoras que alguien tenga que actualizar, y por eso es el único
 * ranking del sitio que no puede quedar desactualizado.
 *
 * Es una `<ol>`: el orden *es* el dato. Con `<ul>` un lector de pantalla no
 * anuncia la posición y el ranking se pierde.
 */
interface Props {
  goleadoras: readonly Goleadora[]
  temporada: string
}

export function ListaGoleadoras({ goleadoras, temporada }: Props) {
  if (goleadoras.length === 0) {
    return (
      <div className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
        <p className="font-body text-[1.05rem] leading-relaxed text-tinta-suave">
          Todavía no hay goles cargados en {temporada}.
        </p>
        <p className="mt-3 font-body text-gris">
          Esta lista se arma sola con los goles de cada planilla de partido: no
          se escribe a mano en ningún lado.
        </p>
      </div>
    )
  }

  return (
    <ol className="flex flex-col">
      {goleadoras.map((goleadora, indice) => (
        <li key={goleadora.jugadora_id} className="border-b border-linea">
          <Link
            href={`/jugadora/${goleadora.slug}`}
            className="group flex items-center gap-3 py-3 transition-colors hover:bg-papel-alt sm:gap-4"
          >
            <span aria-hidden="true" className="dato w-6 shrink-0 text-center text-[0.9rem] text-gris">
              {indice + 1}
            </span>

            {/* El ancho lo pone este contenedor y no una clase pasada a
                `<FotoJugadora />`: adentro la foto es `w-full`, y entre dos
                utilidades de ancho gana la que Tailwind ordene última, no la
                que se escribió después. Pasar `w-12` dejaba el avatar a ancho
                completo y sacaba la fila 111px afuera del viewport en 375. */}
            <span className="block w-12 shrink-0 overflow-hidden rounded-full">
              <FotoJugadora jugadora={goleadora} aspecto="aspect-square" sizes="48px" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-display text-[0.8rem] leading-tight text-gris">
                {goleadora.nombre}
              </span>
              <span className="titular block text-[1.05rem] leading-[1.1] group-hover:text-verde-600">
                {goleadora.apellido}
              </span>
            </span>

            <span className="shrink-0 text-right">
              <span className="marca block text-[1.6rem] leading-none text-verde-600">
                {goleadora.goles}
              </span>
              <span className="meta block text-[0.65rem]">
                {goleadora.goles === 1 ? 'gol' : 'goles'}
              </span>
              {goleadora.de_penal > 0 && (
                <span className="dato block text-[0.7rem] leading-tight text-gris">
                  {goleadora.de_penal} de penal
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
