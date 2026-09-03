import { IconoEvento } from '@/components/partido/IconoEvento'
import { apellidoDeEvento, apellidoQueSale, SUFIJO_EVENTO } from '@/lib/partido'
import type { EventoConJugadora } from '@/types'

interface Props {
  evento: EventoConJugadora
  /** Aldosivi cae a la derecha de su columna; el rival, a la izquierda. */
  alineacion: 'derecha' | 'izquierda'
}

/**
 * Un evento dentro de su columna de la planilla.
 *
 * No lleva link a la ficha de la jugadora a propósito: el bloque entero está
 * marcado `aria-hidden` y la frase accesible la pone la línea de tiempo. Un
 * elemento enfocable dentro de un contenedor oculto es una trampa de teclado.
 * Los links a jugadoras van en las formaciones, que sí son una lista normal.
 */
export function EventoPlanilla({ evento, alineacion }: Props) {
  const alinear = `min-w-0 ${alineacion === 'derecha' ? 'items-end text-right' : 'items-start text-left'}`
  const justificar = alineacion === 'derecha' ? 'justify-end' : 'justify-start'

  if (evento.tipo === 'cambio') {
    return (
      <span className={`flex flex-col gap-0.5 ${alinear}`}>
        <Linea justificar={justificar}>
          <IconoEvento tipo="entra" />
          <span className="min-w-0">{apellidoDeEvento(evento)}</span>
        </Linea>
        <Linea justificar={justificar}>
          <IconoEvento tipo="sale" />
          <span className="min-w-0 text-gris">{apellidoQueSale(evento)}</span>
        </Linea>
        <Detalle texto={evento.detalle} />
      </span>
    )
  }

  const sufijo = SUFIJO_EVENTO[evento.tipo]

  return (
    <span className={`flex flex-col gap-0.5 ${alinear}`}>
      <Linea justificar={justificar}>
        <IconoEvento tipo={evento.tipo} />
        {/* `min-w-0` para que el apellido pueda partirse en dos líneas en vez
            de desbordar su columna en una pantalla muy angosta. */}
        <span className="min-w-0">
          {apellidoDeEvento(evento)}
          {sufijo && <span className="ml-1 text-gris">{sufijo}</span>}
        </span>
      </Linea>
      <Detalle texto={evento.detalle} />
    </span>
  )
}

function Linea({
  justificar,
  children,
}: {
  justificar: string
  children: React.ReactNode
}) {
  return (
    <span
      className={`flex min-w-0 items-center gap-1.5 text-[13px] leading-snug text-balance text-tinta sm:text-sm ${justificar}`}
    >
      {children}
    </span>
  )
}

function Detalle({ texto }: { texto: string | null }) {
  if (!texto?.trim()) return null
  return (
    <span className="text-[11px] italic leading-snug text-gris">
      {texto.trim()}
    </span>
  )
}
