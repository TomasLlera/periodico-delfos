import Link from 'next/link'
import { suplentes, titulares } from '@/lib/partido'
import type { FormacionConJugadora, PartidoCompleto } from '@/types'

interface Props {
  partido: PartidoCompleto
  /** Una sola línea de apellidos, para la planilla embebida en la crónica. */
  denso?: boolean
  /** Un nivel por debajo del título de la planilla que las contiene. */
  nivelTitulo?: 3 | 4 | 5
}

/**
 * Titulares y suplentes. Acá sí van los links a `/jugadora/[slug]`: es una
 * lista normal, no la grilla oculta de la línea de tiempo.
 */
export function FormacionesPartido({ partido, denso = false, nivelTitulo = 3 }: Props) {
  const once = titulares(partido)
  const banco = suplentes(partido)
  const Titulo = `h${nivelTitulo}` as 'h3' | 'h4' | 'h5'

  if (once.length === 0 && banco.length === 0) {
    if (denso) return null
    return (
      <p className="font-display text-sm text-text-muted">
        Formación no cargada para este partido.
      </p>
    )
  }

  if (denso) {
    return (
      <div className="font-display text-[13px] leading-relaxed">
        <ListaDensa titulo="Titulares" filas={once} />
        <ListaDensa titulo="Suplentes" filas={banco} />
      </div>
    )
  }

  return (
    <div className="grid gap-5 font-display sm:grid-cols-2">
      <Bloque titulo="Titulares" filas={once} Titulo={Titulo} />
      <Bloque titulo="Suplentes" filas={banco} Titulo={Titulo} />
    </div>
  )
}

function Bloque({
  titulo,
  filas,
  Titulo,
}: {
  titulo: string
  filas: FormacionConJugadora[]
  Titulo: 'h3' | 'h4' | 'h5'
}) {
  if (filas.length === 0) return null
  return (
    <div>
      <Titulo className="meta mb-2">{titulo}</Titulo>
      <ul className="flex flex-col">
        {filas.map((fila) => (
          <li key={fila.jugadora_id} className="border-b border-border last:border-b-0">
            <Link
              href={`/jugadora/${fila.jugadora.slug}`}
              className="flex items-center gap-3 py-2 text-sm text-text hover:text-accent-text"
            >
              <span className="dato w-6 shrink-0 text-right text-[13px] text-text-muted">
                {fila.dorsal ?? '—'}
              </span>
              <span>
                {fila.jugadora.nombre} {fila.jugadora.apellido}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ListaDensa({ titulo, filas }: { titulo: string; filas: FormacionConJugadora[] }) {
  if (filas.length === 0) return null
  return (
    <p className="mt-1 first:mt-0">
      <span className="meta mr-2">{titulo}</span>
      {filas.map((fila, indice) => (
        <span key={fila.jugadora_id}>
          {indice > 0 && <span className="text-border-control"> · </span>}
          <Link
            href={`/jugadora/${fila.jugadora.slug}`}
            className="text-text hover:text-accent-text hover:underline"
          >
            {fila.jugadora.apellido}
          </Link>
        </span>
      ))}
    </p>
  )
}
