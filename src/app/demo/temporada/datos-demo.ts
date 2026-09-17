/**
 * La Primera B 2026 de verdad, para ver las páginas deportivas sin Supabase.
 *
 * **Ya no es inventado.** Todo lo de este archivo sale del sitio viejo, leído
 * con `scripts/migrate-wp.ts` en seco: el plantel es el de
 * `/plantel-2026-de-las-tiburonas/` y el fixture, los resultados, las canchas,
 * los horarios y los goles salen de la ficha y las incidencias de cada crónica.
 * Sigue viviendo en `src/app/demo/` porque son datos de archivo cargados a
 * mano, no la base: ninguna ruta pública importa de acá.
 *
 * **La única excepción es `tablaDemo`**, que está marcada abajo: la tabla de
 * posiciones se carga a mano desde AFA y el sitio viejo nunca la publicó, así
 * que no hay de dónde sacarla. La fila de Aldosivi sí lleva su campaña real.
 *
 * Tres cosas que el sitio viejo **no** registra, y por eso no están acá:
 *
 * - **La mitad de los goles no tienen minuto.** Las incidencias de las fechas
 *   3, 4, 6, 7, 10 y 12 dicen quién convirtió pero no cuándo. `eventos` exige
 *   `minuto`, así que esos goles no se pueden cargar sin que alguien los
 *   complete: `goleadorasDemo` los cuenta igual porque la autoría sí está.
 * - **No hay dorsales fijos.** El número cambia partido a partido y el propio
 *   artículo del plantel lo dice ("la falta de dorsales fijos"). Van en `null`.
 * - **Ninguna foto tiene texto alternativo**, así que ninguna jugadora tiene
 *   `foto_url`: la regla no negociable 4 lo exige y no se inventa.
 *
 * Los nombres siguen la grafía del artículo del plantel. Las crónicas escriben
 * algunos distinto —Veñardez/Velardez, Audicana/Audicana, Surban/Surbán,
 * Mozquera/Mosquera— y eso lo tiene que unificar una persona, no un script.
 */

import type {
  Equipo,
  EstadisticasJugadora,
  FilaTablaConEquipo,
  GolDeJugadora,
  Goleadora,
  Jugadora,
  JugadoraEnPlantel,
  PartidoConEquipos,
  Posicion,
  Temporada,
} from '@/types'

function sinAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

// ============================================
// Catálogos
// ============================================

export const temporadaDemo: Temporada = {
  id: 'tmp-primera-b-2026',
  nombre: 'Primera B 2026',
  slug: 'primera-b-2026',
  division: 'Primera B',
  anio: 2026,
  zona: 'Zona B',
  activa: true,
  created_at: '2026-03-01T12:00:00.000Z',
}

/** El torneo que ganaron: "Tiburonas Campeonas" en las crónicas de octubre. */
const temporadaAnterior: Temporada = {
  id: 'tmp-primera-c-2024',
  nombre: 'Primera C 2024',
  slug: 'primera-c-2024',
  division: 'Primera C',
  anio: 2024,
  zona: null,
  activa: false,
  created_at: '2024-03-01T12:00:00.000Z',
}

/** `ciudad` sólo donde la ficha de algún partido la dice. */
function equipo(nombre: string, corto: string, ciudad: string | null, esAldosivi = false): Equipo {
  return {
    id: `eq-${sinAcentos(corto)}`,
    nombre,
    nombre_corto: corto,
    apodo: esAldosivi ? 'Las Tiburonas' : null,
    slug: sinAcentos(corto),
    escudo_url: null,
    ciudad,
    es_aldosivi: esAldosivi,
  }
}

const ALDOSIVI = equipo('Club Atlético Aldosivi', 'Aldosivi', 'Mar del Plata', true)
const DEFENSORES = equipo('Defensores de Belgrano', 'Defensores', 'CABA')
const ALL_BOYS = equipo('Club Atlético All Boys', 'All Boys', 'CABA')
const DEFENSA = equipo('Defensa y Justicia', 'Defensa', null)
const CLAYPOLE = equipo('Club Atlético Claypole', 'Claypole', null)
const UAI = equipo('UAI Urquiza', 'UAI Urquiza', 'Villa Lynch')
const MORON = equipo('Club Deportivo Morón', 'Dep. Morón', null)
const COMUNICACIONES = equipo('Club Comunicaciones', 'Comunicaciones', 'CABA')
const ESTRELLA = equipo('Estrella del Sur', 'Estrella del Sur', null)
const CENTRAL = equipo('Rosario Central', 'Central', 'Rosario')

// ============================================
// Plantel 2026
// ============================================

