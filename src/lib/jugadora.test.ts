import { describe, expect, it } from 'vitest'
import { edad, golesOrdenados, rivalDelGol, totalesJugadora } from '@/lib/jugadora'
import type { EstadisticasJugadora, GolDeJugadora } from '@/types'

function gol({
  id,
  fecha,
  minuto,
  adicionado = 0,
  aldosiviDeLocal = true,
  rival = 'All Boys',
}: {
  id: string
  fecha: string
  minuto: number
  adicionado?: number
  aldosiviDeLocal?: boolean
  rival?: string
}): GolDeJugadora {
  const ald = { nombre_corto: 'Aldosivi', es_aldosivi: true }
  const otro = { nombre_corto: rival, es_aldosivi: false }

  return {
    id,
    partido_id: `par-${id}`,
    minuto,
    adicionado,
    tipo: 'gol',
    equipo_id: 'ald',
    jugadora_id: 'j1',
    jugadora_nombre: null,
    jugadora_sale_id: null,
    jugadora_sale_nombre: null,
    detalle: null,
    jugadora: null,
    jugadora_sale: null,
    partido: {
      slug: `par-${id}`,
      fecha_numero: null,
      fecha_hora: fecha,
      temporada_id: 't1',
      equipo_local: aldosiviDeLocal ? ald : otro,
      equipo_visitante: aldosiviDeLocal ? otro : ald,
    },
  }
}

function estadistica(parcial: Partial<EstadisticasJugadora>): EstadisticasJugadora {
  return {
    jugadora_id: 'j1',
    temporada_id: 't1',
    partidos: 0,
    titular: 0,
    goles: 0,
    amarillas: 0,
    rojas: 0,
    ...parcial,
  }
}

describe('edad', () => {
  const HOY = new Date('2026-08-02T12:00:00.000Z')

  it('cuenta años cumplidos', () => {
    expect(edad('2000-01-15', HOY)).toBe(26)
  })

  it('todavía no cumplió este año', () => {
    expect(edad('2000-12-15', HOY)).toBe(25)
  })

  it('el mismo día del cumpleaños ya suma el año', () => {
    expect(edad('2000-08-02', HOY)).toBe(26)
  })

  it('el día anterior al cumpleaños todavía no', () => {
    expect(edad('2000-08-03', HOY)).toBe(25)
  })

  it('sin fecha cargada devuelve null, que es lo normal en este plantel', () => {
    expect(edad(null, HOY)).toBeNull()
  })

  it('una fecha ilegible devuelve null en lugar de NaN', () => {
    expect(edad('no es una fecha', HOY)).toBeNull()
  })

  it('una fecha futura devuelve null en lugar de una edad negativa', () => {
    expect(edad('2030-01-01', HOY)).toBeNull()
  })
})

describe('totalesJugadora', () => {
  it('suma todas las temporadas: la ficha muestra la carrera, no el último año', () => {
    const total = totalesJugadora([
      estadistica({ temporada_id: 't1', partidos: 14, titular: 12, goles: 7, amarillas: 2, rojas: 0 }),
      estadistica({ temporada_id: 't2', partidos: 9, titular: 4, goles: 3, amarillas: 1, rojas: 1 }),
    ])

    expect(total).toEqual({
      partidos: 23,
      titular: 16,
      goles: 10,
      amarillas: 3,
      rojas: 1,
    })
  })

  it('sin filas devuelve ceros, no undefined', () => {
    expect(totalesJugadora([])).toEqual({
      partidos: 0,
      titular: 0,
      goles: 0,
      amarillas: 0,
      rojas: 0,
    })
  })
})

describe('rivalDelGol', () => {
  it('de local, el rival es el visitante', () => {
    const resultado = rivalDelGol(
      gol({ id: 'g1', fecha: '2026-03-01T15:00:00.000Z', minuto: 23 }),
    )
    expect(resultado).toEqual({ nombre: 'All Boys', deLocal: true })
  })

  it('de visitante, el rival es el local', () => {
    const resultado = rivalDelGol(
      gol({
        id: 'g2',
        fecha: '2026-03-08T15:00:00.000Z',
        minuto: 71,
        aldosiviDeLocal: false,
        rival: 'Estudiantes',
      }),
    )
    expect(resultado).toEqual({ nombre: 'Estudiantes', deLocal: false })
  })
})

describe('golesOrdenados', () => {
  it('del más nuevo al más viejo, no por el minuto del partido', () => {
    const ordenados = golesOrdenados([
      gol({ id: 'viejo', fecha: '2024-05-01T15:00:00.000Z', minuto: 3 }),
      gol({ id: 'nuevo', fecha: '2026-08-02T15:00:00.000Z', minuto: 90 }),
      gol({ id: 'medio', fecha: '2026-03-01T15:00:00.000Z', minuto: 45 }),
    ])

    expect(ordenados.map((g) => g.id)).toEqual(['nuevo', 'medio', 'viejo'])
  })

  it('dos goles del mismo partido van del último al primero', () => {
    const ordenados = golesOrdenados([
      gol({ id: 'primero', fecha: '2026-08-02T15:00:00.000Z', minuto: 12 }),
      gol({ id: 'segundo', fecha: '2026-08-02T15:00:00.000Z', minuto: 67 }),
      gol({ id: 'adicionado', fecha: '2026-08-02T15:00:00.000Z', minuto: 67, adicionado: 2 }),
    ])

    expect(ordenados.map((g) => g.id)).toEqual(['adicionado', 'segundo', 'primero'])
  })

  it('no toca el arreglo que recibe', () => {
    const original = [
      gol({ id: 'viejo', fecha: '2024-05-01T15:00:00.000Z', minuto: 3 }),
      gol({ id: 'nuevo', fecha: '2026-08-02T15:00:00.000Z', minuto: 90 }),
    ]
    golesOrdenados(original)
    expect(original[0].id).toBe('viejo')
  })
})
