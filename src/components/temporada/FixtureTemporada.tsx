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
 * dos números pueden no coincidir.
 *
 * El bloque se llamaba "Lo cargado hasta acá" justamente para decir eso en el
 * título. Se cambió a "Campaña" porque el título explicaba el mecanismo en
 * lugar de nombrar el contenido: a un lector le dice más de cómo se carga el
 * sitio que del equipo. La salvedad no se perdió, bajó al pie del bloque —ver
 * el `<p>` del final—, que es donde va una nota al pie.
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
        Campaña
      </h2>

      {/* Grilla de columnas iguales y no `flex-wrap`. Envuelto, cada dato medía
          lo que medía su palabra: "goles a favor" ocupaba el triple que
          "ganado", las dos filas arrancaban en lugares distintos y el bloque se
          veía torcido. En la grilla los seis caen en la misma cuadrícula, tres
          y tres. */}
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4 sm:grid-cols-6">
        {datos.map((dato) => (
          // `flex-col-reverse`: en un <dl> el <dt> va antes que su <dd>, pero
          // acá el número se lee arriba y la etiqueta abajo.
          <div key={dato.etiqueta} className="flex min-w-0 flex-col-reverse">
            {/* `.meta` y no `.dato`: en minúscula y en monoespaciada las
                etiquetas se leían como texto de debug al pie de cada número.
                En caja alta con tracking son rótulos, que es lo que son. */}
            <dt className="meta text-[0.6rem] leading-tight text-white/60">{dato.etiqueta}</dt>
            <dd className="marca text-[1.5rem] leading-none text-amarillo sm:text-[1.7rem]">
              {dato.valor}
            </dd>
          </div>
        ))}
      </dl>

      {/* La aclaración va al pie y en chico, no de bajada. Sigue siendo
          necesaria —estos números y los de la pestaña "Tabla" pueden no
          coincidir— pero es una nota al pie, no el encabezado del bloque: de
          bajada pesaba más que los datos que venía a explicar. */}
      <p className="mt-4 font-body text-[0.78rem] leading-snug text-white/50">
        Contado desde los partidos que cubrió el medio, no desde la tabla.
      </p>
    </section>
  )
}
