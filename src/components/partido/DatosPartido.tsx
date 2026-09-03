import { fechaHoraPartido, fechaLarga } from '@/lib/formato'
import type { PartidoConEquipos } from '@/types'

interface Props {
  partido: PartidoConEquipos
}

/** Cancha, árbitra y torneo. Los campos sin cargar no se muestran vacíos. */
export function DatosPartido({ partido }: Props) {
  const filas: { termino: string; valor: string }[] = [
    {
      termino: 'Fecha',
      valor:
        partido.estado === 'programado'
          ? fechaHoraPartido(partido.fecha_hora)
          : fechaLarga(partido.fecha_hora),
    },
    { termino: 'Torneo', valor: [partido.temporada.nombre, partido.temporada.zona].filter(Boolean).join(' · ') },
  ]

  if (partido.cancha) filas.push({ termino: 'Cancha', valor: partido.cancha })
  if (partido.arbitra) filas.push({ termino: 'Árbitra', valor: partido.arbitra })

  return (
    <div className="font-display">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {filas.map((fila) => (
          <div key={fila.termino} className="flex items-baseline gap-3">
            <dt className="meta w-20 shrink-0">{fila.termino}</dt>
            <dd className="text-sm text-tinta">{fila.valor}</dd>
          </div>
        ))}
      </dl>

      {partido.observaciones && (
        <p className="mt-4 border-l-2 border-amarillo pl-3 text-sm italic leading-relaxed text-gris">
          {partido.observaciones}
        </p>
      )}
    </div>
  )
}
