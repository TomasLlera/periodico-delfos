/**
 * Datos falsos para ver las páginas deportivas sin Supabase.
 *
 * **Todo lo de este archivo es inventado** y por eso vive en `src/app/demo/`:
 * la regla no negociable 1 prohíbe que un número deportivo inventado aparezca
 * en una ruta pública. `/temporada/[slug]`, `/plantel/[temporadaSlug]` y
 * `/jugadora/[slug]` leen la base y no importan nada de acá.
 *
 * Se borra cuando haya datos reales cargados (Step 6 del Build Order).
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
    .replace(/[\u0300-\u036f]/g, '')
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
  zona: 'Zona A',
  activa: true,
  created_at: '2026-01-15T12:00:00.000Z',
}

const temporadaAnterior: Temporada = {
  id: 'tmp-primera-c-2024',
  nombre: 'Primera C 2024',
  slug: 'primera-c-2024',
  division: 'Primera C',
  anio: 2024,
  zona: null,
  activa: false,
  created_at: '2024-01-15T12:00:00.000Z',
}

function equipo(nombre: string, corto: string, esAldosivi = false): Equipo {
  return {
    id: `eq-${sinAcentos(corto)}`,
    nombre,
    nombre_corto: corto,
    apodo: esAldosivi ? 'Las Tiburonas' : null,
    slug: sinAcentos(corto),
    escudo_url: null,
    ciudad: esAldosivi ? 'Mar del Plata' : null,
    es_aldosivi: esAldosivi,
  }
}

const ALDOSIVI = equipo('Club Atlético Aldosivi', 'Aldosivi', true)
const ALL_BOYS = equipo('Club Atlético All Boys', 'All Boys')
const ESTUDIANTES = equipo('Estudiantes de La Plata', 'Estudiantes')
const ESPANOL = equipo('Deportivo Español', 'Dep. Español')
const LAFERRERE = equipo('Club Social y Deportivo Laferrere', 'Laferrere')
const MORON = equipo('Club Deportivo Morón', 'Morón')
const BANFIELD = equipo('Club Atlético Banfield', 'Banfield')
const LANUS = equipo('Club Atlético Lanús', 'Lanús')
const TEMPERLEY = equipo('Club Atlético Temperley', 'Temperley')
const ARGENTINO = equipo('Argentino de Quilmes', 'Argentino')
const VILLA_SAN = equipo('Villa San Carlos', 'Villa San Carlos')
const CAMBACERES = equipo('Defensores de Cambaceres', 'Cambaceres')

// ============================================
// Plantel
// ============================================

interface JugadoraDemo {
  nombre: string
  apellido: string
  posicion: Posicion
  dorsal?: number | null
  capitana?: boolean
  origen?: string
  nacimiento?: string
}

function jugadora(demo: JugadoraDemo): JugadoraEnPlantel {
  const slug = sinAcentos(`${demo.nombre}-${demo.apellido}`)
  return {
    id: `jug-${slug}`,
    nombre: demo.nombre,
    apellido: demo.apellido,
    slug,
    posicion: demo.posicion,
    fecha_nacimiento: demo.nacimiento ?? null,
    foto_url: null,
    lugar_origen: demo.origen ?? null,
    bio: null,
    activa: true,
    dorsal: demo.dorsal ?? null,
    posicion_temporada: demo.posicion,
    capitana: demo.capitana ?? false,
  }
}

export const plantelDemo: JugadoraEnPlantel[] = [
  jugadora({ nombre: 'Micaela', apellido: 'Díaz', posicion: 'arquera', dorsal: 1 }),
  jugadora({ nombre: 'Valentina', apellido: 'Bustos', posicion: 'arquera', dorsal: 12 }),
  jugadora({ nombre: 'Rocío', apellido: 'Cassarino', posicion: 'defensora', dorsal: 2 }),
  jugadora({ nombre: 'Ayelén', apellido: 'Corona', posicion: 'defensora', dorsal: 3, capitana: true }),
  jugadora({ nombre: 'Sofía', apellido: 'Ibarra', posicion: 'defensora', dorsal: 4 }),
  jugadora({ nombre: 'Abril', apellido: 'Núñez', posicion: 'defensora', dorsal: 6 }),
  jugadora({ nombre: 'Martina', apellido: 'Ojeda', posicion: 'defensora', dorsal: null }),
  jugadora({ nombre: 'Julieta', apellido: 'Larea', posicion: 'mediocampista', dorsal: 5 }),
  jugadora({ nombre: 'Camila', apellido: 'Peralta', posicion: 'mediocampista', dorsal: 8 }),
  jugadora({ nombre: 'Brenda', apellido: 'Garro', posicion: 'mediocampista', dorsal: 10 }),
  jugadora({ nombre: 'Delfina', apellido: 'Quiroga', posicion: 'mediocampista', dorsal: 14 }),
  jugadora({ nombre: 'Priscila', apellido: 'Acosta', posicion: 'mediocampista', dorsal: 16 }),
  jugadora({ nombre: 'Malena', apellido: 'Ferreyra', posicion: 'mediocampista', dorsal: null }),
  jugadora({
    nombre: 'Lucía',
    apellido: 'Cortadi',
    posicion: 'delantera',
    dorsal: 9,
    origen: 'Mar del Plata',
    nacimiento: '2002-04-18',
  }),
  jugadora({ nombre: 'Agustina', apellido: 'Molina', posicion: 'delantera', dorsal: 7 }),
  jugadora({ nombre: 'Milagros', apellido: 'Sosa', posicion: 'delantera', dorsal: 11 }),
  jugadora({ nombre: 'Guadalupe', apellido: 'Ramos', posicion: 'delantera', dorsal: 17 }),
  jugadora({ nombre: 'Carla', apellido: 'Rossi', posicion: 'dt', dorsal: null }),
  jugadora({ nombre: 'Noelia', apellido: 'Vera', posicion: 'ayudante', dorsal: null }),
]

/** La ficha que muestra `/demo/jugadora`: la 9, con goles y dos temporadas. */
export const jugadoraDemo: Jugadora = {
  ...plantelDemo.find((j) => j.apellido === 'Cortadi')!,
  bio: 'Llegó del baby de Kimberley en 2023. Máxima goleadora del club en la Primera C 2024 y la primera en llegar a los 20 goles con la camiseta.',
}