/**
 * Las 32 del artículo del plantel, más el DT que firman las fichas.
 *
 * `dorsal` va en `null` a propósito: el número cambia fecha a fecha y el
 * artículo lo dice. Los dorsales que se ven en `/demo/partido` son los de
 * **ese** partido, que es donde viven de verdad (`formaciones.dorsal`).
 */
function jugadora(nombre: string, apellido: string, posicion: Posicion): JugadoraEnPlantel {
  const slug = sinAcentos(`${nombre}-${apellido}`)
  return {
    id: `jug-${slug}`,
    nombre,
    apellido,
    slug,
    posicion,
    fecha_nacimiento: null,
    foto_url: null,
    lugar_origen: null,
    bio: null,
    activa: true,
    dorsal: null,
    posicion_temporada: posicion,
    capitana: false,
  }
}

export const plantelDemo: JugadoraEnPlantel[] = [
  jugadora('Agustina', 'Díaz', 'arquera'),
  jugadora('Katja', 'Veñardez', 'arquera'),
  jugadora('Luna', 'Vera', 'arquera'),

  jugadora('Sol', 'Cassarino', 'defensora'),
  jugadora('Sol', 'Contrera', 'defensora'),
  jugadora('Selene', 'Corona', 'defensora'),
  jugadora('Agustina', 'Cuello', 'defensora'),
  jugadora('Juana', 'García', 'defensora'),
  jugadora('Laura', 'Ghiglione', 'defensora'),
  jugadora('Delfina', 'González', 'defensora'),
  jugadora('Julieta', 'Nielsen', 'defensora'),
  jugadora('Rebeca', 'Raimman', 'defensora'),
  jugadora('Luna', 'Sahakian', 'defensora'),

  jugadora('Angelina', 'Audicana', 'mediocampista'),
  jugadora('Nadia', 'Auzmendi', 'mediocampista'),
  jugadora('Ailen', 'Camacho', 'mediocampista'),
  jugadora('Mora', 'Camino', 'mediocampista'),
  jugadora('Guadalupe', 'Contín', 'mediocampista'),
  jugadora('Lorena', 'Cortadi', 'mediocampista'),
  jugadora('Griselda', 'Garro', 'mediocampista'),
  jugadora('Lara', 'González', 'mediocampista'),
  jugadora('Daiana', 'González', 'mediocampista'),
  jugadora('Rocío', 'Gutiérrez', 'mediocampista'),
  jugadora('Delfina', 'Morán', 'mediocampista'),
  jugadora('Johana', 'Surban', 'mediocampista'),

  jugadora('Ludmila', 'Acosta', 'delantera'),
  jugadora('Mylena', 'Corona', 'delantera'),
  jugadora('Lucero', 'Giménez', 'delantera'),
  jugadora('Morena', 'Larea', 'delantera'),
  jugadora('Victoria', 'Mozquera', 'delantera'),
  jugadora('Morena', 'Stancato', 'delantera'),
  jugadora('Lucero', 'Aquino', 'delantera'),

  jugadora('Marcelo', 'Rodríguez', 'dt'),
]

function del(apellido: string): JugadoraEnPlantel {
  const encontrada = plantelDemo.find((j) => j.apellido === apellido)
  if (!encontrada) throw new Error(`No está ${apellido} en el plantel 2026`)
  return encontrada
}

/** La ficha que muestra `/demo/jugadora`: la goleadora del torneo. */
export const jugadoraDemo: Jugadora = del('Larea')

export const filaPlantelDemo = del('Larea')

// ============================================
// Fixture — las 12 fechas jugadas
// ============================================

interface PartidoReal {
  fecha: number
  rival: Equipo
  deLocal: boolean
  /** Hora de Argentina, la que dice la ficha del partido. */
  cuando: string
  cancha: string
  golesAldosivi: number
  golesRival: number
}

function partido(dato: PartidoReal): PartidoConEquipos {
  const local = dato.deLocal ? ALDOSIVI : dato.rival
  const visitante = dato.deLocal ? dato.rival : ALDOSIVI

  return {
    id: `par-f${dato.fecha}`,
    temporada_id: temporadaDemo.id,
    fecha_numero: dato.fecha,
    fecha_hora: dato.cuando,
    equipo_local_id: local.id,
    equipo_visitante_id: visitante.id,
    goles_local: dato.deLocal ? dato.golesAldosivi : dato.golesRival,
    goles_visitante: dato.deLocal ? dato.golesRival : dato.golesAldosivi,
    estado: 'finalizado',
    cancha: dato.cancha,
    // Ninguna ficha del sitio viejo nombra a la árbitra.
    arbitra: null,
    slug: `fecha-${dato.fecha}-${sinAcentos(local.nombre_corto)}-${sinAcentos(visitante.nombre_corto)}-2026`,
    observaciones: null,
    created_at: dato.cuando,
    equipo_local: local,
    equipo_visitante: visitante,
    temporada: temporadaDemo,
  }
}

