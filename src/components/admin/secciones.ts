import type { RolDeAutor } from '@/types'

/**
 * Las secciones del panel, en un solo lugar.
 *
 * **Vivían escritas a mano adentro del JSX de `<BarraAdmin />`.** Dejaron de
 * poder estarlo cuando apareció el menú de celular: dos listas de nueve links
 * que hay que acordarse de tocar juntas son nueve chances de que una pantalla
 * exista en escritorio y no en el teléfono.
 *
 * Agregar una sección es agregar una línea acá **y** la ruta en `src/app/`.
 * También va en `docs/admin.md`: una pantalla a la que no se llega desde esta
 * barra es una pantalla que nadie va a encontrar.
 */
export interface SeccionAdmin {
  href: string
  etiqueta: string
  /** Las que sólo ve un editor: vender, dar de alta y escribir lo institucional. */
  soloEditor?: boolean
}

export const SECCIONES: readonly SeccionAdmin[] = [
  { href: '/admin', etiqueta: 'Notas' },
  { href: '/admin/partidos', etiqueta: 'Partidos' },
  { href: '/admin/jugadoras', etiqueta: 'Jugadoras' },
  { href: '/admin/equipos', etiqueta: 'Equipos' },
  // El plantel y la tabla de posiciones no tienen link propio: cuelgan de una
  // temporada y se entra desde su listado, que es donde ya se sabe de cuál.
  { href: '/admin/temporadas', etiqueta: 'Temporadas' },
  { href: '/admin/posteos', etiqueta: 'Posteos' },
  { href: '/admin/estadisticas', etiqueta: 'Estadísticas' },
  { href: '/admin/autores', etiqueta: 'Autores', soloEditor: true },
  { href: '/admin/sponsors', etiqueta: 'Sponsors', soloEditor: true },
  { href: '/admin/paginas', etiqueta: 'Páginas', soloEditor: true },
]

/** Las que le corresponden a un rol. */
export function seccionesDe(rol: RolDeAutor): SeccionAdmin[] {
  return SECCIONES.filter((seccion) => !seccion.soloEditor || rol === 'editor')
}

/**
 * En qué sección estamos parados, para el título de la barra de celular.
 *
 * **Gana el `href` más largo que sea prefijo de la ruta**, y por eso no alcanza
 * con un `startsWith` contra el primero que matchee: `/admin` es prefijo de
 * todas, así que `/admin/partidos/3/planilla` diría "Notas". Buscando el más
 * largo, dice "Partidos", que es donde está parado el que mira.
 */
export function seccionActiva(ruta: string, secciones: readonly SeccionAdmin[]): SeccionAdmin | null {
  const candidatas = secciones.filter(
    (seccion) => ruta === seccion.href || ruta.startsWith(`${seccion.href}/`),
  )

  return candidatas.reduce<SeccionAdmin | null>(
    (mejor, seccion) => (!mejor || seccion.href.length > mejor.href.length ? seccion : mejor),
    null,
  )
}
