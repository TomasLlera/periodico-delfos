import { describe, expect, it } from 'vitest'
import { cintaTemporada, ordinalPosicion, textoPosicion } from '@/lib/portada'
import type { Equipo, EstadoPartido, PartidoConEquipos, Temporada } from '@/types'

const TEMPORADA: Temporada = {
  id: 't1',
  nombre: 'Primera B 2026',
  slug: 'primera-b-2026',
  division: 'Primera B',
  anio: 2026,
  zona: null,
  activa: true,
  created_at: '2026-01-01T00:00:00.000Z',
}

function equipo(id: string, nombre: string, esAldosivi = false): Equipo {
  return {
    id,
    nombre,
    nombre_corto: nombre,
    apodo: null,
    slug: id,
    escudo_url: null,
    ciudad: null,
    es_aldosivi: esAldosivi,
  }
}

const ALDOSIVI = equipo('ald', 'Aldosivi', true)
const RIVAL = equipo('abo', 'All Boys')

interface PartidoParcial {
  fecha: string
  numero?: number
  deLocal?: boolean
  golesAldosivi?: number
  golesRival?: number
  estado?: EstadoPartido
}

function partido({
  fecha,
  numero,
  deLocal = true,
  golesAldosivi,
  golesRival,
  estado,
}: PartidoParcial): PartidoConEquipos {
  const jugado = golesAldosivi !== undefined && golesRival !== undefined
  const local = deLocal ? ALDOSIVI : RIVAL
  const visitante = deLocal ? RIVAL : ALDOSIVI

  return {
    id: `p-${fecha}`,
    temporada_id: TEMPORADA.id,
    fecha_numero: numero ?? null,
    fecha_hora: fecha,
    equipo_local_id: local.id,
    equipo_visitante_id: visitante.id,
    goles_local: jugado ? (deLocal ? golesAldosivi! : golesRival!) : null,
    goles_visitante: jugado ? (deLocal ? golesRival! : golesAldosivi!) : null,
    estado: estado ?? (jugado ? 'finalizado' : 'programado'),
    cancha: null,
    arbitra: null,
    slug: `p-${fecha}`,
    observaciones: null,
    created_at: fecha,
    equipo_local: local,
    equipo_visitante: visitante,
    temporada: TEMPORADA,
  }
}

/** Una temporada de `fechas` partidos, con los primeros `jugados` cerrados. */
function temporadaDe(fechas: number, jugados: number): PartidoConEquipos[] {
  return Array.from({ length: fechas }, (_, indice) => {
    const numero = indice + 1
    const mes = String(numero).padStart(2, '0')
    return partido({
      fecha: `2026-${mes}-10T15:00:00.000Z`,
      numero,
      ...(numero <= jugados ? { golesAldosivi: 2, golesRival: 0 } : {}),
    })
  })
}

describe('ordinalPosicion', () => {
  it('escribe el puesto con el signo de grado', () => {
    expect(ordinalPosicion(1)).toBe('1°')
    expect(ordinalPosicion(12)).toBe('12°')
  })
})

describe('textoPosicion', () => {
  it('junta puesto y puntos', () => {
    expect(textoPosicion({ posicion: 3, puntos: 24 })).toBe('3° · 24 puntos')
  })

  it('con un solo punto no dice "1 puntos"', () => {
    expect(textoPosicion({ posicion: 12, puntos: 1 })).toBe('12° · 1 punto')
  })

  it('cero puntos va en plural, como en la tabla impresa', () => {
    expect(textoPosicion({ posicion: 14, puntos: 0 })).toBe('14° · 0 puntos')
  })
})

