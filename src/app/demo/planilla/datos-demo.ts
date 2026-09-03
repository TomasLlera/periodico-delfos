/**
 * Datos falsos para ver `<PlanillaPartido />` sin Supabase.
 *
 * Las jugadoras son inventadas. Este archivo y la página que lo usa se borran
 * cuando haya datos reales en la base (Step 6 del Build Order).
 */

import type {
  Equipo,
  EventoConJugadora,
  FormacionConJugadora,
  Jugadora,
  PartidoCompleto,
  Posicion,
  Temporada,
  TipoEvento,
} from '@/types'

// ============================================
// Catálogos
// ============================================

const temporada: Temporada = {
  id: 'tmp-primera-b-2026',
  nombre: 'Primera B 2026',
  slug: 'primera-b-2026',
  division: 'Primera B',
  anio: 2026,
  zona: 'Zona A',
  activa: true,
  created_at: '2026-01-15T12:00:00.000Z',
}

function equipo(
  nombre: string,
  nombre_corto: string,
  ciudad: string,
  es_aldosivi = false,
): Equipo {
  return {
    id: `eq-${sinAcentos(nombre_corto)}`,
    nombre,
    nombre_corto,
    apodo: es_aldosivi ? 'Las Tiburonas' : null,
    slug: sinAcentos(nombre_corto),
    escudo_url: null,
    ciudad,
    es_aldosivi,
  }
}

const ALDOSIVI = equipo('Club Atlético Aldosivi', 'Aldosivi', 'Mar del Plata', true)
const ALL_BOYS = equipo('Club Atlético All Boys', 'All Boys', 'Buenos Aires')
const ESTUDIANTES = equipo('Estudiantes de La Plata', 'Estudiantes', 'La Plata')
const ESPANOL = equipo('Deportivo Español', 'Dep. Español', 'Buenos Aires')

// ============================================
// Plantel
// ============================================

function jugadora(nombre: string, apellido: string, posicion: Posicion): Jugadora {
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
  }
}

const LAREA = jugadora('Julieta', 'Larea', 'mediocampista')
const GARRO = jugadora('Brenda', 'Garro', 'mediocampista')
const CORTADI = jugadora('Lucía', 'Cortadi', 'delantera')
const MOLINA = jugadora('Agustina', 'Molina', 'delantera')
const SOSA = jugadora('Milagros', 'Sosa', 'delantera')
const ACOSTA = jugadora('Priscila', 'Acosta', 'mediocampista')

/** Los once primeros son titulares; el resto, banco. */
const PLANTEL: Jugadora[] = [
  jugadora('Micaela', 'Díaz', 'arquera'),
  jugadora('Rocío', 'Cassarino', 'defensora'),
  jugadora('Ayelén', 'Corona', 'defensora'),
  jugadora('Sofía', 'Ibarra', 'defensora'),
  LAREA,
  jugadora('Camila', 'Peralta', 'mediocampista'),
  GARRO,
  jugadora('Delfina', 'Quiroga', 'mediocampista'),
  CORTADI,
  MOLINA,
  SOSA,
  jugadora('Valentina', 'Bustos', 'arquera'),
  ACOSTA,
  jugadora('Abril', 'Núñez', 'defensora'),
  jugadora('Guadalupe', 'Ramos', 'delantera'),
  jugadora('Malena', 'Ojeda', 'mediocampista'),
]

function formaciones(partidoId: string): FormacionConJugadora[] {
  return PLANTEL.map((jug, indice) => ({
    partido_id: partidoId,
    jugadora_id: jug.id,
    es_titular: indice < 11,
    dorsal: indice + 1,
    posicion: jug.posicion,
    jugadora: jug,
  }))
}

// ============================================
// Eventos
// ============================================

interface EventoDemo {
  minuto: number
  adicionado?: number
  tipo: TipoEvento
  equipo: Equipo
  /** Jugadora de Aldosivi (FK) o nombre libre si es del rival. */
  jugadora?: Jugadora
  nombre?: string
  sale?: Jugadora
  saleNombre?: string
  detalle?: string
}

function referencia(jug: Jugadora) {
  return { id: jug.id, nombre: jug.nombre, apellido: jug.apellido, slug: jug.slug }
}

function eventos(partidoId: string, definiciones: EventoDemo[]): EventoConJugadora[] {
  return definiciones.map((def, indice) => ({
    id: `${partidoId}-ev-${indice}`,
    partido_id: partidoId,
    minuto: def.minuto,
    adicionado: def.adicionado ?? 0,
    tipo: def.tipo,
    equipo_id: def.equipo.id,
    jugadora_id: def.jugadora?.id ?? null,
    jugadora_nombre: def.jugadora ? null : (def.nombre ?? null),
    jugadora_sale_id: def.sale?.id ?? null,
    jugadora_sale_nombre: def.sale ? null : (def.saleNombre ?? null),
    detalle: def.detalle ?? null,
    jugadora: def.jugadora ? referencia(def.jugadora) : null,
    jugadora_sale: def.sale ? referencia(def.sale) : null,
  }))
}

