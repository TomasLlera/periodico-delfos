import type { RolDeAutor } from '@/types'

/**
 * Las secciones del panel, agrupadas, en un solo lugar.
 *
 * **Vivían escritas a mano adentro del JSX de `<BarraAdmin />`.** Dejaron de
 * poder estarlo cuando apareció el menú de celular: dos listas de diez links
 * que hay que acordarse de tocar juntas son diez chances de que una pantalla
 * exista en escritorio y no en el teléfono.
 *
 * **Están agrupadas porque diez links sueltos no entran en un renglón**, y las
 * tres formas de hacerlos entrar fallan: envueltos tiran el último elemento
 * abajo a la izquierda, con scroll horizontal se esconden las últimas dos sin
 * avisar, y achicar la tipografía compra ochenta píxeles hasta la próxima
 * sección que se agregue. Cuatro categorías entran en cualquier pantalla y van
 * a seguir entrando: lo que crece es el largo de un desplegable, no el ancho de
 * la barra.
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

export interface GrupoAdmin {
  /**
   * El nombre del desplegable, o `null` si la sección va suelta en la barra.
   *
   * Suelta va la que se mira seguido y no pertenece a ninguna de las tres
   * familias. Un grupo de un solo ítem es un click de más para llegar siempre
   * al mismo lado.
   */
  titulo: string | null
  secciones: readonly SeccionAdmin[]
}

export const GRUPOS: readonly GrupoAdmin[] = [
  {
    titulo: 'Contenido',
    secciones: [
      // `/admin` es el listado de notas, no un tablero: es la pantalla con la
      // que se abre el panel porque escribir es lo que más se hace acá.
      { href: '/admin', etiqueta: 'Notas' },
      { href: '/admin/posteos', etiqueta: 'Posteos' },
      { href: '/admin/paginas', etiqueta: 'Páginas', soloEditor: true },
    ],
  },
  {
    titulo: 'Fútbol',
    secciones: [
      { href: '/admin/partidos', etiqueta: 'Partidos' },
      { href: '/admin/jugadoras', etiqueta: 'Jugadoras' },
      { href: '/admin/equipos', etiqueta: 'Equipos' },
      // El plantel y la tabla de posiciones no tienen link propio: cuelgan de
      // una temporada y se entra desde su listado, que es donde ya se sabe de
      // cuál.
      { href: '/admin/temporadas', etiqueta: 'Temporadas' },
    ],
  },
  {
    titulo: 'Administración',
    secciones: [
      { href: '/admin/autores', etiqueta: 'Autores', soloEditor: true },
      { href: '/admin/sponsors', etiqueta: 'Sponsors', soloEditor: true },
    ],
  },
  {
    // Suelta y no adentro de "Fútbol", aunque el boceto la ponía ahí: son las
    // visitas que mide Vercel, o sea audiencia y no deporte. Al lado de
    // Jugadoras y Equipos, cualquiera entra buscando goleadoras.
    //
    // Y al final de todo, que es donde va lo que no es una familia de
    // pantallas: cerrando la fila no parte en dos a las tres categorías.
    titulo: null,
    secciones: [{ href: '/admin/estadisticas', etiqueta: 'Estadísticas' }],
  },
]

/**
 * Todas las secciones, sin agrupar.
 *
 * Se deriva de `GRUPOS` en vez de escribirse al lado: una sección que esté en
 * una lista y no en la otra es justo el bug que este archivo vino a evitar.
 */
export const SECCIONES: readonly SeccionAdmin[] = GRUPOS.flatMap((grupo) => grupo.secciones)

/** Las que le corresponden a un rol. */
export function seccionesDe(rol: RolDeAutor): SeccionAdmin[] {
  return SECCIONES.filter((seccion) => !seccion.soloEditor || rol === 'editor')
}

/**
 * Los grupos que le corresponden a un rol, **sin los que quedaron vacíos**.
 *
 * Para un redactor, "Administración" no tiene ni una sección: sus dos ítems son
 * `soloEditor`. Sin este filtro la barra le mostraría un desplegable que se
 * abre en una lista vacía, que es peor que no mostrarlo —parece roto, y deja
 * ver que existe algo a lo que no llega—.
 */
export function gruposDe(rol: RolDeAutor): GrupoAdmin[] {
  return GRUPOS.map((grupo) => ({
    ...grupo,
    secciones: grupo.secciones.filter((seccion) => !seccion.soloEditor || rol === 'editor'),
  })).filter((grupo) => grupo.secciones.length > 0)
}

/**
 * En qué sección estamos parados, para el título de la barra de celular y para
 * marcar el grupo abierto en la de escritorio.
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

/** El grupo que contiene a la sección donde estamos parados, si hay alguno. */
export function grupoActivo(ruta: string, grupos: readonly GrupoAdmin[]): GrupoAdmin | null {
  const actual = seccionActiva(
    ruta,
    grupos.flatMap((grupo) => grupo.secciones),
  )
  if (!actual) return null

  return grupos.find((grupo) => grupo.secciones.some((s) => s.href === actual.href)) ?? null
}
