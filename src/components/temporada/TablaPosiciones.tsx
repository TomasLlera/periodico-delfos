import { EscudoEquipo } from '@/components/partido/EscudoEquipo'
import { diferenciaGol, etiquetaDiferencia } from '@/lib/temporada'
import type { FilaTablaConEquipo } from '@/types'

/**
 * La tabla de posiciones de la última fecha cargada.
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
 */
interface Props {
  filas: readonly FilaTablaConEquipo[]
  fecha: number | null
  temporada: string
}

/** `oculta` saca la columna abajo de 640px: diez columnas no entran en 375. */
const COLUMNAS = [
  { clave: 'jugados', corto: 'PJ', largo: 'Partidos jugados' },
  { clave: 'ganados', corto: 'G', largo: 'Ganados' },
  { clave: 'empatados', corto: 'E', largo: 'Empatados' },
  { clave: 'perdidos', corto: 'P', largo: 'Perdidos' },
  { clave: 'goles_favor', corto: 'GF', largo: 'Goles a favor', oculta: true },
  { clave: 'goles_contra', corto: 'GC', largo: 'Goles en contra', oculta: true },
] as const

export function TablaPosiciones({ filas, fecha, temporada }: Props) {
  if (filas.length === 0) return <SinTabla temporada={temporada} />

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
      className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-verde-600"
    >
      <table className="w-full min-w-[520px] border-collapse text-left">
        <caption className="mb-4 max-w-medida text-left font-display text-[0.85rem] leading-snug text-gris">
          {temporada}
          {fecha !== null ? ` · actualizada a la fecha ${fecha}` : ''}. Se carga
          a mano, fecha por fecha: puede ir una fecha atrás de lo jugado.
        </caption>

        <thead>
          <tr className="border-b-2 border-tinta">
            <th scope="col" className="meta py-2 pr-2 text-[0.7rem]">
              <span className="sr-only">Posición</span>
              <span aria-hidden="true">#</span>
            </th>
            <th scope="col" className="meta py-2 pr-3 text-[0.7rem]">
              Equipo
            </th>
            {COLUMNAS.map((columna) => (
              <Encabezado key={columna.clave} corto={columna.corto} largo={columna.largo} oculta={'oculta' in columna} />
            ))}
            <Encabezado corto="DG" largo="Diferencia de gol" />
            <Encabezado corto="Pts" largo="Puntos" fuerte />
          </tr>
        </thead>

        <tbody>
          {filas.map((fila) => (
            <tr
              key={fila.id}
              className={`border-b border-linea ${fila.equipo.es_aldosivi ? 'bg-verde-100' : ''}`}
            >
              <td className="dato py-2 pr-2 text-[0.85rem] text-gris">{fila.posicion}</td>

              {/* El equipo es el encabezado de su fila: sin esto un lector de
                  pantalla lee "14" sin decir de quién es. */}
              <th scope="row" className="py-2 pr-3 font-normal">
                <span className="flex items-center gap-2">
                  <EscudoEquipo equipo={fila.equipo} tamano={22} />
                  <span
                    className={`font-display text-[0.9rem] leading-tight ${
                      fila.equipo.es_aldosivi ? 'font-bold text-verde-600' : 'text-tinta'
                    }`}
                  >
                    {fila.equipo.nombre_corto}
                  </span>
                </span>
              </th>

              {COLUMNAS.map((columna) => (
                <Celda key={columna.clave} oculta={'oculta' in columna}>
                  {fila[columna.clave]}
                </Celda>
              ))}

              <Celda>{etiquetaDiferencia(diferenciaGol(fila))}</Celda>
              <Celda fuerte>{fila.puntos}</Celda>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Encabezado({
  corto,
  largo,
  oculta = false,
  fuerte = false,
}: {
  corto: string
  largo: string
  oculta?: boolean
  fuerte?: boolean
}) {
  return (
    <th
      scope="col"
      className={`meta py-2 text-right text-[0.7rem] ${fuerte ? 'pl-3 text-tinta' : 'pl-2'} ${
        oculta ? 'hidden sm:table-cell' : ''
      }`}
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
  oculta = false,
  fuerte = false,
}: {
  children: React.ReactNode
  oculta?: boolean
  fuerte?: boolean
}) {
  return (
    <td
      className={`dato py-2 text-right ${
        fuerte ? 'pl-3 text-[0.95rem] font-bold text-tinta' : 'pl-2 text-[0.85rem] text-tinta-suave'
      } ${oculta ? 'hidden sm:table-cell' : ''}`}
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
    <div className="max-w-medida border-l-4 border-verde-600 bg-papel-alt py-6 pl-5">
      <p className="font-body text-[1.05rem] leading-relaxed text-tinta-suave">
        Todavía no se cargó ninguna fecha de la tabla de {temporada}.
      </p>
      <p className="mt-3 font-body text-gris">
        La tabla se carga a mano, fecha por fecha: el medio cubre a Aldosivi y
        no todos los partidos de la zona, así que no se puede calcular desde los
        partidos que hay acá.
      </p>
    </div>
  )
}
