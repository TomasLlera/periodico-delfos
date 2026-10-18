import { describe, expect, it } from 'vitest'
import {
  agruparTablaPorFecha,
  balanceAldosivi,
  cambiosDePuesto,
  diferenciaGol,
  dividirFixture,
  estadoTemporada,
  etiquetaDiferencia,
  fechaPedidaDeTabla,
  fechasDisponibles,
  filaDeAldosivi,
  pestanaPedida,
  tablaDeLaFecha,
  tablaPrevia,
  textoDeCambio,
  ventanaFechaAFecha,
  yaSeJugo,
} from '@/lib/temporada'
import type {
  Equipo,
  EstadoPartido,
  FilaTablaConEquipo,
  PartidoConEquipos,
  Temporada,
} from '@/types'

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

describe('estadoTemporada', () => {
  const jugado = (fecha: string) =>
    partido({ fecha, estado: 'finalizado', golesLocal: 1, golesVisitante: 0 })

  it('el último es el más reciente jugado y el próximo el primero sin jugar', () => {
    const { ultimo, proximo } = estadoTemporada([
      partido({ fecha: '2026-05-01T15:00:00.000Z' }),
      jugado('2026-02-01T15:00:00.000Z'),
      partido({ fecha: '2026-04-01T15:00:00.000Z' }),
      jugado('2026-03-01T15:00:00.000Z'),
    ])

    expect(ultimo?.fecha_hora).toBe('2026-03-01T15:00:00.000Z')
    expect(proximo?.fecha_hora).toBe('2026-04-01T15:00:00.000Z')
  })

  it('sin partidos los dos son null', () => {
    expect(estadoTemporada([])).toEqual({ ultimo: null, proximo: null })
  })

  it('con la temporada terminada no hay próximo', () => {
    const { ultimo, proximo } = estadoTemporada([jugado('2026-02-01T15:00:00.000Z')])
    expect(ultimo?.fecha_hora).toBe('2026-02-01T15:00:00.000Z')
    expect(proximo).toBeNull()
  })

  // Es la decisión de `estadoTemporada`: próximo es el primero SIN JUGAR, no el
  // primero posterior a hoy. Un partido viejo sin resultado cargado queda a la
  // vista en lugar de desaparecer.
  it('un partido pasado sin resultado cargado sigue siendo el próximo', () => {
    const { proximo } = estadoTemporada([
      jugado('2026-02-01T15:00:00.000Z'),
      partido({ fecha: '2026-02-15T15:00:00.000Z' }),
    ])
    expect(proximo?.fecha_hora).toBe('2026-02-15T15:00:00.000Z')
  })
})

describe('ventanaFechaAFecha', () => {
  const fixture = [
    partido({ fecha: '2026-01-01T15:00:00.000Z', estado: 'finalizado', golesLocal: 1, golesVisitante: 0 }),
    partido({ fecha: '2026-01-08T15:00:00.000Z', estado: 'finalizado', golesLocal: 2, golesVisitante: 0 }),
    partido({ fecha: '2026-01-15T15:00:00.000Z', estado: 'finalizado', golesLocal: 3, golesVisitante: 0 }),
    partido({ fecha: '2026-01-22T15:00:00.000Z' }),
    partido({ fecha: '2026-01-29T15:00:00.000Z' }),
    partido({ fecha: '2026-02-05T15:00:00.000Z' }),
  ]

  it('deja los últimos jugados y los que vienen, en orden cronológico', () => {
    const visibles = ventanaFechaAFecha(fixture, { jugados: 2, porJugar: 1 })

    expect(visibles.map((p) => p.fecha_hora)).toEqual([
      '2026-01-08T15:00:00.000Z',
      '2026-01-15T15:00:00.000Z',
      '2026-01-22T15:00:00.000Z',
    ])
  })

  it('con menos partidos que la ventana devuelve los que hay', () => {
    expect(ventanaFechaAFecha(fixture.slice(0, 1), { jugados: 5, porJugar: 2 })).toHaveLength(1)
    expect(ventanaFechaAFecha([])).toEqual([])
  })
})