export const filaPlantelDemo = plantelDemo.find((j) => j.apellido === 'Cortadi')!

// ============================================
// Fixture
// ============================================

interface PartidoDemo {
  fecha: number
  rival: Equipo
  deLocal: boolean
  cuando: string
  golesAldosivi?: number
  golesRival?: number
  estado?: PartidoConEquipos['estado']
}

function partido(demo: PartidoDemo): PartidoConEquipos {
  const jugado = demo.golesAldosivi !== undefined && demo.golesRival !== undefined
  const local = demo.deLocal ? ALDOSIVI : demo.rival
  const visitante = demo.deLocal ? demo.rival : ALDOSIVI

  return {
    id: `par-${demo.fecha}`,
    temporada_id: temporadaDemo.id,
    fecha_numero: demo.fecha,
    fecha_hora: demo.cuando,
    equipo_local_id: local.id,
    equipo_visitante_id: visitante.id,
    goles_local: jugado ? (demo.deLocal ? demo.golesAldosivi! : demo.golesRival!) : null,
    goles_visitante: jugado ? (demo.deLocal ? demo.golesRival! : demo.golesAldosivi!) : null,
    estado: demo.estado ?? (jugado ? 'finalizado' : 'programado'),
    cancha: demo.deLocal ? 'Estadio José María Minella' : null,
    arbitra: null,
    slug: `fecha-${demo.fecha}-${sinAcentos(local.nombre_corto)}-${sinAcentos(visitante.nombre_corto)}-2026`,
    observaciones: null,
    created_at: demo.cuando,
    equipo_local: local,
    equipo_visitante: visitante,
    temporada: temporadaDemo,
  }
}

export const fixtureDemo: PartidoConEquipos[] = [
  partido({ fecha: 1, rival: CAMBACERES, deLocal: true, cuando: '2026-03-07T15:30:00.000Z', golesAldosivi: 3, golesRival: 0 }),
  partido({ fecha: 2, rival: LANUS, deLocal: false, cuando: '2026-03-14T11:00:00.000Z', golesAldosivi: 1, golesRival: 1 }),
  partido({ fecha: 3, rival: BANFIELD, deLocal: true, cuando: '2026-03-21T15:30:00.000Z', golesAldosivi: 2, golesRival: 1 }),
  partido({ fecha: 4, rival: VILLA_SAN, deLocal: false, cuando: '2026-04-04T11:00:00.000Z', golesAldosivi: 0, golesRival: 2 }),
  partido({ fecha: 5, rival: TEMPERLEY, deLocal: true, cuando: '2026-04-11T15:30:00.000Z', golesAldosivi: 4, golesRival: 1 }),
  partido({ fecha: 6, rival: ARGENTINO, deLocal: false, cuando: '2026-04-25T11:00:00.000Z', golesAldosivi: 2, golesRival: 2 }),
  partido({ fecha: 7, rival: LAFERRERE, deLocal: true, cuando: '2026-05-09T15:30:00.000Z', golesAldosivi: 7, golesRival: 0 }),
  partido({ fecha: 8, rival: MORON, deLocal: false, cuando: '2026-05-23T11:00:00.000Z', golesAldosivi: 1, golesRival: 0 }),
  partido({ fecha: 9, rival: ESPANOL, deLocal: true, cuando: '2026-06-06T15:30:00.000Z', golesAldosivi: 1, golesRival: 1, estado: 'suspendido' }),
  partido({ fecha: 10, rival: ESTUDIANTES, deLocal: false, cuando: '2026-07-26T11:00:00.000Z', golesAldosivi: 2, golesRival: 1 }),
  partido({ fecha: 11, rival: ALL_BOYS, deLocal: true, cuando: '2026-08-02T15:30:00.000Z', golesAldosivi: 2, golesRival: 1 }),
  partido({ fecha: 12, rival: ESPANOL, deLocal: true, cuando: '2026-09-20T15:00:00.000Z' }),
  partido({ fecha: 13, rival: CAMBACERES, deLocal: false, cuando: '2026-09-27T11:00:00.000Z' }),
  partido({ fecha: 14, rival: LANUS, deLocal: true, cuando: '2026-10-04T15:00:00.000Z', estado: 'postergado' }),
]