// ============================================
// Partidos
// ============================================

/** Aldosivi de local, gana 2 a 1. Ejercita todos los tipos de evento. */
export const partidoCompleto: PartidoCompleto = {
  id: 'par-fecha-11',
  temporada_id: temporada.id,
  fecha_numero: 11,
  fecha_hora: '2026-08-02T15:30:00.000Z',
  equipo_local_id: ALDOSIVI.id,
  equipo_visitante_id: ALL_BOYS.id,
  goles_local: 2,
  goles_visitante: 1,
  estado: 'finalizado',
  cancha: 'Estadio José María Minella',
  arbitra: 'Daiana Milone',
  slug: 'fecha-11-aldosivi-all-boys-2026',
  observaciones: null,
  created_at: '2026-08-02T18:00:00.000Z',
  equipo_local: ALDOSIVI,
  equipo_visitante: ALL_BOYS,
  temporada,
  formaciones: formaciones('par-fecha-11'),
  eventos: eventos('par-fecha-11', [
    { minuto: 12, tipo: 'amarilla', equipo: ALL_BOYS, nombre: 'M. Suárez' },
    { minuto: 23, tipo: 'gol', equipo: ALDOSIVI, jugadora: CORTADI },
    { minuto: 34, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: GARRO },
    { minuto: 41, tipo: 'gol', equipo: ALL_BOYS, nombre: 'R. Ledesma' },
    {
      minuto: 45,
      adicionado: 2,
      tipo: 'penal_errado',
      equipo: ALDOSIVI,
      jugadora: CORTADI,
      detalle: 'Atajó Benítez',
    },
    { minuto: 58, tipo: 'cambio', equipo: ALDOSIVI, jugadora: ACOSTA, sale: LAREA },
    { minuto: 58, tipo: 'amarilla', equipo: ALL_BOYS, nombre: 'P. Bordón' },
    { minuto: 67, tipo: 'gol_penal', equipo: ALDOSIVI, jugadora: GARRO },
    { minuto: 74, tipo: 'lesion', equipo: ALL_BOYS, nombre: 'V. Robledo' },
    { minuto: 81, tipo: 'doble_amarilla', equipo: ALL_BOYS, nombre: 'M. Suárez' },
    { minuto: 90, adicionado: 4, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: SOSA },
  ]),
}

/**
 * Aldosivi de visitante y con un gol en contra a favor: los dos casos que más
 * fácil se rompen. Aldosivi sigue a la izquierda aunque sea el visitante.
 */
export const partidoDeVisitante: PartidoCompleto = {
  id: 'par-fecha-10',
  temporada_id: temporada.id,
  fecha_numero: 10,
  fecha_hora: '2026-07-26T11:00:00.000Z',
  equipo_local_id: ESTUDIANTES.id,
  equipo_visitante_id: ALDOSIVI.id,
  goles_local: 1,
  goles_visitante: 2,
  estado: 'finalizado',
  cancha: 'Country Club City Bell',
  arbitra: null,
  slug: 'fecha-10-estudiantes-aldosivi-2026',
  observaciones: 'Se jugó a puertas cerradas por refacciones en la tribuna visitante.',
  created_at: '2026-07-26T14:00:00.000Z',
  equipo_local: ESTUDIANTES,
  equipo_visitante: ALDOSIVI,
  temporada,
  formaciones: formaciones('par-fecha-10'),
  eventos: eventos('par-fecha-10', [
    { minuto: 30, tipo: 'gol_en_contra', equipo: ESTUDIANTES, nombre: 'C. Vera' },
    { minuto: 55, tipo: 'gol', equipo: ESTUDIANTES, nombre: 'L. Ferrari' },
    { minuto: 63, tipo: 'roja', equipo: ESTUDIANTES, nombre: 'J. Aguirre' },
    { minuto: 88, tipo: 'gol', equipo: ALDOSIVI, jugadora: MOLINA },
  ]),
}

/** Sin jugar: estados vacíos escritos, no una pantalla en blanco. */
export const partidoProgramado: PartidoCompleto = {
  id: 'par-fecha-12',
  temporada_id: temporada.id,
  fecha_numero: 12,
  fecha_hora: '2026-08-09T15:00:00.000Z',
  equipo_local_id: ALDOSIVI.id,
  equipo_visitante_id: ESPANOL.id,
  goles_local: null,
  goles_visitante: null,
  estado: 'programado',
  cancha: 'Estadio José María Minella',
  arbitra: null,
  slug: 'fecha-12-aldosivi-deportivo-espanol-2026',
  observaciones: null,
  created_at: '2026-08-03T10:00:00.000Z',
  equipo_local: ALDOSIVI,
  equipo_visitante: ESPANOL,
  temporada,
  formaciones: [],
  eventos: [],
}

function sinAcentos(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
