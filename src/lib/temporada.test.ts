import { describe, expect, it } from 'vitest'
import {
  balanceAldosivi,
  diferenciaGol,
  dividirFixture,
  etiquetaDiferencia,
  pestanaPedida,
  yaSeJugo,
} from '@/lib/temporada'
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
const ALL_BOYS = equipo('abo', 'All Boys')
const MORON = equipo('mor', 'Moron')

interface PartidoParcial {
  fecha: string
  local?: Equipo
  visitante?: Equipo
  golesLocal?: number | null
  golesVisitante?: number | null
  estado?: EstadoPartido
}

function partido({
  fecha,
  local = ALDOSIVI,
  visitante = ALL_BOYS,
  golesLocal = null,
  golesVisitante = null,
  estado = 'programado',
}: PartidoParcial): PartidoConEquipos {
  return {
    id: `p-${fecha}`,
    temporada_id: TEMPORADA.id,
    fecha_numero: null,
    fecha_hora: fecha,
    equipo_local_id: local.id,
    equipo_visitante_id: visitante.id,
    goles_local: golesLocal,
    goles_visitante: golesVisitante,
    estado,
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

describe('pestanaPedida', () => {
  it('sin parámetro abre el fixture', () => {
    expect(pestanaPedida(undefined)).toBe('fixture')
    expect(pestanaPedida('')).toBe('fixture')
  })

  it('lee las tres pestañas', () => {
    expect(pestanaPedida('fixture')).toBe('fixture')
    expect(pestanaPedida('tabla')).toBe('tabla')
    expect(pestanaPedida('goleadoras')).toBe('goleadoras')
  })

  it('cualquier otra cosa cae en el fixture en lugar de romper', () => {
    expect(pestanaPedida('TABLA')).toBe('fixture')
    expect(pestanaPedida('constructor')).toBe('fixture')
  })

  it('con el parámetro repetido vale el primero', () => {
    expect(pestanaPedida(['tabla', 'goleadoras'])).toBe('tabla')
    expect(pestanaPedida([])).toBe('fixture')
  })
})

describe('yaSeJugo', () => {
  it('un partido finalizado ya se jugó', () => {
    const jugado = partido({
      fecha: '2026-03-01T15:00:00.000Z',
      estado: 'finalizado',
      golesLocal: 1,
      golesVisitante: 0,
    })
    expect(yaSeJugo(jugado)).toBe(true)
  })

  it('uno en curso también: se está jugando, no está por jugarse', () => {
    const enCurso = partido({ fecha: '2026-03-01T15:00:00.000Z', estado: 'en_curso' })
    expect(yaSeJugo(enCurso)).toBe(true)
  })

  it('uno programado, no', () => {
    expect(yaSeJugo(partido({ fecha: '2026-09-01T15:00:00.000Z' }))).toBe(false)
  })

  it('un postergado sin marcador tampoco', () => {
    const postergado = partido({ fecha: '2026-04-01T15:00:00.000Z', estado: 'postergado' })
    expect(yaSeJugo(postergado)).toBe(false)
  })

  it('un suspendido CON marcador cargado sí: se jugó, aunque no entero', () => {
    const suspendido = partido({
      fecha: '2026-04-01T15:00:00.000Z',
      estado: 'suspendido',
      golesLocal: 1,
      golesVisitante: 1,
    })
    expect(yaSeJugo(suspendido)).toBe(true)
  })
})

describe('dividirFixture', () => {
  it('parte en jugados y por jugar, los dos en orden cronológico', () => {
    const { jugados, porJugar } = dividirFixture([
      partido({ fecha: '2026-05-01T15:00:00.000Z' }),
      partido({
        fecha: '2026-03-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 2,
        golesVisitante: 1,
      }),
      partido({ fecha: '2026-04-01T15:00:00.000Z' }),
      partido({
        fecha: '2026-02-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 0,
        golesVisitante: 0,
      }),
    ])

    expect(jugados.map((p) => p.fecha_hora)).toEqual([
      '2026-02-01T15:00:00.000Z',
      '2026-03-01T15:00:00.000Z',
    ])
    expect(porJugar.map((p) => p.fecha_hora)).toEqual([
      '2026-04-01T15:00:00.000Z',
      '2026-05-01T15:00:00.000Z',
    ])
  })

  it('un fixture vacío devuelve las dos listas vacías', () => {
    expect(dividirFixture([])).toEqual({ jugados: [], porJugar: [] })
  })

  it('no toca el arreglo que recibe', () => {
    const original = [
      partido({ fecha: '2026-05-01T15:00:00.000Z' }),
      partido({ fecha: '2026-03-01T15:00:00.000Z' }),
    ]
    dividirFixture(original)
    expect(original[0].fecha_hora).toBe('2026-05-01T15:00:00.000Z')
  })
})

describe('balanceAldosivi', () => {
  it('cuenta igual de local que de visitante', () => {
    const balance = balanceAldosivi([
      partido({
        fecha: '2026-02-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 2,
        golesVisitante: 1,
      }),
      // De visitante: los goles a favor son los del visitante, no los del local.
      partido({
        fecha: '2026-03-01T15:00:00.000Z',
        local: ALL_BOYS,
        visitante: ALDOSIVI,
        estado: 'finalizado',
        golesLocal: 0,
        golesVisitante: 3,
      }),
    ])

    expect(balance).toEqual({
      jugados: 2,
      ganados: 2,
      empatados: 0,
      perdidos: 0,
      golesFavor: 5,
      golesContra: 1,
    })
  })

  it('separa ganados, empatados y perdidos', () => {
    const balance = balanceAldosivi([
      partido({
        fecha: '2026-02-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 1,
        golesVisitante: 0,
      }),
      partido({
        fecha: '2026-03-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 1,
        golesVisitante: 1,
      }),
      partido({
        fecha: '2026-04-01T15:00:00.000Z',
        estado: 'finalizado',
        golesLocal: 0,
        golesVisitante: 2,
      }),
    ])

    expect(balance.jugados).toBe(3)
    expect(balance.ganados).toBe(1)
    expect(balance.empatados).toBe(1)
    expect(balance.perdidos).toBe(1)
  })

  it('los partidos sin resultado no suman', () => {
    const balance = balanceAldosivi([partido({ fecha: '2026-09-01T15:00:00.000Z' })])
    expect(balance.jugados).toBe(0)
    expect(balance.golesFavor).toBe(0)
  })

  it('un partido en el que Aldosivi no juega no suma', () => {
    const ajeno = partido({
      fecha: '2026-03-01T15:00:00.000Z',
      local: ALL_BOYS,
      visitante: MORON,
      estado: 'finalizado',
      golesLocal: 4,
      golesVisitante: 0,
    })
    expect(balanceAldosivi([ajeno]).jugados).toBe(0)
  })
})

describe('diferenciaGol y etiquetaDiferencia', () => {
  it('resta los goles en contra a los de favor', () => {
    expect(diferenciaGol({ goles_favor: 19, goles_contra: 12 })).toBe(7)
    expect(diferenciaGol({ goles_favor: 3, goles_contra: 8 })).toBe(-5)
  })

  it('el positivo lleva signo y el negativo el menos tipográfico', () => {
    expect(etiquetaDiferencia(7)).toBe('+7')
    expect(etiquetaDiferencia(0)).toBe('0')
    // U+2212, no un guion: alinea con los dígitos de ancho fijo.
    expect(etiquetaDiferencia(-5)).toBe('\u22125')
  })
})
