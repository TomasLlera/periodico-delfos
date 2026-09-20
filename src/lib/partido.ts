/**
 * Lógica pura de la planilla del partido.
 *
 * Sin JSX y sin acceso a la base: se puede testear sola, y la comparten
 * `<PlanillaPartido />`, el resumen de la portada y el copy de redes.
 */

import { fechaLarga } from '@/lib/formato'
import type {
  Equipo,
  EstadoPartido,
  EventoConJugadora,
  FormacionConJugadora,
  PartidoCompleto,
  PartidoConEquipos,
  TipoEvento,
} from '@/types'

/** Columna de la planilla en la que cae un evento. */
export type Lado = 'aldosivi' | 'rival'

const TIPOS_GOL: readonly TipoEvento[] = ['gol', 'gol_penal', 'gol_en_contra']

export function esGol(tipo: TipoEvento): boolean {
  return TIPOS_GOL.includes(tipo)
}

export const ETIQUETA_EVENTO: Record<TipoEvento, string> = {
  gol: 'Gol',
  gol_penal: 'Gol de penal',
  gol_en_contra: 'Gol en contra',
  penal_errado: 'Penal errado',
  amarilla: 'Amarilla',
  roja: 'Roja',
  doble_amarilla: 'Doble amarilla',
  cambio: 'Cambio',
  lesion: 'Lesión',
}

/** Sufijo pegado al apellido, como en una planilla impresa: "Cortadi (p)". */
export const SUFIJO_EVENTO: Partial<Record<TipoEvento, string>> = {
  gol_penal: '(p)',
  gol_en_contra: '(e/c)',
  penal_errado: '(errado)',
  doble_amarilla: '(2ª)',
}

export const ETIQUETA_ESTADO: Record<EstadoPartido, string> = {
  programado: 'Programado',
  en_curso: 'En juego',
  finalizado: 'Final',
  suspendido: 'Suspendido',
  postergado: 'Postergado',
}

// ============================================
// Equipos y lados
// ============================================

/**
 * El equipo de Aldosivi en un partido. Devuelve null si ninguno de los dos lo
 * es: no debería pasar nunca, pero el tipo lo permite y la planilla no puede
 * romperse por un dato mal cargado.
 */
export function equipoDeAldosivi(partido: PartidoConEquipos): Equipo | null {
  if (partido.equipo_local.es_aldosivi) return partido.equipo_local
  if (partido.equipo_visitante.es_aldosivi) return partido.equipo_visitante
  return null
}

export interface LadosPartido {
  izquierda: Equipo
  derecha: Equipo
  golesIzquierda: number | null
  golesDerecha: number | null
  /** null si el partido no es de Aldosivi, cosa que no debería pasar. */
  aldosiviEsLocal: boolean | null
}

/**
 * Quién va de cada lado de la planilla.
 *
 * **Aldosivi siempre a la izquierda**, juegue de local o de visitante. Es un
 * medio de un solo club: que la columna propia cambie de lado según el partido
 * obliga a releer el marcador cada vez. La condición de local o visitante no se
 * pierde, se muestra abajo del nombre.
 */
export function ladosDelPartido(partido: PartidoConEquipos): LadosPartido {
  const { equipo_local: local, equipo_visitante: visitante } = partido

  if (visitante.es_aldosivi && !local.es_aldosivi) {
    return {
      izquierda: visitante,
      derecha: local,
      golesIzquierda: partido.goles_visitante,
      golesDerecha: partido.goles_local,
      aldosiviEsLocal: false,
    }
  }

  return {
    izquierda: local,
    derecha: visitante,
    golesIzquierda: partido.goles_local,
    golesDerecha: partido.goles_visitante,
    aldosiviEsLocal: local.es_aldosivi ? true : null,
  }
}

/** El equipo al que pertenece la jugadora del evento. */
export function equipoDelEvento(
  evento: Pick<EventoConJugadora, 'equipo_id'>,
  partido: PartidoConEquipos,
): Equipo {
  return evento.equipo_id === partido.equipo_local.id
    ? partido.equipo_local
    : partido.equipo_visitante
}

/**
 * De qué lado de la planilla cae el evento.
 *
 * Los eventos siguen a la jugadora, con una excepción: el gol en contra se
 * anota del lado del equipo que **suma**, con el "(e/c)" al lado del apellido
 * de quien lo hizo. Así la columna izquierda de goles coincide siempre con el
 * marcador de Aldosivi, que es lo que la planilla tiene que dejar leer de un
 * vistazo.
 */
export function ladoDelEvento(
  evento: Pick<EventoConJugadora, 'equipo_id' | 'tipo'>,
  partido: PartidoConEquipos,
): Lado {
  // Sin Aldosivi en el partido, la izquierda es el local.
  const idIzquierda = equipoDeAldosivi(partido)?.id ?? partido.equipo_local.id
  const esIzquierda = evento.equipo_id === idIzquierda
  const invierte = evento.tipo === 'gol_en_contra'
  return esIzquierda !== invierte ? 'aldosivi' : 'rival'
}