// ============================================
// Tabla de posiciones
// ============================================

/**
 * `puntos` y `jugados` se calculan, no se tipean: la tabla real tiene dos
 * CHECK que los exigen cuadrados (`partidos_cuadran` y `puntos_cuadran` en
 * `0004_tabla_posiciones.sql`), y unos datos de prueba que no los respetan
 * dibujan una tabla que la base nunca aceptaría.
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
    fecha_numero: 11,
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

export const FECHA_TABLA_DEMO = 11

export const tablaDemo: FilaTablaConEquipo[] = [
  fila(1, VILLA_SAN, 8, 2, 1, 22, 8),
  fila(2, MORON, 8, 1, 2, 19, 9),
  fila(3, ALDOSIVI, 7, 3, 1, 25, 10),
  fila(4, ESTUDIANTES, 6, 3, 2, 18, 11),
  fila(5, BANFIELD, 5, 3, 3, 15, 12),
  fila(6, LANUS, 4, 4, 3, 13, 12),
  fila(7, ARGENTINO, 4, 2, 5, 12, 15),
  fila(8, TEMPERLEY, 3, 3, 5, 11, 16),
  fila(9, ESPANOL, 3, 2, 6, 10, 18),
  fila(10, ALL_BOYS, 2, 3, 6, 9, 17),
  fila(11, CAMBACERES, 2, 1, 8, 7, 21),
  fila(12, LAFERRERE, 0, 3, 8, 5, 27),
]

// ============================================
// Goleadoras
// ============================================

function goleadora(apellido: string, goles: number, dePenal = 0): Goleadora {
  const jug = plantelDemo.find((j) => j.apellido === apellido)!
  return {
    temporada_id: temporadaDemo.id,
    jugadora_id: jug.id,
    nombre: jug.nombre,
    apellido: jug.apellido,
    slug: jug.slug,
    foto_url: null,
    goles,
    de_penal: dePenal,
  }
}

export const goleadorasDemo: Goleadora[] = [
  goleadora('Cortadi', 9, 2),
  goleadora('Molina', 5),
  goleadora('Garro', 4, 3),
  goleadora('Sosa', 3),
  goleadora('Peralta', 2),
  goleadora('Ramos', 1),
  goleadora('Corona', 1),
]

// ============================================
// Estadísticas y goles de la jugadora de la demo
// ============================================

export const estadisticasDemo: EstadisticasJugadora[] = [
  {
    jugadora_id: jugadoraDemo.id,
    temporada_id: temporadaDemo.id,
    partidos: 11,
    titular: 10,
    goles: 9,
    amarillas: 2,
    rojas: 0,
  },
  {
    jugadora_id: jugadoraDemo.id,
    temporada_id: temporadaAnterior.id,
    partidos: 18,
    titular: 15,
    goles: 12,
    amarillas: 3,
    rojas: 1,
  },
]

export const temporadasDemo: Temporada[] = [temporadaDemo, temporadaAnterior]

interface GolDemo {
  fechaPartido: number
  minuto: number
  adicionado?: number
  penal?: boolean
}

/** Los goles salen del fixture de arriba: el rival y la fecha son los reales. */
function gol(demo: GolDemo): GolDeJugadora {
  const par = fixtureDemo.find((p) => p.fecha_numero === demo.fechaPartido)!

  return {
    id: `gol-${demo.fechaPartido}-${demo.minuto}`,
    partido_id: par.id,
    minuto: demo.minuto,
    adicionado: demo.adicionado ?? 0,
    tipo: demo.penal ? 'gol_penal' : 'gol',
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
  gol({ fechaPartido: 1, minuto: 14 }),
  gol({ fechaPartido: 1, minuto: 62, penal: true }),
  gol({ fechaPartido: 3, minuto: 71 }),
  gol({ fechaPartido: 5, minuto: 9 }),
  gol({ fechaPartido: 5, minuto: 55 }),
  gol({ fechaPartido: 7, minuto: 33 }),
  gol({ fechaPartido: 7, minuto: 78, penal: true }),
  gol({ fechaPartido: 10, minuto: 45, adicionado: 2 }),
  gol({ fechaPartido: 11, minuto: 23 }),
]
