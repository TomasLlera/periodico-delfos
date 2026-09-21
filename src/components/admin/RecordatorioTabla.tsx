import Link from 'next/link'
import { ListOrdered } from 'lucide-react'
import { Aviso } from '@/components/admin/Aviso'

/**
 * "Cargaste el resultado; ahora falta la tabla de posiciones."
 *
 * Es el único recordatorio del panel, y existe porque la tabla de posiciones es
 * la única excepción del proyecto a "ningún dato deportivo a mano" (blueprint
 * § 4.4). Cargar el resultado de un partido mueve solo las goleadoras, la ficha
 * de la jugadora, la portada y el fixture. **No mueve la tabla**, porque ahí
 * están los otros diez equipos del campeonato y de ésos no cubrimos los
 * partidos. Y es justo el paso que se olvida: como todo lo demás pasó solo,
 * nada avisa que falta uno.
 *
 * **No es un modal y es deliberado.** Una ventana se cierra una vez y no
 * vuelve: cargando cinco partidos seguidos serían cinco ventanas, y la que se
 * cierra sin querer se perdió. Esto se calcula de los datos —hay fecha jugada,
 * no hay fila de tabla— así que aparece cuando corresponde, se queda hasta que
 * el trabajo esté hecho y se apaga solo. Es el mismo criterio que el "Sin
 * formación" de `FilaPartido`.
 */

interface Props {
  temporadaId: string
  /** Lo que devuelve `fechasSinTabla()`. Vacío: no se dibuja nada. */
  fechas: readonly number[]
}

export function RecordatorioTabla({ temporadaId, fechas }: Props) {
  if (fechas.length === 0) return null

  const varias = fechas.length > 1

  return (
    <Aviso tono="atencion">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <ListOrdered size={16} aria-hidden="true" className="shrink-0" />
        <span>
          {varias ? 'Las fechas' : 'La fecha'} <strong>{fechas.join(', ')}</strong>{' '}
          {varias ? 'ya se jugaron' : 'ya se jugó'} y la tabla de posiciones todavía no{' '}
          {varias ? 'las tiene' : 'la tiene'}. La tabla se carga a mano: el resultado del
          partido no mueve a los otros equipos.
        </span>

        {/* Un link por fecha, cada uno ya apuntado a la suya: llegar a la
            pantalla y tener que elegir el número otra vez es la mitad del
            olvido. */}
        {fechas.map((fecha) => (
          <Link
            key={fecha}
            href={`/admin/tabla/${temporadaId}?fecha=${fecha}`}
            className="tactil inline-flex items-center border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.85rem] font-bold hover:bg-papel"
          >
            Cargar la fecha {fecha}
          </Link>
        ))}
      </span>
    </Aviso>
  )
}
