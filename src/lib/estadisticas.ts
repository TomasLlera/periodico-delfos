/**
 * La lógica de la pantalla de estadísticas, sin red y sin React.
 *
 * Lo que vive acá es lo que se puede equivocar en silencio: qué rango de fechas
 * se pide, cómo se suman los totales y cómo se lee cada fila de la respuesta.
 * La API de Vercel devuelve la dimensión agrupada con un nombre distinto por
 * consulta —`country`, `deviceType`, `requestPath`— y un error ahí no rompe
 * nada: dibuja una tabla de filas vacías.
 */

/** Los dos rangos que ofrece la pantalla. */
export const RANGOS = [7, 30] as const
export type Rango = (typeof RANGOS)[number]

/**
 * El rango pedido, acotado a los dos que existen.
 *
 * **El tope de 30 días no es una decisión de diseño sino del plan.** Hobby
 * guarda un mes de datos; pedir 90 días devolvería una serie con el principio
 * vacío y un gráfico que miente sobre una caída que no existió.
 */
export function rangoPedido(valor: string | string[] | undefined): Rango {
  const texto = Array.isArray(valor) ? valor[0] : valor
  const numero = Number(texto)
  return RANGOS.includes(numero as Rango) ? (numero as Rango) : 7
}

/**
 * Las fechas que espera la API, en `YYYY-MM-DD`.
 *
 * `until` es hoy y `since` es hoy menos los días del rango. Se calcula en UTC a
 * propósito: la API agrupa los días en UTC, así que pedir el rango en hora de
 * Argentina dejaría el primer y el último día cortados a la mitad y el gráfico
 * mostraría dos jornadas flojas que no lo fueron.
 */
export function fechasDelRango(rango: Rango, ahora: Date = new Date()): {
  since: string
  until: string
} {
  const hasta = new Date(ahora)
  const desde = new Date(ahora.getTime() - (rango - 1) * 24 * 60 * 60 * 1000)

  return { since: desde.toISOString().slice(0, 10), until: hasta.toISOString().slice(0, 10) }
}

/** Una fila de la serie diaria, ya normalizada. */
export interface DiaDeVisitas {
  /** `YYYY-MM-DD`, que es lo que se dibuja en el eje. */
  dia: string
  vistas: number
  visitantes: number
}

/** Una fila de un top: la clave agrupada y sus dos métricas. */
export interface FilaTop {
  clave: string
  vistas: number
  visitantes: number
}

/** Lo que la API devuelve en `data`, antes de que sepamos qué forma tiene. */
type FilaCruda = Record<string, unknown>

function numero(valor: unknown): number {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : 0
}

/**
 * La serie diaria, a partir de las filas con `timestamp`.
 *
 * Las filas llegan con un ISO completo —`2024-10-01T00:00:00.000Z`— y acá se
 * recortan al día. Las que no traigan timestamp se descartan en silencio: una
 * fila rara no puede dejar sin gráfico a toda la pantalla.
 */
export function serieDiaria(filas: readonly FilaCruda[]): DiaDeVisitas[] {
  return filas
    .filter((fila) => typeof fila.timestamp === 'string')
    .map((fila) => ({
      dia: String(fila.timestamp).slice(0, 10),
      vistas: numero(fila.pageviews),
      visitantes: numero(fila.visitors),
    }))
    .sort((a, b) => a.dia.localeCompare(b.dia))
}

/**
 * Los totales del rango, sumando la serie diaria.
 *
 * **Se suman acá en vez de pedirlos con otra consulta**, y no es por ahorrar un
 * viaje: el endpoint de conteo responde sobre todo el histórico de producción y
 * no sobre el rango elegido, así que un total pedido ahí no coincidiría con el
 * gráfico que tiene al lado. Dos números que no cierran entre sí valen menos
 * que ninguno.
 *
 * El total de visitantes es la suma de los diarios, así que **cuenta dos veces
 * a quien volvió otro día**. Es lo que se puede decir con esta serie, y la
 * pantalla lo aclara en vez de disimularlo.
 */
