import { PlanillaCompacta } from '@/components/partido/PlanillaCompacta'
import { balanceAldosivi, dividirFixture } from '@/lib/temporada'
import type { PartidoConEquipos } from '@/types'

/**
 * El fixture de la temporada, partido por partido.
 *
 * Va partido en dos —lo jugado y lo que viene— y no en una sola lista: en una
 * lista corrida el próximo partido queda perdido en el medio, y es el dato que
 * más se busca. Los dos bloques van en orden cronológico, como un fixture
 * impreso, y no del más nuevo al más viejo como un listado de notas.
 *
 * Cada tarjeta es `<PlanillaCompacta />`, la misma de la portada. Acá llega sin
 * eventos —el fixture no trae la planilla de cada fecha— así que las tarjetas
 * muestran el marcador y no las goleadoras (ver `PartidoResumible`).
 */
interface Props {
  partidos: readonly PartidoConEquipos[]
  temporada: string
}

export function FixtureTemporada({ partidos, temporada }: Props) {
  const { jugados, porJugar } = dividirFixture(partidos)
  const balance = balanceAldosivi(jugados)

  if (partidos.length === 0) {
    return (
      <div className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
        <p className="font-body text-[1.05rem] leading-relaxed text-tinta-suave">
          Todavía no hay partidos cargados en {temporada}.
        </p>
        <p className="mt-3 font-body text-gris">
          Cada partido se carga desde el admin con su planilla, y de ahí salen
          solos el fixture, las goleadoras y las estadísticas de cada jugadora.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-12">
      {balance.jugados > 0 && <Balance balance={balance} />}

      {porJugar.length > 0 && (
        <Bloque titulo="Lo que viene" id="por-jugar" partidos={porJugar} />
      )}

      {jugados.length > 0 && (
        <Bloque titulo="Jugados" id="jugados" partidos={jugados} />
      )}
    </div>
  )
}

function Bloque({
  titulo,
  id,
  partidos,
}: {
  titulo: string
  id: string
  partidos: readonly PartidoConEquipos[]
}) {
  return (
    <section aria-labelledby={id}>
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="h-7 w-2.5 shrink-0 rounded-sm bg-verde-600" />
        <h2 id={id} className="titular text-[22px]">
          {titulo}
        </h2>
        <span className="dato text-[0.8rem] text-gris">{partidos.length}</span>
      </div>

      <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {partidos.map((partido) => (
          <li key={partido.id}>
            <PlanillaCompacta partido={partido} className="h-full bg-tarjeta" />
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * **No es la campaña del campeonato: es lo que el medio tiene cargado.**
 *
 * Se cuenta desde los partidos de esta página, que son los que cubrió el
 * medio, y la tabla de posiciones se carga aparte y cubre la zona entera. Los
 * dos números pueden no coincidir, y por eso el bloque se titula "Lo cargado
 * hasta acá" y no "Campaña".
 */
function Balance({ balance }: { balance: ReturnType<typeof balanceAldosivi> }) {
  const datos = [
    { etiqueta: balance.jugados === 1 ? 'partido' : 'partidos', valor: balance.jugados },
    { etiqueta: balance.ganados === 1 ? 'ganado' : 'ganados', valor: balance.ganados },
    { etiqueta: balance.empatados === 1 ? 'empatado' : 'empatados', valor: balance.empatados },
    { etiqueta: balance.perdidos === 1 ? 'perdido' : 'perdidos', valor: balance.perdidos },
    { etiqueta: 'goles a favor', valor: balance.golesFavor },
    { etiqueta: 'en contra', valor: balance.golesContra },
  ]

  return (
    <section aria-labelledby="balance" className="bg-verde-900 p-6 text-white">
      <h2 id="balance" className="marca text-[1.3rem] uppercase">
        Lo cargado hasta acá
      </h2>
      <p className="mt-1 font-body text-[0.9rem] leading-snug text-white/70">
        Contado desde los partidos que cubrió el medio, no desde la tabla.
      </p>

      <dl className="mt-5 flex flex-wrap gap-x-7 gap-y-3">
        {datos.map((dato) => (
          // `flex-col-reverse`: en un <dl> el <dt> va antes que su <dd>, pero
          // acá el número se lee arriba y la etiqueta abajo.
          <div key={dato.etiqueta} className="flex flex-col-reverse">
            <dt className="dato text-[0.75rem] text-white/60">{dato.etiqueta}</dt>
            <dd className="marca text-[1.7rem] text-amarillo">{dato.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