describe('filaDeAldosivi', () => {
  function fila(posicion: number, equipo: Equipo): FilaTablaConEquipo {
    return {
      id: `t-${equipo.id}`,
      temporada_id: TEMPORADA.id,
      fecha_numero: 11,
      equipo_id: equipo.id,
      posicion,
      puntos: 0,
      jugados: 0,
      ganados: 0,
      empatados: 0,
      perdidos: 0,
      goles_favor: 0,
      goles_contra: 0,
      equipo,
    }
  }

  it('la encuentra por es_aldosivi, esté en la posición que esté', () => {
    const encontrada = filaDeAldosivi([fila(1, MORON), fila(2, ALL_BOYS), fila(3, ALDOSIVI)])
    expect(encontrada?.posicion).toBe(3)
  })

  it('sin Aldosivi en la tabla devuelve null', () => {
    expect(filaDeAldosivi([fila(1, MORON)])).toBeNull()
    expect(filaDeAldosivi([])).toBeNull()
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

// ============================================
// La tabla, fecha por fecha
// ============================================

/**
 * Las filas de la tabla llegan del servidor en una sola consulta, todas las
 * fechas juntas, así que los helpers que las parten y las comparan son lo que
 * decide qué muestra el selector. Se testean con el orden mezclado a propósito:
 * la consulta ordena, pero la demo arma los arrays a mano.
 */
function filaDeTabla(fecha: number, posicion: number, equipo: Equipo): FilaTablaConEquipo {
  return {
    id: `t-${fecha}-${equipo.id}`,
    temporada_id: TEMPORADA.id,
    fecha_numero: fecha,
    equipo_id: equipo.id,
    posicion,
    puntos: 0,
    jugados: 0,
    ganados: 0,
    empatados: 0,
    perdidos: 0,
    goles_favor: 0,
    goles_contra: 0,
    equipo,
  }
}

describe('agruparTablaPorFecha', () => {
  it('parte las filas en una tabla por fecha, de la más vieja a la más nueva', () => {
    const tablas = agruparTablaPorFecha([
      filaDeTabla(3, 1, ALDOSIVI),
      filaDeTabla(1, 2, ALDOSIVI),
      filaDeTabla(3, 2, MORON),
      filaDeTabla(1, 1, MORON),
    ])

    expect(tablas.map((t) => t.fecha)).toEqual([1, 3])
    expect(tablas[0].filas.map((f) => f.equipo_id)).toEqual(['mor', 'ald'])
  })

  it('ordena cada fecha por puesto aunque las filas vengan al revés', () => {
    const tablas = agruparTablaPorFecha([
      filaDeTabla(1, 3, MORON),
      filaDeTabla(1, 1, ALDOSIVI),
      filaDeTabla(1, 2, ALL_BOYS),
    ])

    expect(tablas[0].filas.map((f) => f.posicion)).toEqual([1, 2, 3])
  })

  it('sin filas no hay ninguna fecha', () => {
    expect(agruparTablaPorFecha([])).toEqual([])
    expect(fechasDisponibles([])).toEqual([])
  })
})

describe('fechaPedidaDeTabla', () => {
  const fechas = [1, 2, 5]

  it('sin parámetro abre en la última cargada', () => {
    expect(fechaPedidaDeTabla(undefined, fechas)).toBe(5)
    expect(fechaPedidaDeTabla(null, fechas)).toBe(5)
    expect(fechaPedidaDeTabla('', fechas)).toBe(5)
  })

  it('respeta una fecha que existe', () => {
    expect(fechaPedidaDeTabla('2', fechas)).toBe(2)
  })

  // Un link compartido a una fecha que después se borró no deja la pantalla
  // sin tabla: cae en la última.
  it('una fecha que no está cargada cae en la última', () => {
    expect(fechaPedidaDeTabla('3', fechas)).toBe(5)
    expect(fechaPedidaDeTabla('99', fechas)).toBe(5)
  })

  it('cualquier cosa que no sea un entero cae en la última', () => {
    expect(fechaPedidaDeTabla('hola', fechas)).toBe(5)
    expect(fechaPedidaDeTabla('2.5', fechas)).toBe(5)
    expect(fechaPedidaDeTabla('-1', fechas)).toBe(5)
  })

  it('sin ninguna fecha cargada devuelve null', () => {
    expect(fechaPedidaDeTabla('3', [])).toBeNull()
    expect(fechaPedidaDeTabla(undefined, [])).toBeNull()
  })
})

describe('tablaDeLaFecha y tablaPrevia', () => {
  const tablas = agruparTablaPorFecha([
    filaDeTabla(2, 1, ALDOSIVI),
    filaDeTabla(4, 1, ALDOSIVI),
    filaDeTabla(8, 1, ALDOSIVI),
  ])

  it('encuentra la tabla de una fecha', () => {
    expect(tablaDeLaFecha(tablas, 4)?.fecha).toBe(4)
    expect(tablaDeLaFecha(tablas, 3)).toBeNull()
    expect(tablaDeLaFecha(tablas, null)).toBeNull()
  })

  // La fecha 7 no existe: la 8 se compara con la 4, no con una fecha vacía.
  it('la previa es la cargada anterior y no la fecha menos uno', () => {
    expect(tablaPrevia(tablas, 8)?.fecha).toBe(4)
    expect(tablaPrevia(tablas, 4)?.fecha).toBe(2)
  })

  it('la primera fecha cargada no tiene previa', () => {
    expect(tablaPrevia(tablas, 2)).toBeNull()
  })
})

describe('cambiosDePuesto', () => {
  it('subir es bajar de número', () => {
    const cambios = cambiosDePuesto(
      [{ equipo_id: 'ald', posicion: 5 }],
      [{ equipo_id: 'ald', posicion: 8 }],
    )

    expect(cambios.get('ald')).toEqual({ movimiento: 'subio', puestos: 3 })
  })

  it('bajar es subir de número, y el puesto igual se mantiene', () => {
    const cambios = cambiosDePuesto(
      [
        { equipo_id: 'ald', posicion: 9 },
        { equipo_id: 'abo', posicion: 2 },
      ],
      [
        { equipo_id: 'ald', posicion: 7 },
        { equipo_id: 'abo', posicion: 2 },
      ],
    )

    expect(cambios.get('ald')).toEqual({ movimiento: 'bajo', puestos: 2 })
    expect(cambios.get('abo')).toEqual({ movimiento: 'mantuvo', puestos: 0 })
  })

  // En la primera fecha cargada nadie subió ni bajó: el mapa vuelve vacío y la
  // tabla no dibuja ningún indicador.
  it('sin fecha anterior no hay ningún cambio', () => {
    expect(cambiosDePuesto([{ equipo_id: 'ald', posicion: 1 }], null).size).toBe(0)
  })

  it('un equipo que no estaba en la fecha anterior no tiene indicador', () => {
    const cambios = cambiosDePuesto(
      [
        { equipo_id: 'ald', posicion: 1 },
        { equipo_id: 'mor', posicion: 2 },
      ],
      [{ equipo_id: 'ald', posicion: 1 }],
    )

    expect(cambios.has('mor')).toBe(false)
    expect(cambios.has('ald')).toBe(true)
  })
})

describe('textoDeCambio', () => {
  it('singular y plural, que es lo que lee el lector de pantalla', () => {
    expect(textoDeCambio({ movimiento: 'subio', puestos: 1 })).toBe('Subió 1 puesto')
    expect(textoDeCambio({ movimiento: 'bajo', puestos: 3 })).toBe('Bajó 3 puestos')
    expect(textoDeCambio({ movimiento: 'mantuvo', puestos: 0 })).toBe('Mantiene el puesto')
  })
})