// ============================================
// Nombres
// ============================================

interface RefJugadora {
  nombre: string
  apellido: string
}

/**
 * Las jugadoras de Aldosivi vienen por FK; las rivales, como texto libre en
 * `jugadora_nombre`. Hay que resolver los dos casos en todos lados.
 */
function nombreDe(
  jugadora: RefJugadora | null,
  libre: string | null,
  completo: boolean,
): string {
  if (jugadora) {
    return completo ? `${jugadora.nombre} ${jugadora.apellido}` : jugadora.apellido
  }
  const texto = libre?.trim()
  return texto ? texto : 'Sin identificar'
}

/** Apellido solo, para la planilla. */
export function apellidoDeEvento(evento: EventoConJugadora): string {
  return nombreDe(evento.jugadora, evento.jugadora_nombre, false)
}

/** Nombre y apellido, para el texto que lee el lector de pantalla. */
export function nombreDeEvento(evento: EventoConJugadora): string {
  return nombreDe(evento.jugadora, evento.jugadora_nombre, true)
}

/** Apellido de quien sale en un cambio. */
export function apellidoQueSale(evento: EventoConJugadora): string {
  return nombreDe(evento.jugadora_sale, evento.jugadora_sale_nombre, false)
}

export function nombreQueSale(evento: EventoConJugadora): string {
  return nombreDe(evento.jugadora_sale, evento.jugadora_sale_nombre, true)
}

// ============================================
// Minutos y descripciones accesibles
// ============================================

/** "45+2" — clave estable de agrupación. */
function claveMinuto(evento: Pick<EventoConJugadora, 'minuto' | 'adicionado'>): string {
  return evento.adicionado > 0 ? `${evento.minuto}+${evento.adicionado}` : `${evento.minuto}`
}

/** "Minuto 45 más 2" — el apóstrofo no se lee bien en voz alta. */
export function minutoAccesible(
  evento: Pick<EventoConJugadora, 'minuto' | 'adicionado'>,
): string {
  return evento.adicionado > 0
    ? `Minuto ${evento.minuto} más ${evento.adicionado}`
    : `Minuto ${evento.minuto}`
}

/**
 * Frase que describe un evento. Es el texto que escucha quien usa lector de
 * pantalla, así que se lee entero y no depende de la posición en la grilla.
 */
export function describirEvento(
  evento: EventoConJugadora,
  partido: PartidoConEquipos,
): string {
  const equipo = equipoDelEvento(evento, partido).nombre_corto
  const quien = nombreDeEvento(evento)
  const detalle = evento.detalle?.trim() ? ` ${evento.detalle.trim()}.` : ''

  let frase: string
  switch (evento.tipo) {
    case 'cambio':
      frase = `Cambio en ${equipo}: entra ${quien}, sale ${nombreQueSale(evento)}.`
      break
    case 'gol':
    case 'gol_penal':
      frase = `${ETIQUETA_EVENTO[evento.tipo]} de ${equipo}: ${quien}.`
      break
    case 'gol_en_contra':
      frase = `Gol en contra de ${quien}, de ${equipo}.`
      break
    case 'penal_errado':
      frase = `Penal errado por ${quien}, de ${equipo}.`
      break
    case 'lesion':
      frase = `Lesión de ${quien}, de ${equipo}.`
      break
    default:
      frase = `${ETIQUETA_EVENTO[evento.tipo]} para ${equipo}: ${quien}.`
  }
  return frase + detalle
}

// ============================================
// Agrupación por minuto
// ============================================

export interface GrupoMinuto {
  clave: string
  /** "45+2'" — lo que se ve en la columna del medio. */
  etiqueta: string
  /** Frase completa del minuto, para lectores de pantalla. */
  descripcion: string
  aldosivi: EventoConJugadora[]
  rival: EventoConJugadora[]
}

/**
 * Los eventos del mismo minuto comparten fila: la planilla tiene una casilla
 * por minuto, no una por evento.
 */
export function agruparPorMinuto(partido: PartidoCompleto): GrupoMinuto[] {
  const ordenados = [...partido.eventos].sort(
    (a, b) => a.minuto - b.minuto || a.adicionado - b.adicionado,
  )

  const grupos = new Map<string, { etiqueta: string; accesible: string; eventos: EventoConJugadora[] }>()

  for (const evento of ordenados) {
    const clave = claveMinuto(evento)
    const grupo = grupos.get(clave)
    if (grupo) {
      grupo.eventos.push(evento)
    } else {
      grupos.set(clave, {
        etiqueta: `${clave}'`,
        accesible: minutoAccesible(evento),
        eventos: [evento],
      })
    }
  }

  return [...grupos.entries()].map(([clave, grupo]) => ({
    clave,
    etiqueta: grupo.etiqueta,
    descripcion: [
      `${grupo.accesible}.`,
      ...grupo.eventos.map((evento) => describirEvento(evento, partido)),
    ].join(' '),
    aldosivi: grupo.eventos.filter((e) => ladoDelEvento(e, partido) === 'aldosivi'),
    rival: grupo.eventos.filter((e) => ladoDelEvento(e, partido) === 'rival'),
  }))
}

