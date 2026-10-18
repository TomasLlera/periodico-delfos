import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import {
  diferenciaGol,
  etiquetaDiferencia,
  textoDeCambio,
  type CambioDePuesto,
  type Movimiento,
} from '@/lib/temporada'
import type { FilaTablaConEquipo } from '@/types'

/**
 * La tabla de posiciones de una fecha: la de la portada, la de la temporada y
 * la que muestra la ficha de un partido viejo.
 *
 * **Es una `<table>` de verdad**, con `<th scope>` en la fila y en la columna:
 * una grilla de divs con diez números por fila es ilegible con lector de
 * pantalla, que es justo donde una tabla de posiciones más ayuda.
 *
 * El `<caption>` dice a qué fecha corresponde y de dónde sale. No es un
 * detalle: esta tabla **se carga a mano** (ver `0004_tabla_posiciones.sql`)
 * porque el medio no cubre todos los partidos de la zona, así que puede estar
 * una fecha atrás de lo jugado y el lector tiene que poder saberlo.
 *
 * En 375px el que scrollea es el contenedor, no la página: un `overflow` en el
 * documento entero es el bug que estuvo tres sesiones sin verse.
 *
 * La portada no usa esta tabla sino `<TablaCompacta />`, que son cuatro
 * columnas: las once de acá a lo ancho de la portada la convierten en una
 * pantalla de consulta. Lo único opcional de esta es `cambios`, que existe
 * donde hay una fecha anterior con la que comparar —el selector del fixture— y
 * no en la ficha de un partido viejo.
 */
interface Props {
  filas: readonly FilaTablaConEquipo[]
  fecha: number | null
  temporada: string
  /** Reemplaza el texto del `<caption>` cuando el default no alcanza. */
  rotulo?: string
  /** Qué hizo cada equipo respecto de la fecha anterior, por `equipo_id`. */
  cambios?: ReadonlyMap<string, CambioDePuesto> | null
}

/** `tardia` saca la columna abajo de 640px: diez columnas no entran en 375. */
const COLUMNAS = [
  { clave: 'jugados', corto: 'PJ', largo: 'Partidos jugados' },
  { clave: 'ganados', corto: 'G', largo: 'Ganados' },
  { clave: 'empatados', corto: 'E', largo: 'Empatados' },
  { clave: 'perdidos', corto: 'P', largo: 'Perdidos' },
  { clave: 'goles_favor', corto: 'GF', largo: 'Goles a favor', tardia: true },
  { clave: 'goles_contra', corto: 'GC', largo: 'Goles en contra', tardia: true },
] as const

type Columna = (typeof COLUMNAS)[number]

function clasesDeColumna(columna: Columna): string {
  return 'tardia' in columna ? 'hidden sm:table-cell' : ''
}

export function TablaPosiciones({ filas, fecha, temporada, rotulo, cambios }: Props) {
  if (filas.length === 0) return <SinTabla temporada={temporada} />

  const tabla = (
    <table className="w-full min-w-[520px] border-collapse text-left">
      <caption className="mb-4 max-w-medida text-left font-display text-[0.85rem] leading-snug text-text-muted">
        {/* Sólo a qué fecha corresponde la tabla, que es el dato que el lector
            no puede deducir mirándola. Decía además cómo se carga —"a mano,
            fecha por fecha"— y eso es cómo trabaja la redacción, no
            información para quien viene a ver la tabla. */}
        {rotulo ?? `${temporada}${fecha !== null ? ` · actualizada a la fecha ${fecha}` : ''}.`}
      </caption>

      <thead>
        <tr className="border-b-2 border-border-strong">
          <th scope="col" className="meta py-2 pr-2 text-[0.7rem]">
            <span className="sr-only">Posición</span>
            <span aria-hidden="true">#</span>
          </th>
          <th scope="col" className="meta py-2 pr-3 text-[0.7rem]">
            Equipo
          </th>
          {COLUMNAS.map((columna) => (
            <Encabezado
              key={columna.clave}
              corto={columna.corto}
              largo={columna.largo}
              clases={clasesDeColumna(columna)}
            />
          ))}
          <Encabezado corto="DG" largo="Diferencia de gol" />
          <Encabezado corto="Pts" largo="Puntos" fuerte />
        </tr>
      </thead>

      <tbody>
        {filas.map((fila) => (
          <tr
            key={fila.id}
            className={`border-b border-border ${fila.equipo.es_aldosivi ? 'bg-bg-muted' : ''}`}
          >
            <td className="dato py-2 pr-2 text-[0.85rem] text-text-muted">{fila.posicion}</td>

            {/* El equipo es el encabezado de su fila: sin esto un lector de
                pantalla lee "14" sin decir de quién es. */}
            <th scope="row" className="py-2 pr-3 font-normal">
              <span className="flex items-center gap-2">
                <EscudoEquipo equipo={fila.equipo} tamano={22} />
                <span
                  className={`font-display text-[0.9rem] leading-tight ${
                    fila.equipo.es_aldosivi ? 'font-bold text-accent-text' : 'text-text'
                  }`}
                >
                  {fila.equipo.nombre_corto}
                </span>
                <Indicador cambio={cambios?.get(fila.equipo_id)} />
              </span>
            </th>

            {COLUMNAS.map((columna) => (
              <Celda key={columna.clave} clases={clasesDeColumna(columna)}>
                {fila[columna.clave]}
              </Celda>
            ))}

            <Celda>{etiquetaDiferencia(diferenciaGol(fila))}</Celda>
            <Celda fuerte>{fila.puntos}</Celda>
          </tr>
        ))}
      </tbody>
    </table>
  )

  return (
    // La tabla mide 520px y a 375 se desplaza a lo ancho: sin `tabIndex` eso
    // se puede hacer con el dedo pero no con el teclado, y las columnas de
    // goles quedan fuera del alcance de quien navega sin mouse. Misma regla
    // que la línea de tiempo de la planilla —`scrollable-region-focusable`— y
    // la encontró la auditoría de axe, sólo en los proyectos de 375px.
    <div
      tabIndex={0}
      role="region"
      aria-label={`Tabla de posiciones de ${temporada}`}
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-text"
    >
      {tabla}
    </div>
  )
}

