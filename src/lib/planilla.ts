/**
 * La lógica de la planilla de carga, sin React y sin Supabase.
 *
 * `PlanillaPartido` es la planilla de **lectura** y ya existe. Ésta es su
 * reverso: lo que decide qué se puede cargar y qué salió mal. Las dos hablan el
 * mismo idioma de datos —`eventos`, `formaciones`— porque son la misma planilla
 * mirada desde los dos lados.
 *
 * Vive separada del componente por la razón de siempre en este repo: se puede
 * probar con vitest sin montar una pantalla. Y acá importa más que nunca,
 * porque el error caro de esta pantalla —cargar un gol a la jugadora
 * equivocada, o que el marcador no cierre— no se ve mirando.
 */

import type { Evento, FormacionConJugadora, PartidoConEquipos, TipoEvento } from '@/types'

/** Lo mínimo de un evento para las cuentas. Sirve para el recién cargado y el guardado. */
export type EventoParaContar = Pick<
  Evento,
  'tipo' | 'minuto' | 'equipo_id' | 'jugadora_id' | 'jugadora_sale_id'
>

// ============================================
// El marcador
// ============================================

/**
 * Los tipos que suman un gol al marcador.
 *
 * `gol_en_contra` **no está**: suma al otro equipo, y por eso se cuenta aparte
 * en `golesPorEquipo()`. Meterlo acá haría que un gol en contra de Claypole le
 * sume a Claypole, que es el error clásico de las planillas hechas a las
 * apuradas.
 */
const TIPOS_GOL: readonly TipoEvento[] = ['gol', 'gol_penal']

export interface Marcador {
  local: number
  visitante: number
}

/**
 * El marcador que sale de los eventos cargados.
 *
 * Es la cuenta contra la que se compara el resultado que Charlie escribió a
 * mano al crear el partido. Si no coinciden, falta un gol o sobra uno, y la
 * pantalla tiene que decirlo **antes** de dar el partido por finalizado.
 */
export function golesPorEquipo(
  eventos: readonly EventoParaContar[],
  partido: Pick<PartidoConEquipos, 'equipo_local_id' | 'equipo_visitante_id'>,
): Marcador {
  let local = 0
  let visitante = 0

  for (const e of eventos) {
    const esDelLocal = e.equipo_id === partido.equipo_local_id

    if (TIPOS_GOL.includes(e.tipo)) {
      if (esDelLocal) local += 1
      else visitante += 1
    }

    // El gol en contra lo anota el equipo contrario al de quien lo hizo.
    if (e.tipo === 'gol_en_contra') {
      if (esDelLocal) visitante += 1
      else local += 1
    }
  }

  return { local, visitante }
}

export interface ChequeoMarcador {
  coincide: boolean
  cargado: Marcador
  /** El que escribió el autor al crear el partido. `null` si todavía no lo puso. */
  declarado: Marcador | null
}

/**
 * Compara el marcador declarado con el que sale de los goles cargados.
 *
 * Es el "Finalizar partido" del blueprint § 7.6: *"calcula el resultado desde
 * los goles cargados y lo compara con lo ingresado a mano, avisando si no
 * coinciden"*.
 *
 * **Avisa, no corrige.** Cuál de los dos está bien no lo sabe el sistema: puede
 * faltar cargar un gol, o el resultado escrito puede estar mal tipeado. Quien
 * vio el partido decide.
 */
export function chequearMarcador(
  partido: Pick<
    PartidoConEquipos,
    'equipo_local_id' | 'equipo_visitante_id' | 'goles_local' | 'goles_visitante'
  >,
  eventos: readonly EventoParaContar[],
): ChequeoMarcador {
  const cargado = golesPorEquipo(eventos, partido)

  const declarado =
    partido.goles_local !== null && partido.goles_visitante !== null
      ? { local: partido.goles_local, visitante: partido.goles_visitante }
      : null

  return {
    cargado,
    declarado,
    coincide:
      declarado !== null &&
      declarado.local === cargado.local &&
      declarado.visitante === cargado.visitante,
  }
}

// ============================================
// Quiénes están en cancha
// ============================================

/**
 * Las jugadoras de Aldosivi que están en cancha en este momento.
 *
 * Es lo que filtra la grilla al cargar un evento, y es la diferencia entre una
 * planilla usable y una lista de treinta caras: el blueprint pide la grilla
 * *"filtrada por las que están en cancha"*. Sin esto, cargar un gol en la
 * tribuna es buscar entre treinta fotos con el pulgar.
 *
 * Arranca con las titulares y aplica los cambios en orden: la que sale se va,
 * la que entra aparece. Una expulsada también se va —no puede hacer un gol
 * después—, que es una regla que el blueprint no pide y que evita el error de
 * cargarle algo a alguien que ya no está.
 */
export function enCancha(
  formaciones: readonly FormacionConJugadora[],
  eventos: readonly EventoParaContar[],
  equipoId: string,
): FormacionConJugadora[] {
  const propias = formaciones.filter((f) => f.jugadora)
  const dentro = new Set(propias.filter((f) => f.es_titular).map((f) => f.jugadora_id))

  // En orden de minuto: un cambio en el 60 y otro en el 75 no dan lo mismo al
  // revés si la que entró primero salió después.
  const enOrden = [...eventos]
    .filter((e) => e.equipo_id === equipoId)
    .sort((a, b) => a.minuto - b.minuto)

  for (const e of enOrden) {
    if (e.tipo === 'cambio') {
      if (e.jugadora_sale_id) dentro.delete(e.jugadora_sale_id)
      if (e.jugadora_id) dentro.add(e.jugadora_id)
    }

    if ((e.tipo === 'roja' || e.tipo === 'doble_amarilla') && e.jugadora_id) {
      dentro.delete(e.jugadora_id)
    }
  }

  return propias.filter((f) => dentro.has(f.jugadora_id))
}

/** Las que están en el banco: del plantel del partido, las que no están en cancha. */
export function enElBanco(
  formaciones: readonly FormacionConJugadora[],
  eventos: readonly EventoParaContar[],
  equipoId: string,
): FormacionConJugadora[] {
  const dentro = new Set(enCancha(formaciones, eventos, equipoId).map((f) => f.jugadora_id))
  return formaciones.filter((f) => !dentro.has(f.jugadora_id))
}

// ============================================
// El minuto
// ============================================

/**
 * El minuto con el que abre el selector.
 *
 * El último cargado, no cero: los eventos se cargan en orden y el siguiente
 * casi siempre está cerca del anterior. Arrancar siempre en cero obliga a
 * girar la rueda entera cada vez, que con el partido en juego es exactamente lo
 * que hace que Charlie deje de cargar y vuelva a escribirlos a mano después.
 */
export function minutoSugerido(eventos: readonly EventoParaContar[]): number {
  if (eventos.length === 0) return 0
  return Math.max(...eventos.map((e) => e.minuto))
}

/** Un minuto válido para la base: el CHECK de `eventos` pide entre 0 y 120. */
export function minutoValido(minuto: number): boolean {
  return Number.isInteger(minuto) && minuto >= 0 && minuto <= 120
}
