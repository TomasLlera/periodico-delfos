import Link from 'next/link'
import { ClipboardList, Pencil, Users } from 'lucide-react'
import { fechaHoraPartido } from '@/lib/formato'
import { ETIQUETA_ESTADO } from '@/lib/partido'
import type { PartidoConEquipos } from '@/types'

/**
 * Un partido en el listado del panel.
 *
 * Vive al lado de su page, como `FilaNota`: no lo usa nadie más.
 *
 * Muestra **el dato y no sólo el nombre**. Antes esta fila decía "Fecha 4 ·
 * Aldosivi 6-1 Claypole" y el estado, y con eso no se podía saber si el
 * partido del sábado ya tenía la hora corregida ni si la formación estaba
 * armada. Lo que hace falta para decidir a qué pantalla entrar es el día, la
 * cancha y cuánto hay cargado.
 *
 * El estado va con palabra y con color, nunca con color solo.
 */

const ESTILO_ESTADO = {
  programado: 'bg-papel-alt text-gris',
  en_curso: 'bg-amarillo text-negro-cancha',
  finalizado: 'bg-verde-900 text-white',
  suspendido: 'bg-roja text-white',
  postergado: 'bg-papel-alt text-gris',
} as const

interface Props {
  partido: PartidoConEquipos
  /** Cuánto hay cargado, para saber si falta armar la formación. */
  cargado: { formaciones: number; eventos: number }
}

export function FilaPartido({ partido, cargado }: Props) {
  const hayResultado = partido.goles_local !== null && partido.goles_visitante !== null

  return (
    <li className="border-b border-linea py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className={`meta px-2 py-0.5 ${ESTILO_ESTADO[partido.estado]}`}>
          {ETIQUETA_ESTADO[partido.estado]}
        </span>

        <Link
          href={`/admin/partidos/${partido.id}`}
          className="font-display text-[1rem] font-bold underline-offset-4 hover:underline"
        >
          {partido.equipo_local.nombre_corto}
          {hayResultado ? (
            <span className="font-mono">
              {' '}
              {partido.goles_local}-{partido.goles_visitante}{' '}
            </span>
          ) : (
            ' vs '
          )}
          {partido.equipo_visitante.nombre_corto}
        </Link>

        <span className="meta text-gris">
          {partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : 'Sin fecha'}
        </span>

        <span className="ml-auto text-[0.85rem] text-gris">
          {fechaHoraPartido(partido.fecha_hora)}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.8rem] text-gris">
        <span>{partido.temporada.nombre}</span>
        <span>{partido.cancha ?? 'Sin cancha'}</span>
        {partido.arbitra && <span>Arbitra {partido.arbitra}</span>}

        {/* Lo que falta cargar, dicho en la fila: sin formación la planilla
            abre con la grilla vacía, y eso no se ve hasta entrar. */}
        <span className={cargado.formaciones === 0 ? 'text-roja' : undefined}>
          {cargado.formaciones === 0
            ? 'Sin formación'
            : `${cargado.formaciones} en la formación`}
        </span>
        <span>{cargado.eventos} eventos</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          href={`/admin/partidos/${partido.id}`}
          className="tactil flex items-center gap-2 border border-linea-fuerte px-3 font-display text-[0.85rem] font-bold hover:bg-papel-alt"
        >
          <Pencil size={14} aria-hidden="true" />
          Ficha
        </Link>

        <Link
          href={`/admin/partidos/${partido.id}/formacion`}
          className="tactil flex items-center gap-2 border border-linea-fuerte px-3 font-display text-[0.85rem] font-bold hover:bg-papel-alt"
        >
          <Users size={14} aria-hidden="true" />
          Formación
        </Link>

        <Link
          href={`/admin/partidos/${partido.id}/planilla`}
          className="tactil flex items-center gap-2 bg-verde-900 px-3 font-display text-[0.85rem] font-extrabold text-white hover:bg-verde-600"
        >
          <ClipboardList size={14} aria-hidden="true" />
          Planilla
        </Link>
      </div>
    </li>
  )
}
