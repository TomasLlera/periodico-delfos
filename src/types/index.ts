/**
 * Tipos de dominio, escritos a mano contra el schema de `supabase/migrations`.
 *
 * Una vez que exista el proyecto de Supabase, correr:
 *   pnpm dlx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
 * y usar los tipos generados como fuente de verdad. Estos siguen siendo útiles
 * para las formas compuestas (con joins) que las queries devuelven.
 */

export type Posicion =
  | 'arquera'
  | 'defensora'
  | 'mediocampista'
  | 'delantera'
  | 'dt'
  | 'ayudante'

export type EstadoPartido =
  | 'programado'
  | 'en_curso'
  | 'finalizado'
  | 'suspendido'
  | 'postergado'

export type TipoEvento =
  | 'gol'
  | 'gol_penal'
  | 'gol_en_contra'
  | 'penal_errado'
  | 'amarilla'
  | 'roja'
  | 'doble_amarilla'
  | 'cambio'
  | 'lesion'

export type Categoria =
  | 'cronica'
  | 'analisis'
  | 'temporada'
  | 'plantel'
  | 'institucional'

export type EstadoNota = 'borrador' | 'publicada' | 'archivada'

export type Red = 'facebook' | 'instagram' | 'x'
export type EstadoPosteo = 'pending' | 'processing' | 'success' | 'failed'

// ============================================
// Catálogos
// ============================================

export interface Temporada {
  id: string
  nombre: string
  slug: string
  division: string
  anio: number
  zona: string | null
  activa: boolean
  created_at: string
}

export interface Equipo {
  id: string
  nombre: string
  nombre_corto: string
  apodo: string | null
  slug: string
  escudo_url: string | null
  ciudad: string | null
  es_aldosivi: boolean
}

export interface Autor {
  id: string
  nombre: string
  slug: string
  bio: string | null
  foto_url: string | null
  instagram: string | null
  x_handle: string | null
}

// ============================================
// Jugadoras
// ============================================

export interface Jugadora {
  id: string
  nombre: string
  apellido: string
  slug: string
  posicion: Posicion
  fecha_nacimiento: string | null
  foto_url: string | null
  lugar_origen: string | null
  bio: string | null
  activa: boolean
}

export interface FilaPlantel {
  temporada_id: string
  jugadora_id: string
  dorsal: number | null
  posicion: Posicion | null
  capitana: boolean
}

/** Jugadora con sus datos de plantel de una temporada concreta. */
export interface JugadoraEnPlantel extends Jugadora {
  dorsal: number | null
  posicion_temporada: Posicion | null
  capitana: boolean
}

// ============================================
// Partidos
// ============================================

export interface Partido {
  id: string
  temporada_id: string
  fecha_numero: number | null
  fecha_hora: string
  equipo_local_id: string
  equipo_visitante_id: string
  goles_local: number | null
  goles_visitante: number | null
  estado: EstadoPartido
  cancha: string | null
  arbitra: string | null
  slug: string
  observaciones: string | null
  created_at: string
}

export interface PartidoConEquipos extends Partido {
  equipo_local: Equipo
  equipo_visitante: Equipo
  temporada: Temporada
}

export interface Evento {
  id: string
  partido_id: string
  minuto: number
  adicionado: number
  tipo: TipoEvento
  equipo_id: string
  jugadora_id: string | null
  jugadora_nombre: string | null
  jugadora_sale_id: string | null
  jugadora_sale_nombre: string | null
  detalle: string | null
}

export interface EventoConJugadora extends Evento {
  jugadora: Pick<Jugadora, 'id' | 'nombre' | 'apellido' | 'slug'> | null
  jugadora_sale: Pick<Jugadora, 'id' | 'nombre' | 'apellido' | 'slug'> | null
}

export interface Formacion {
  partido_id: string
  jugadora_id: string
  es_titular: boolean
  dorsal: number | null
  posicion: Posicion | null
}

export interface FormacionConJugadora extends Formacion {
  jugadora: Jugadora
}

/** Todo lo que `<PlanillaPartido />` necesita para renderizarse. */
export interface PartidoCompleto extends PartidoConEquipos {
  eventos: EventoConJugadora[]
  formaciones: FormacionConJugadora[]
}

// ============================================
// Tabla de posiciones
// ============================================

export interface FilaTabla {
  id: string
  temporada_id: string
  fecha_numero: number
  equipo_id: string
  posicion: number
  puntos: number
  jugados: number
  ganados: number
  empatados: number
  perdidos: number
  goles_favor: number
  goles_contra: number
}

export interface FilaTablaConEquipo extends FilaTabla {
  equipo: Equipo
}

// ============================================
// Contenido
// ============================================

/** Documento TipTap. Se valida al leer, nunca se confía en la forma cruda. */
export interface DocumentoTipTap {
  type: 'doc'
  content?: NodoTipTap[]
}

export interface NodoTipTap {
  type: string
  attrs?: Record<string, unknown>
  content?: NodoTipTap[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

export interface Nota {
  id: string
  titulo: string
  slug: string
  bajada: string
  cuerpo: DocumentoTipTap
  imagen_portada: string | null
  imagen_alt: string
  imagen_credito: string | null
  categoria: Categoria
  temporada_id: string | null
  partido_id: string | null
  autor_id: string
  estado: EstadoNota
  publicada_en: string | null
  destacada: boolean
  auto_post: boolean
  redes: Red[]
  created_at: string
  updated_at: string
}

export interface NotaConRelaciones extends Nota {
  autor: Autor
  temporada: Temporada | null
  partido: PartidoConEquipos | null
}

/** Forma reducida para listados y cards: no trae el cuerpo. */
export type NotaResumen = Omit<Nota, 'cuerpo'> & {
  autor: Pick<Autor, 'nombre' | 'slug'>
}

// ============================================
// Vistas derivadas
// ============================================

export interface Goleadora {
  temporada_id: string
  jugadora_id: string
  nombre: string
  apellido: string
  slug: string
  foto_url: string | null
  goles: number
  de_penal: number
}

export interface EstadisticasJugadora {
  jugadora_id: string
  temporada_id: string
  partidos: number
  titular: number
  goles: number
  amarillas: number
  rojas: number
}

// ============================================
// Distribución
// ============================================

export interface SocialPost {
  id: string
  nota_id: string
  nota_slug: string
  platform: Red
  status: EstadoPosteo
  external_post_id: string | null
  external_url: string | null
  error_message: string | null
  attempts: number
  created_at: string
  updated_at: string
}