describe('cintaTemporada', () => {
  it('sin partidos no hay cinta', () => {
    expect(cintaTemporada([])).toEqual([])
  })

  it('toma los últimos jugados y los que vienen, en orden cronológico', () => {
    const cinta = cintaTemporada(temporadaDe(12, 6))

    expect(cinta).toHaveLength(8)
    expect(cinta.map((chip) => chip.partido.fecha_numero)).toEqual([
      3, 4, 5, 6, 7, 8, 9, 10,
    ])
  })

  it('marca como próximo al primero que falta jugar, y a uno solo', () => {
    const cinta = cintaTemporada(temporadaDe(12, 6))

    expect(cinta.filter((chip) => chip.esProximo)).toHaveLength(1)
    const proximo = cinta.find((chip) => chip.esProximo)
    expect(proximo?.partido.fecha_numero).toBe(7)
    expect(proximo?.jugado).toBe(false)
  })

  it('el resultado de los jugados sale desde el lado de Aldosivi', () => {
    const cinta = cintaTemporada([
      partido({ fecha: '2026-03-01T15:00:00.000Z', golesAldosivi: 2, golesRival: 1 }),
      partido({ fecha: '2026-03-08T15:00:00.000Z', golesAldosivi: 1, golesRival: 1 }),
      // De visitante: el 0-3 del marcador es una goleada a favor.
      partido({
        fecha: '2026-03-15T15:00:00.000Z',
        deLocal: false,
        golesAldosivi: 3,
        golesRival: 0,
      }),
      partido({ fecha: '2026-03-22T15:00:00.000Z', golesAldosivi: 0, golesRival: 2 }),
    ])

    expect(cinta.map((chip) => chip.resultado)).toEqual([
      'ganado',
      'empatado',
      'ganado',
      'perdido',
    ])
    expect(cinta.every((chip) => chip.jugado)).toBe(true)
  })

  it('los que vienen no traen resultado aunque el partido esté cargado', () => {
    const cinta = cintaTemporada(temporadaDe(4, 0))

    expect(cinta.map((chip) => chip.resultado)).toEqual([null, null, null, null])
    expect(cinta.some((chip) => chip.jugado)).toBe(false)
  })

  it('con la temporada terminada rellena la ventana con más jugados', () => {
    const cinta = cintaTemporada(temporadaDe(12, 12))

    expect(cinta).toHaveLength(8)
    expect(cinta.map((chip) => chip.partido.fecha_numero)).toEqual([
      5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(cinta.some((chip) => chip.esProximo)).toBe(false)
  })

  it('con la temporada sin empezar la ventana se llena con los que vienen', () => {
    const cinta = cintaTemporada(temporadaDe(12, 0))

    expect(cinta).toHaveLength(8)
    expect(cinta[0].partido.fecha_numero).toBe(1)
    expect(cinta[0].esProximo).toBe(true)
  })

  it('una temporada más corta que la ventana entra entera', () => {
    const cinta = cintaTemporada(temporadaDe(3, 1))
    expect(cinta.map((chip) => chip.partido.fecha_numero)).toEqual([1, 2, 3])
  })

  it('acepta otra ventana, y sin lugar para jugados no dibuja ninguno', () => {
    const cinta = cintaTemporada(temporadaDe(12, 6), { jugados: 0, porJugar: 2 })

    expect(cinta.map((chip) => chip.partido.fecha_numero)).toEqual([7, 8])
    expect(cinta.every((chip) => !chip.jugado)).toBe(true)
  })

  it('un suspendido con marcador cuenta como jugado y no como próximo', () => {
    const cinta = cintaTemporada([
      partido({
        fecha: '2026-03-01T15:00:00.000Z',
        numero: 1,
        estado: 'suspendido',
        golesAldosivi: 1,
        golesRival: 1,
      }),
      partido({ fecha: '2026-03-08T15:00:00.000Z', numero: 2 }),
    ])

    expect(cinta[0].jugado).toBe(true)
    expect(cinta[0].resultado).toBe('empatado')
    expect(cinta[1].esProximo).toBe(true)
  })

  it('ordena por fecha aunque lleguen desordenados', () => {
    const cinta = cintaTemporada([
      partido({ fecha: '2026-05-01T15:00:00.000Z', numero: 3, golesAldosivi: 1, golesRival: 0 }),
      partido({ fecha: '2026-03-01T15:00:00.000Z', numero: 1, golesAldosivi: 1, golesRival: 0 }),
      partido({ fecha: '2026-04-01T15:00:00.000Z', numero: 2, golesAldosivi: 1, golesRival: 0 }),
    ])

    expect(cinta.map((chip) => chip.partido.fecha_numero)).toEqual([1, 2, 3])
  })
})