/** Las tres flechas. El guion del medio es U+2013, que a 11px se ve. */
const FLECHAS: Record<Movimiento, string> = { subio: '▲', bajo: '▼', mantuvo: '–' }

/**
 * **El color no es el dato.** Un rojo y un verde son el mismo gris para quien
 * no distingue los dos, así que el sentido lo dicen tres cosas antes que el
 * color: la flecha, el número de puestos y la frase del `sr-only`.
 */
const TONOS: Record<Movimiento, string> = {
  subio: 'text-accent-text',
  bajo: 'text-danger',
  mantuvo: 'text-text-muted',
}

function Indicador({ cambio }: { cambio?: CambioDePuesto }) {
  // Sin fecha anterior con la que comparar no se dibuja nada: en la primera
  // fecha cargada nadie subió ni bajó.
  if (!cambio) return null

  return (
    <span className={`dato shrink-0 text-[0.7rem] leading-none ${TONOS[cambio.movimiento]}`}>
      <span aria-hidden="true">
        {FLECHAS[cambio.movimiento]}
        {cambio.movimiento === 'mantuvo' ? '' : cambio.puestos}
      </span>
      <span className="sr-only">{textoDeCambio(cambio)}</span>
    </span>
  )
}

function Encabezado({
  corto,
  largo,
  clases = '',
  fuerte = false,
}: {
  corto: string
  largo: string
  clases?: string
  fuerte?: boolean
}) {
  return (
    <th
      scope="col"
      className={`meta py-2 text-right text-[0.7rem] ${fuerte ? 'pl-3 text-text' : 'pl-2'} ${clases}`}
    >
      {/* `abbr` con `title`: "PJ" se lee como dos letras sueltas, y el título
          completo queda disponible al pasar el mouse y para quien lo pida. */}
      <abbr title={largo} className="no-underline">
        {corto}
      </abbr>
    </th>
  )
}

function Celda({
  children,
  clases = '',
  fuerte = false,
}: {
  children: React.ReactNode
  clases?: string
  fuerte?: boolean
}) {
  return (
    <td
      className={`dato py-2 text-right ${
        fuerte ? 'pl-3 text-[0.95rem] font-bold text-text' : 'pl-2 text-[0.85rem] text-text-soft'
      } ${clases}`}
    >
      {children}
    </td>
  )
}

/**
 * El estado vacío se escribe. La tabla se carga a mano y puede tardar: una
 * pantalla en blanco no distingue "no hay datos todavía" de "está rota".
 */
function SinTabla({ temporada }: { temporada: string }) {
  return (
    <div className="max-w-medida border-l-4 border-accent bg-bg-muted py-6 pl-5">
      {/* Una línea y nada más. La explicación que había debajo —cómo se carga la
          tabla y por qué no sale sola de los partidos del sitio— le hablaba al
          que la carga, no al que vino a verla. */}
      <p className="font-body text-[1.05rem] leading-relaxed text-text-soft">
        Todavía no hay tabla cargada para {temporada}.
      </p>
    </div>
  )
}