const PUNTA_MOGOTES = 'Predio Punta Mogotes, Mar del Plata'

export const fixtureDemo: PartidoConEquipos[] = [
  partido({ fecha: 1, rival: DEFENSORES, deLocal: true, cuando: '2026-04-11T18:00:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 2, golesRival: 1 }),
  partido({ fecha: 2, rival: ALL_BOYS, deLocal: false, cuando: '2026-04-19T15:00:00-03:00', cancha: 'Estadio Islas Malvinas, CABA', golesAldosivi: 1, golesRival: 6 }),
  partido({ fecha: 3, rival: DEFENSA, deLocal: true, cuando: '2026-04-25T18:30:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 1, golesRival: 4 }),
  partido({ fecha: 4, rival: CLAYPOLE, deLocal: true, cuando: '2026-05-09T18:00:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 6, golesRival: 1 }),
  partido({ fecha: 5, rival: UAI, deLocal: false, cuando: '2026-05-17T11:00:00-03:00', cancha: 'Estadio Monumental, Villa Lynch', golesAldosivi: 4, golesRival: 2 }),
  partido({ fecha: 6, rival: MORON, deLocal: true, cuando: '2026-05-30T17:00:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 2, golesRival: 3 }),
  partido({ fecha: 7, rival: COMUNICACIONES, deLocal: false, cuando: '2026-06-07T15:30:00-03:00', cancha: 'Predio Comunicaciones, CABA', golesAldosivi: 2, golesRival: 2 }),
  partido({ fecha: 8, rival: ESTRELLA, deLocal: true, cuando: '2026-06-26T19:00:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 3, golesRival: 2 }),
  partido({ fecha: 9, rival: CENTRAL, deLocal: false, cuando: '2026-07-04T14:00:00-03:00', cancha: 'Estadio Gigante de Arroyito, Rosario', golesAldosivi: 0, golesRival: 9 }),
  partido({ fecha: 10, rival: DEFENSORES, deLocal: false, cuando: '2026-07-26T15:00:00-03:00', cancha: 'Estadio Juan Pascuale, CABA', golesAldosivi: 1, golesRival: 2 }),
  partido({ fecha: 11, rival: ALL_BOYS, deLocal: true, cuando: '2026-08-02T11:00:00-03:00', cancha: PUNTA_MOGOTES, golesAldosivi: 0, golesRival: 1 }),
  partido({ fecha: 12, rival: DEFENSA, deLocal: false, cuando: '2026-08-08T15:30:00-03:00', cancha: 'Predio Campeones del Mundo, Zeballos', golesAldosivi: 1, golesRival: 2 }),
]

// ============================================
// Tabla de posiciones — LO ÚNICO INVENTADO
// ============================================

/**
 * **Las nueve filas que no son Aldosivi son inventadas.**
 *
 * La tabla se carga a mano desde AFA (ver `0004_tabla_posiciones.sql`) y el
 * sitio viejo nunca la publicó: no hay de dónde sacar los partidos que los
 * rivales jugaron entre sí. Existe para poder mirar `<TablaPosiciones />` y
 * `<BarraEstado />`, y **la posición de Aldosivi también es inventada**: lo
 * único real de su fila es la campaña, contada desde el fixture de arriba —12
 * jugados, 4 ganados, 1 empatado, 7 perdidos, 23 goles a favor y 35 en contra,
 * 13 puntos—.
 */
function fila(
  posicion: number,
  eq: Equipo,
  ganados: number,
  empatados: number,
  perdidos: number,
  golesFavor: number,
  golesContra: number,
): FilaTablaConEquipo {
  return {
    id: `tab-${eq.id}`,
    temporada_id: temporadaDemo.id,
    fecha_numero: 12,
    equipo_id: eq.id,
    posicion,
    puntos: ganados * 3 + empatados,
    jugados: ganados + empatados + perdidos,
    ganados,
    empatados,
    perdidos,
    goles_favor: golesFavor,
    goles_contra: golesContra,
    equipo: eq,
  }
}

export const FECHA_TABLA_DEMO = 12

/**
 * Diez equipos y no doce: son los que las crónicas confirman que están en la
 * zona. Inventar dos clubes más para llenar la tabla sería inventar clubes.
 */
export const tablaDemo: FilaTablaConEquipo[] = [
  fila(1, CENTRAL, 10, 1, 1, 34, 6),
  fila(2, ALL_BOYS, 9, 2, 1, 28, 9),
  fila(3, UAI, 8, 2, 2, 24, 12),
  fila(4, DEFENSA, 7, 3, 2, 21, 13),
  fila(5, MORON, 6, 3, 3, 18, 14),
  fila(6, COMUNICACIONES, 5, 4, 3, 16, 15),
  fila(7, DEFENSORES, 5, 2, 5, 15, 17),
  fila(8, ALDOSIVI, 4, 1, 7, 23, 35),
  fila(9, ESTRELLA, 3, 3, 6, 13, 20),
  fila(10, CLAYPOLE, 2, 2, 8, 10, 26),
]

// ============================================
// Goleadoras — las 23 de Aldosivi, contadas de las incidencias
// ============================================

/**
 * Sale de las incidencias de las doce crónicas, sumando por apellido.
 *
 * **Cuenta goles sin minuto**, que son la mitad: la autoría está escrita en
 * todas las fechas aunque el minuto no. En producción esta lista es una vista
 * sobre `eventos` (ver `0006_vistas.sql`), así que hasta que alguien complete
 * los minutos que faltan, la vista va a contar menos goles que estos.
 *
 * Las 23 cuadran con el fixture: 2+1+1+6+4+2+2+3+0+1+0+1.
 */
function goleadora(apellido: string, goles: number): Goleadora {
  const jug = del(apellido)
  return {
    temporada_id: temporadaDemo.id,
    jugadora_id: jug.id,
    nombre: jug.nombre,
    apellido: jug.apellido,
    slug: jug.slug,
    foto_url: null,
    goles,
    // Ninguna incidencia del sitio viejo marca si el gol fue de penal.
    de_penal: 0,
  }
}

export const goleadorasDemo: Goleadora[] = [
  goleadora('Larea', 8),
  goleadora('Nielsen', 4),
  goleadora('Camacho', 3),
  goleadora('Cortadi', 2),
  goleadora('Stancato', 2),
  goleadora('Contín', 1),
  goleadora('Corona', 1),
  goleadora('Gutiérrez', 1),
  goleadora('Morán', 1),
]

// ============================================
// La campaña de Larea
// ============================================

/**
 * Contada de las doce crónicas: está en el once titular en todas menos la
 * fecha 6. La amarilla y la roja son las de la fecha 5, las únicas dos
 * incidencias disciplinarias suyas que el sitio viejo registra.
 */
export const estadisticasDemo: EstadisticasJugadora[] = [
  {
    jugadora_id: jugadoraDemo.id,
    temporada_id: temporadaDemo.id,
    partidos: 11,
    titular: 11,
    goles: 8,
    amarillas: 1,
    rojas: 1,
  },
]

export const temporadasDemo: Temporada[] = [temporadaDemo, temporadaAnterior]

/**
 * **Sólo cuatro de los ocho goles de Larea.** Los otros cuatro —fechas 3, 4 y
 * 7— están en las incidencias sin minuto, y `eventos.minuto` es obligatorio.
 * Es el agujero que hay que completar a mano antes del Step 6, y se ve acá.
 *
 * Los minutos del segundo tiempo vienen sumados: "24′ ST" es el minuto 69.
 */
function gol(fechaPartido: number, minuto: number): GolDeJugadora {
  const par = fixtureDemo.find((p) => p.fecha_numero === fechaPartido)
  if (!par) throw new Error(`No está la fecha ${fechaPartido}`)

  return {
    id: `gol-f${fechaPartido}-${minuto}`,
    partido_id: par.id,
    minuto,
    adicionado: 0,
    tipo: 'gol',
    equipo_id: ALDOSIVI.id,
    jugadora_id: jugadoraDemo.id,
    jugadora_nombre: null,
    jugadora_sale_id: null,
    jugadora_sale_nombre: null,
    detalle: null,
    jugadora: {
      id: jugadoraDemo.id,
      nombre: jugadoraDemo.nombre,
      apellido: jugadoraDemo.apellido,
      slug: jugadoraDemo.slug,
    },
    jugadora_sale: null,
    partido: {
      slug: par.slug,
      fecha_numero: par.fecha_numero,
      fecha_hora: par.fecha_hora,
      temporada_id: par.temporada_id,
      equipo_local: {
        nombre_corto: par.equipo_local.nombre_corto,
        es_aldosivi: par.equipo_local.es_aldosivi,
      },
      equipo_visitante: {
        nombre_corto: par.equipo_visitante.nombre_corto,
        es_aldosivi: par.equipo_visitante.es_aldosivi,
      },
    },
  }
}

export const golesDemo: GolDeJugadora[] = [
  gol(2, 48),
  gol(5, 10),
  gol(8, 69),
  gol(8, 85),
]
