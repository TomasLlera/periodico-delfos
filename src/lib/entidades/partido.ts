/**
 * El alta y la edición de un partido: la ficha, no la planilla.
 *
 * Acá se carga lo que se sabe **antes** de que el partido se juegue —cuándo,
 * contra quién, en qué cancha, quién arbitra— y el resultado si ya terminó. Los
 * goles uno por uno, las tarjetas y los cambios son la planilla
 * (`/admin/partidos/[id]/planilla`), que es otra pantalla y otro momento.
 *
 * Esta separación es la regla no negociable 2 llevada al panel: el marcador que
 * se escribe acá es una declaración, y la planilla lo verifica contra los goles
 * cargados con `chequearMarcador()`. Cuando no coinciden, el sistema avisa y no
 * corrige: cuál de los dos está bien lo sabe quien vio el partido.
 *
 * La lógica de **lectura** del partido —lados, minutos, agrupación de eventos—
 * vive en `src/lib/partido.ts`.
 */

import { z } from 'zod'
import {
  enteroOpcional,
  localAIso,
  slugificar,
  textoOpcional,
  textoRequerido,
} from '@/lib/entidades/campos'
import type { EstadoPartido, PartidoConEquipos } from '@/types'

const ESTADOS = [
  'programado',
  'en_curso',
  'finalizado',
  'suspendido',
  'postergado',
] as const satisfies readonly EstadoPartido[]

/**
 * El tope de fechas de un campeonato.
 *
 * Cuarenta es holgado para cualquier formato de ascenso —la Primera B jugó
 * veintipico— y sigue siendo lo bastante chico como para que un 44 tipeado en
 * lugar de un 4 no entre.
 */
export const FECHA_MAXIMA = 40

/** Nadie mete treinta goles. Un número así es el dedo apoyado en el teclado. */
export const GOLES_MAXIMOS = 30

export const esquemaPartido = z
  .object({
    temporada_id: z.uuid('Elegí la temporada'),
    fecha_numero: enteroOpcional('La fecha', 1, FECHA_MAXIMA),
    /** Tal como sale de un `datetime-local`. El action lo pasa a ISO. */
    fecha_hora_local: textoRequerido('La fecha y la hora'),
    equipo_local_id: z.uuid('Elegí el equipo local'),
    equipo_visitante_id: z.uuid('Elegí el equipo visitante'),
    goles_local: enteroOpcional('Los goles del local', 0, GOLES_MAXIMOS),
    goles_visitante: enteroOpcional('Los goles del visitante', 0, GOLES_MAXIMOS),
    estado: z.enum(ESTADOS),
    cancha: textoOpcional,
    arbitra: textoOpcional,
    slug: textoRequerido('El slug'),
    observaciones: textoOpcional,
  })
  .refine((p) => p.equipo_local_id !== p.equipo_visitante_id, {
    path: ['equipo_visitante_id'],
    message: 'Un equipo no puede jugar contra sí mismo',
  })
  .refine((p) => localAIso(p.fecha_hora_local) !== null, {
    path: ['fecha_hora_local'],
    message: 'La fecha y la hora no son válidas',
  })
  // El mismo CHECK que `finalizado_tiene_resultado` en `0003`, dicho en
  // castellano y al lado del campo en vez de como un 400 de Postgres.
  .refine((p) => p.estado !== 'finalizado' || p.goles_local !== null, {
    path: ['goles_local'],
    message: 'Un partido finalizado necesita el resultado',
  })
  .refine((p) => p.estado !== 'finalizado' || p.goles_visitante !== null, {
    path: ['goles_visitante'],
    message: 'Un partido finalizado necesita el resultado',
  })

export type EntradaPartido = z.infer<typeof esquemaPartido>

/**
 * `fecha-11-aldosivi-all-boys-2026`, el ejemplo del blueprint § 4.3.
 *
 * Lleva el año porque el mismo cruce en la misma fecha se repite todas las
 * temporadas, y el slug es único en toda la tabla: sin el año, la fecha 11 de
 * 2027 contra All Boys no se podría guardar.
 *
 * Un amistoso o un partido sin número de fecha cae en la fecha del calendario,
 * que es lo único que lo distingue de otro contra el mismo rival.
 */