// ============================================
// Resúmenes
// ============================================

export interface ResumenGoles {
  aldosivi: string[]
  rival: string[]
}

/**
 * Un partido del que se pueden resumir los goles.
 *
 * Los eventos son **opcionales** a propósito: el fixture de la temporada sale
 * de `getPartidosTemporada()`, que devuelve `PartidoConEquipos` —sin eventos,
 * porque traer la planilla entera de cada fecha para dibujar una grilla de
 * tarjetas es pedir la base completa. La tarjeta compacta es la misma en los
 * dos casos; cuando no hay eventos, no dibuja la línea de goleadoras.
 */
export type PartidoResumible = PartidoConEquipos & {
  eventos?: readonly EventoConJugadora[]
}

/** "Cortadi 23'", "Garro 61' (p)" — para la variante compacta. */
export function resumenGoles(partido: PartidoResumible): ResumenGoles {
  const resumen: ResumenGoles = { aldosivi: [], rival: [] }

  for (const evento of [...(partido.eventos ?? [])].sort(
    (a, b) => a.minuto - b.minuto || a.adicionado - b.adicionado,
  )) {
    if (!esGol(evento.tipo)) continue
    const sufijo = SUFIJO_EVENTO[evento.tipo]
    const texto = `${apellidoDeEvento(evento)} ${claveMinuto(evento)}'${sufijo ? ` ${sufijo}` : ''}`
    resumen[ladoDelEvento(evento, partido)].push(texto)
  }

  return resumen
}

/**
 * Título del bloque, para `aria-labelledby`. Sin "·" ni guiones largos: los
 * lectores de pantalla los leen mal o los saltean.
 */
export function tituloAccesible(partido: PartidoConEquipos): string {
  const lados = ladosDelPartido(partido)
  const { izquierda, derecha, golesIzquierda, golesDerecha } = lados

  const marcador =
    golesIzquierda === null || golesDerecha === null
      ? `${izquierda.nombre_corto} contra ${derecha.nombre_corto}`
      : `${izquierda.nombre_corto} ${golesIzquierda}, ${derecha.nombre_corto} ${golesDerecha}`

  const condicion =
    lados.aldosiviEsLocal === null
      ? null
      : `Aldosivi de ${lados.aldosiviEsLocal ? 'local' : 'visitante'}`

  const partes = [
    marcador,
    condicion,
    partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : null,
    partido.temporada.nombre,
    fechaLarga(partido.fecha_hora),
    partido.estado === 'finalizado' ? null : ETIQUETA_ESTADO[partido.estado],
  ].filter((parte): parte is string => Boolean(parte))

  return `${partes.join('. ')}.`
}

// ============================================
// Formaciones
// ============================================

function ordenarFormaciones(filas: FormacionConJugadora[]): FormacionConJugadora[] {
  return [...filas].sort((a, b) => {
    // Las que no tienen dorsal van al final, no adelante como haría un null.
    const da = a.dorsal ?? Number.MAX_SAFE_INTEGER
    const db = b.dorsal ?? Number.MAX_SAFE_INTEGER
    return da - db || a.jugadora.apellido.localeCompare(b.jugadora.apellido, 'es')
  })
}

export function titulares(partido: PartidoCompleto): FormacionConJugadora[] {
  return ordenarFormaciones(partido.formaciones.filter((f) => f.es_titular))
}

export function suplentes(partido: PartidoCompleto): FormacionConJugadora[] {
  return ordenarFormaciones(partido.formaciones.filter((f) => !f.es_titular))
}

/**
 * Cómo se nombra un partido en una lista: "Fecha 4 · Aldosivi 6-1 Claypole".
 *
 * Es para el `<select>` del editor de notas, donde Charlie tiene que reconocer
 * el partido de un vistazo entre cincuenta. Por eso lleva el marcador y no sólo
 * los nombres: media docena de partidos contra el mismo rival se distinguen por
 * el resultado antes que por la fecha.
 *
 * Los equipos van con `nombre_corto` cuando lo tienen —"Aldosivi", no "Club
 * Atlético Aldosivi"—: en una lista desplegable el nombre completo empuja el
 * marcador fuera de la vista en un celular.
 *
 * Un partido que todavía no se jugó no tiene marcador, así que va "vs".
 */
export function etiquetaDePartido(partido: PartidoConEquipos): string {
  const local = partido.equipo_local.nombre_corto ?? partido.equipo_local.nombre
  const visitante = partido.equipo_visitante.nombre_corto ?? partido.equipo_visitante.nombre

  const fecha = partido.fecha_numero ? `Fecha ${partido.fecha_numero}` : partido.temporada.nombre

  const hayResultado = partido.goles_local !== null && partido.goles_visitante !== null
  const centro = hayResultado
    ? `${local} ${partido.goles_local}-${partido.goles_visitante} ${visitante}`
    : `${local} vs ${visitante}`

  return `${fecha} · ${centro}`
}
