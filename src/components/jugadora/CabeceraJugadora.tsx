import { FotoJugadora } from '@/components/jugadora/FotoJugadora'
import { edad, type TotalesJugadora } from '@/lib/jugadora'
import { NOMBRE_PUESTO } from '@/lib/plantel'
import type { Jugadora, Posicion } from '@/types'

/**
 * La cabecera de la ficha: foto, nombre y los totales de carrera.
 *
 * Va en bloque verde como la nota de tapa: `verde-900` es una superficie en
 * los dos temas y lleva texto blanco, así que la ficha se ve igual de firme
 * con foto o sin ella.
 *
 * **Los totales son la suma de todas las temporadas**, no la del último año
 * (ver `totalesJugadora()`). Abajo, en la tabla, se abren por temporada.
 */
interface Props {
  jugadora: Jugadora
  /** Su puesto en la temporada en curso, si está en el plantel. */
  puesto: Posicion
  dorsal: number | null
  capitana: boolean
  /** Nombre de la temporada del plantel en el que está hoy, si está en alguno. */
  temporadaActual: string | null
  totales: TotalesJugadora
  /** Se inyecta para poder calcular la edad sin leer el reloj adentro. */
  hoy: Date
  /**
   * Nivel del encabezado. Es `h1` en la ficha, donde el nombre de la jugadora
   * es el título de la página, y baja a `h2` en el banco de pruebas, que ya
   * tiene su propio `h1`. Mismo criterio que `<PlanillaPartido />`.
   */
  nivelTitulo?: 1 | 2
}

export function CabeceraJugadora({
  jugadora,
  puesto,
  dorsal,
  capitana,
  temporadaActual,
  totales,
  hoy,
  nivelTitulo = 1,
}: Props) {
  const Titulo = nivelTitulo === 1 ? 'h1' : 'h2'
  const anios = edad(jugadora.fecha_nacimiento, hoy)

  const volanta = [
    dorsal !== null ? `#${dorsal}` : null,
    NOMBRE_PUESTO[puesto],
    capitana ? 'Capitana' : null,
    temporadaActual,
  ].filter((parte): parte is string => Boolean(parte))

  const ficha = [
    jugadora.lugar_origen,
    anios !== null ? `${anios} años` : null,
  ].filter((parte): parte is string => Boolean(parte))

  return (
    <header className="bg-verde-900 text-white">
      <div className="grid gap-6 p-6 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-8 sm:p-8">
        <FotoJugadora
          jugadora={jugadora}
          variante="oscuro"
          prioridad
          sizes="(min-width: 640px) 220px, 100vw"
          // También en mobile: a ancho completo son 375×500 px de foto antes
          // del nombre, y el nombre es lo que se vino a leer.
          className="max-w-[220px]"
        />

        <div className="flex flex-col">
          <p className="meta text-amarillo">{volanta.join(' · ')}</p>

          {/* El nombre va chico arriba y el apellido grande: es como se lee una
              ficha de plantel, y es lo que se busca en un listado. */}
          <Titulo className="mt-2">
            <span className="block font-display text-[1.05rem] leading-tight text-white/75">
              {jugadora.nombre}
            </span>
            <span className="titular block text-[2rem] leading-[0.95] md:text-[2.8rem]">
              {jugadora.apellido}
            </span>
          </Titulo>

          {ficha.length > 0 && (
            <p className="dato mt-3 text-[0.85rem] text-white/70">{ficha.join(' · ')}</p>
          )}

          {jugadora.bio && (
            <p className="mt-4 max-w-medida font-body text-[1rem] leading-relaxed text-white/80">
              {jugadora.bio}
            </p>
          )}

          <Totales totales={totales} />
        </div>
      </div>
    </header>
  )
}

/** "1 rojas" no se escribe. Cada dato lleva su singular. */
function plural(valor: number, singular: string, plural: string): string {
  return valor === 1 ? singular : plural
}

function Totales({ totales }: { totales: TotalesJugadora }) {
  const datos = [
    { etiqueta: plural(totales.partidos, 'partido', 'partidos'), valor: totales.partidos },
    { etiqueta: 'de titular', valor: totales.titular },
    { etiqueta: plural(totales.goles, 'gol', 'goles'), valor: totales.goles },
    { etiqueta: plural(totales.amarillas, 'amarilla', 'amarillas'), valor: totales.amarillas },
    { etiqueta: plural(totales.rojas, 'roja', 'rojas'), valor: totales.rojas },
  ]

  return (
    <dl className="mt-6 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-5">
      {datos.map((dato) => (
        // `flex-col-reverse`: el <dt> va antes que su <dd> en el DOM, pero el
        // número se lee arriba y la etiqueta abajo.
        <div key={dato.etiqueta} className="flex flex-col-reverse">
          <dt className="dato text-[0.75rem] text-white/60">{dato.etiqueta}</dt>
          <dd className="marca text-[1.8rem] text-amarillo">{dato.valor}</dd>
        </div>
      ))}
    </dl>
  )
}