export function slugDePartido(datos: {
  fechaNumero: number | null
  localCorto: string
  visitanteCorto: string
  anio: number
  fechaHoraLocal?: string
}): string {
  const cabeza =
    datos.fechaNumero !== null
      ? `fecha-${datos.fechaNumero}`
      : (datos.fechaHoraLocal ?? '').slice(0, 10)

  return [cabeza, slugificar(datos.localCorto), slugificar(datos.visitanteCorto), datos.anio]
    .filter((parte) => parte !== '' && parte !== null)
    .join('-')
}

/** Lo que muestra el formulario al abrirse. */
export function entradaDesdePartido(
  partido: PartidoConEquipos | null,
  porOmision: { temporadaId: string | null; fechaHoraLocal: string },
): EntradaPartido {
  if (!partido) {
    return {
      // La activa: es la temporada en la que se están cargando partidos hoy.
      temporada_id: porOmision.temporadaId ?? '',
      fecha_numero: null,
      fecha_hora_local: porOmision.fechaHoraLocal,
      equipo_local_id: '',
      equipo_visitante_id: '',
      goles_local: null,
      goles_visitante: null,
      // Un partido se carga antes de jugarse: ése es el punto de tener fixture.
      estado: 'programado',
      cancha: null,
      arbitra: null,
      slug: '',
      observaciones: null,
    }
  }

  return {
    temporada_id: partido.temporada_id,
    fecha_numero: partido.fecha_numero,
    fecha_hora_local: porOmision.fechaHoraLocal,
    equipo_local_id: partido.equipo_local_id,
    equipo_visitante_id: partido.equipo_visitante_id,
    goles_local: partido.goles_local,
    goles_visitante: partido.goles_visitante,
    estado: partido.estado,
    cancha: partido.cancha,
    arbitra: partido.arbitra,
    slug: partido.slug,
    observaciones: partido.observaciones,
  }
}

/**
 * Lo que está raro pero no está mal.
 *
 * Son avisos y no errores a propósito: ninguno de los dos casos es imposible
 * —el medio podría cubrir alguna vez un partido ajeno, y un partido suspendido
 * a los 70 minutos tiene goles cargados y no está finalizado—, así que
 * bloquearlos sería inventar una regla que la base no tiene. Pero los dos son,
 * casi siempre, un equipo elegido mal en el `<select>` o un estado que quedó
 * sin cambiar.
 */
export function avisosDePartido(
  entrada: Pick<EntradaPartido, 'equipo_local_id' | 'equipo_visitante_id' | 'estado' | 'goles_local' | 'goles_visitante'>,
  equipos: readonly { id: string; es_aldosivi: boolean }[],
): string[] {
  const avisos: string[] = []

  const hayAldosivi = equipos.some(
    (e) =>
      e.es_aldosivi &&
      (e.id === entrada.equipo_local_id || e.id === entrada.equipo_visitante_id),
  )
  if (entrada.equipo_local_id && entrada.equipo_visitante_id && !hayAldosivi) {
    avisos.push(
      'Ninguno de los dos equipos es Aldosivi: el partido no va a aparecer en la portada ni en las estadísticas.',
    )
  }

  const hayGoles = entrada.goles_local !== null || entrada.goles_visitante !== null
  if (entrada.estado === 'programado' && hayGoles) {
    avisos.push('El partido está como programado y ya tiene goles cargados.')
  }

  return avisos
}

/** Lo que va a la base, con la fecha ya en ISO. `null` si la fecha no sirve. */
export function filaDePartido(entrada: EntradaPartido) {
  const fechaHora = localAIso(entrada.fecha_hora_local)
  if (!fechaHora) return null

  return {
    temporada_id: entrada.temporada_id,
    fecha_numero: entrada.fecha_numero,
    fecha_hora: fechaHora,
    equipo_local_id: entrada.equipo_local_id,
    equipo_visitante_id: entrada.equipo_visitante_id,
    goles_local: entrada.goles_local,
    goles_visitante: entrada.goles_visitante,
    estado: entrada.estado,
    cancha: entrada.cancha,
    arbitra: entrada.arbitra,
    slug: entrada.slug,
    observaciones: entrada.observaciones,
  }
}