export function totalesDelRango(serie: readonly DiaDeVisitas[]): {
  vistas: number
  visitantes: number
} {
  return serie.reduce(
    (suma, dia) => ({
      vistas: suma.vistas + dia.vistas,
      visitantes: suma.visitantes + dia.visitantes,
    }),
    { vistas: 0, visitantes: 0 },
  )
}

/**
 * Un top, a partir de las filas agrupadas por una dimensión.
 *
 * `dimension` es el nombre con el que viene la clave en cada fila, que cambia
 * según lo que se pidió: `requestPath`, `referrerHostname`, `deviceType`,
 * `country`. Las filas sin esa clave se descartan.
 *
 * Vercel agrupa en `Others` lo que no entra en el `limit` pedido, así que esa
 * fila es real y se deja: sacarla haría que los números no sumen al total.
 */
export function filasTop(filas: readonly FilaCruda[], dimension: string): FilaTop[] {
  return filas
    .filter((fila) => typeof fila[dimension] === 'string' && fila[dimension] !== '')
    .map((fila) => ({
      clave: String(fila[dimension]),
      vistas: numero(fila.pageviews),
      visitantes: numero(fila.visitors),
    }))
    .sort((a, b) => b.vistas - a.vistas)
}

/**
 * El slug de una nota, si la ruta es la de una nota.
 *
 * Sirve para cambiar `/nota/tiburonas-6-1-claypole-…` por el título de verdad
 * en el top de páginas: una lista de URLs largas no se lee, y el que la mira
 * quiere saber qué nota anduvo bien.
 */
export function slugDeNota(ruta: string): string | null {
  const limpia = ruta.split('?')[0]?.replace(/\/+$/, '') ?? ''
  const partes = limpia.split('/').filter(Boolean)
  return partes.length === 2 && partes[0] === 'nota' ? (partes[1] ?? null) : null
}

/** Cómo se nombra una ruta que no es una nota. La portada tiene nombre propio. */
export function nombreDeRuta(ruta: string): string {
  return ruta === '/' ? 'Portada' : ruta
}

/**
 * Las cuatro vistas de la pantalla.
 *
 * **Son pestañas y no cuatro listas una abajo de la otra.** Con las cuatro a la
 * vez, tres de ellas tienen una o dos filas —al principio de un medio siempre
 * las tienen— y la pantalla se ve como un formulario a medio cargar en lugar de
 * como un informe. De a una, cada lista ocupa el ancho entero y se lee.
 *
 * La vista vive en la URL, igual que en la página de temporada y por las
 * mismas razones: se comparte, queda en el historial, anda sin JavaScript y
 * cada pestaña se cachea por separado. El costo es una navegación por click.
 */
export const PESTANAS_ESTADISTICAS = [
  { clave: 'notas', titulo: 'Notas' },
  { clave: 'secciones', titulo: 'Secciones' },
  { clave: 'origen', titulo: 'De dónde llegan' },
  { clave: 'publico', titulo: 'Quién mira' },
] as const

export type PestanaEstadisticas = (typeof PESTANAS_ESTADISTICAS)[number]['clave']

/** Las notas primero: es la pregunta que trajo a alguien a esta pantalla. */
export const PESTANA_ESTADISTICAS_POR_OMISION: PestanaEstadisticas = 'notas'

/**
 * Qué pestaña pidió la URL.
 *
 * `?ver=` es entrada de usuario: cualquier cosa que no sea una de las cuatro
 * cae en la primera en lugar de romper la página.
 */
export function pestanaDeEstadisticas(valor: string | string[] | undefined): PestanaEstadisticas {
  const crudo = Array.isArray(valor) ? valor[0] : valor
  const encontrada = PESTANAS_ESTADISTICAS.find((pestana) => pestana.clave === crudo)
  return encontrada?.clave ?? PESTANA_ESTADISTICAS_POR_OMISION
}
