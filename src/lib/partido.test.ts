import { describe, expect, it } from 'vitest'
import {
  agruparPorMinuto,
  apellidoDeEvento,
  etiquetaDePartido,
  describirEvento,
  ladoDelEvento,
  ladosDelPartido,
  resumenGoles,
  suplentes,
  titulares,
  tituloAccesible,
} from '@/lib/partido'
import type {
  Equipo,
  EventoConJugadora,
  FormacionConJugadora,
  Jugadora,
  PartidoCompleto,
  Temporada,
  TipoEvento,
} from '@/types'

// ============================================
// Fixtures mínimos
// ============================================

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

const ALDOSIVI: Equipo = {
  id: 'ald',
  nombre: 'Club Atlético Aldosivi',
  nombre_corto: 'Aldosivi',
  apodo: 'Las Tiburonas',
  slug: 'aldosivi',
  escudo_url: null,
  ciudad: 'Mar del Plata',
  es_aldosivi: true,
}

const RIVAL: Equipo = {
  id: 'abo',
  nombre: 'Club Atlético All Boys',
  nombre_corto: 'All Boys',
  apodo: null,
  slug: 'all-boys',
  escudo_url: null,
  ciudad: 'Buenos Aires',
  es_aldosivi: false,
}

const CORTADI: Jugadora = {
  id: 'j1',
  nombre: 'Lucía',
  apellido: 'Cortadi',
  slug: 'lucia-cortadi',
  posicion: 'delantera',
  fecha_nacimiento: null,
  foto_url: null,
  lugar_origen: null,
  bio: null,
  activa: true,
}

const LAREA: Jugadora = { ...CORTADI, id: 'j2', nombre: 'Julieta', apellido: 'Larea', slug: 'julieta-larea', posicion: 'mediocampista' }
const ACOSTA: Jugadora = { ...CORTADI, id: 'j3', nombre: 'Priscila', apellido: 'Acosta', slug: 'priscila-acosta', posicion: 'mediocampista' }

interface EventoParcial {
  minuto: number
  adicionado?: number
  tipo: TipoEvento
  equipo: Equipo
  jugadora?: Jugadora
  nombre?: string
  sale?: Jugadora
  detalle?: string
}

function evento(indice: number, parcial: EventoParcial): EventoConJugadora {
  const referencia = (jug: Jugadora) => ({
    id: jug.id,
    nombre: jug.nombre,
    apellido: jug.apellido,
    slug: jug.slug,
  })
  return {
    id: `e${indice}`,
    partido_id: 'p1',
    minuto: parcial.minuto,
    adicionado: parcial.adicionado ?? 0,
    tipo: parcial.tipo,
    equipo_id: parcial.equipo.id,
    jugadora_id: parcial.jugadora?.id ?? null,
    jugadora_nombre: parcial.jugadora ? null : (parcial.nombre ?? null),
    jugadora_sale_id: parcial.sale?.id ?? null,
    jugadora_sale_nombre: null,
    detalle: parcial.detalle ?? null,
    jugadora: parcial.jugadora ? referencia(parcial.jugadora) : null,
    jugadora_sale: parcial.sale ? referencia(parcial.sale) : null,
  }
}

/** `aldosiviDeLocal` decide de qué lado del fixture entra Aldosivi. */
function partido(opciones: {
  aldosiviDeLocal: boolean
  golesAldosivi: number | null
  golesRival: number | null
  eventos?: EventoParcial[]
  formaciones?: FormacionConJugadora[]
}): PartidoCompleto {
  const { aldosiviDeLocal: local } = opciones
  return {
    id: 'p1',
    temporada_id: TEMPORADA.id,
    fecha_numero: 11,
    fecha_hora: '2026-08-02T15:30:00.000Z',
    equipo_local_id: local ? ALDOSIVI.id : RIVAL.id,
    equipo_visitante_id: local ? RIVAL.id : ALDOSIVI.id,
    goles_local: local ? opciones.golesAldosivi : opciones.golesRival,
    goles_visitante: local ? opciones.golesRival : opciones.golesAldosivi,
    estado: 'finalizado',
    cancha: null,
    arbitra: null,
    slug: 'p1',
    observaciones: null,
    created_at: '2026-08-02T18:00:00.000Z',
    equipo_local: local ? ALDOSIVI : RIVAL,
    equipo_visitante: local ? RIVAL : ALDOSIVI,
    temporada: TEMPORADA,
    eventos: (opciones.eventos ?? []).map((parcial, indice) => evento(indice, parcial)),
    formaciones: opciones.formaciones ?? [],
  }
}

// ============================================
// Tests
// ============================================

describe('ladosDelPartido', () => {
  it('pone a Aldosivi a la izquierda cuando es local', () => {
    const lados = ladosDelPartido(partido({ aldosiviDeLocal: true, golesAldosivi: 2, golesRival: 1 }))
    expect(lados.izquierda.id).toBe(ALDOSIVI.id)
    expect(lados.golesIzquierda).toBe(2)
    expect(lados.golesDerecha).toBe(1)
    expect(lados.aldosiviEsLocal).toBe(true)
  })

  it('pone a Aldosivi a la izquierda también de visitante, con sus goles', () => {
    const lados = ladosDelPartido(partido({ aldosiviDeLocal: false, golesAldosivi: 2, golesRival: 1 }))
    expect(lados.izquierda.id).toBe(ALDOSIVI.id)
    expect(lados.derecha.id).toBe(RIVAL.id)
    expect(lados.golesIzquierda).toBe(2)
    expect(lados.golesDerecha).toBe(1)
    expect(lados.aldosiviEsLocal).toBe(false)
  })
})

describe('ladoDelEvento', () => {
  const casos = [true, false]

  it.each(casos)('sigue a la jugadora (Aldosivi de local: %s)', (aldosiviDeLocal) => {
    const p = partido({
      aldosiviDeLocal,
      golesAldosivi: 1,
      golesRival: 0,
      eventos: [
        { minuto: 10, tipo: 'gol', equipo: ALDOSIVI, jugadora: CORTADI },
        { minuto: 20, tipo: 'amarilla', equipo: RIVAL, nombre: 'M. Suárez' },
      ],
    })
    expect(ladoDelEvento(p.eventos[0], p)).toBe('aldosivi')
    expect(ladoDelEvento(p.eventos[1], p)).toBe('rival')
  })

  it.each(casos)('anota el gol en contra del lado que suma (Aldosivi de local: %s)', (aldosiviDeLocal) => {
    const p = partido({
      aldosiviDeLocal,
      golesAldosivi: 1,
      golesRival: 1,
      eventos: [
        // Una rival mete el gol: suma Aldosivi.
        { minuto: 30, tipo: 'gol_en_contra', equipo: RIVAL, nombre: 'C. Vera' },
        // Una nuestra mete el gol: suma el rival.
        { minuto: 70, tipo: 'gol_en_contra', equipo: ALDOSIVI, jugadora: LAREA },
      ],
    })
    expect(ladoDelEvento(p.eventos[0], p)).toBe('aldosivi')
    expect(ladoDelEvento(p.eventos[1], p)).toBe('rival')
  })
})

describe('agruparPorMinuto', () => {
  it('junta en una fila los eventos del mismo minuto, uno por lado', () => {
    const p = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 0,
      golesRival: 0,
      eventos: [
        { minuto: 58, tipo: 'cambio', equipo: ALDOSIVI, jugadora: ACOSTA, sale: LAREA },
        { minuto: 58, tipo: 'amarilla', equipo: RIVAL, nombre: 'P. Bordón' },
      ],
    })
    const grupos = agruparPorMinuto(p)
    expect(grupos).toHaveLength(1)
    expect(grupos[0].etiqueta).toBe("58'")
    expect(grupos[0].aldosivi).toHaveLength(1)
    expect(grupos[0].rival).toHaveLength(1)
  })

  it('ordena por minuto y adicionado, y etiqueta el tiempo agregado', () => {
    const p = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 0,
      golesRival: 0,
      eventos: [
        { minuto: 45, adicionado: 2, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: CORTADI },
        { minuto: 45, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: LAREA },
        { minuto: 12, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: ACOSTA },
      ],
    })
    expect(agruparPorMinuto(p).map((grupo) => grupo.etiqueta)).toEqual(["12'", "45'", "45+2'"])
  })

  it('describe el minuto sin apóstrofos ni guiones', () => {
    const p = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 1,
      golesRival: 0,
      eventos: [
        { minuto: 90, adicionado: 3, tipo: 'gol', equipo: ALDOSIVI, jugadora: CORTADI },
      ],
    })
    expect(agruparPorMinuto(p)[0].descripcion).toBe(
      'Minuto 90 más 3. Gol de Aldosivi: Lucía Cortadi.',
    )
  })
})

describe('describirEvento', () => {
  const p = partido({
    aldosiviDeLocal: true,
    golesAldosivi: 0,
    golesRival: 0,
    eventos: [
      { minuto: 58, tipo: 'cambio', equipo: ALDOSIVI, jugadora: ACOSTA, sale: LAREA },
      { minuto: 30, tipo: 'gol_en_contra', equipo: RIVAL, nombre: 'C. Vera' },
      { minuto: 20, tipo: 'amarilla', equipo: RIVAL, nombre: 'M. Suárez' },
      { minuto: 45, tipo: 'penal_errado', equipo: ALDOSIVI, jugadora: CORTADI, detalle: 'Atajó Benítez' },
    ],
  })

  it('nombra a las dos jugadoras del cambio', () => {
    expect(describirEvento(p.eventos[0], p)).toBe(
      'Cambio en Aldosivi: entra Priscila Acosta, sale Julieta Larea.',
    )
  })

  it('deja claro de qué equipo es quien hace el gol en contra', () => {
    expect(describirEvento(p.eventos[1], p)).toBe('Gol en contra de C. Vera, de All Boys.')
  })

  it('usa el nombre libre de las rivales', () => {
    expect(describirEvento(p.eventos[2], p)).toBe('Amarilla para All Boys: M. Suárez.')
  })

  it('suma el detalle al final', () => {
    expect(describirEvento(p.eventos[3], p)).toBe(
      'Penal errado por Lucía Cortadi, de Aldosivi. Atajó Benítez.',
    )
  })
})

describe('apellidoDeEvento', () => {
  it('cae en un texto legible si no hay ni FK ni nombre libre', () => {
    const p = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 0,
      golesRival: 0,
      eventos: [{ minuto: 5, tipo: 'amarilla', equipo: RIVAL }],
    })
    expect(apellidoDeEvento(p.eventos[0])).toBe('Sin identificar')
  })
})

describe('resumenGoles', () => {
  it('suma el gol en contra al equipo que se lo lleva y marca los de penal', () => {
    const p = partido({
      aldosiviDeLocal: false,
      golesAldosivi: 2,
      golesRival: 1,
      eventos: [
        { minuto: 30, tipo: 'gol_en_contra', equipo: RIVAL, nombre: 'C. Vera' },
        { minuto: 55, tipo: 'gol', equipo: RIVAL, nombre: 'L. Ferrari' },
        { minuto: 88, tipo: 'gol_penal', equipo: ALDOSIVI, jugadora: CORTADI },
        { minuto: 90, tipo: 'amarilla', equipo: ALDOSIVI, jugadora: LAREA },
      ],
    })
    // De las rivales sólo hay texto libre, así que va tal cual se cargó.
    expect(resumenGoles(p)).toEqual({
      aldosivi: ["C. Vera 30' (e/c)", "Cortadi 88' (p)"],
      rival: ["L. Ferrari 55'"],
    })
  })

  it('un partido sin eventos cargados no tiene goleadoras, y no rompe', () => {
    // Es el caso del fixture de la temporada: `getPartidosTemporada()` no trae
    // los eventos, y la misma tarjeta compacta tiene que dibujarse igual.
    const { eventos, ...sinEventos } = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 2,
      golesRival: 1,
    })
    void eventos

    expect(resumenGoles(sinEventos)).toEqual({ aldosivi: [], rival: [] })
  })
})

describe('tituloAccesible', () => {
  it('lee el marcador con Aldosivi primero y aclara la condición', () => {
    const p = partido({ aldosiviDeLocal: false, golesAldosivi: 2, golesRival: 1 })
    expect(tituloAccesible(p)).toBe(
      'Aldosivi 2, All Boys 1. Aldosivi de visitante. Fecha 11. Primera B 2026. 2 de agosto de 2026.',
    )
  })

  it('dice "contra" mientras no haya resultado', () => {
    const p = partido({ aldosiviDeLocal: true, golesAldosivi: null, golesRival: null })
    expect(tituloAccesible(p)).toContain('Aldosivi contra All Boys')
  })
})

describe('titulares y suplentes', () => {
  const formacion = (jug: Jugadora, es_titular: boolean, dorsal: number | null): FormacionConJugadora => ({
    partido_id: 'p1',
    jugadora_id: jug.id,
    es_titular,
    dorsal,
    posicion: jug.posicion,
    jugadora: jug,
  })

  it('ordena por dorsal y manda al final a las que no tienen', () => {
    const p = partido({
      aldosiviDeLocal: true,
      golesAldosivi: 0,
      golesRival: 0,
      formaciones: [
        formacion(CORTADI, true, null),
        formacion(LAREA, true, 5),
        formacion(ACOSTA, false, 13),
      ],
    })
    expect(titulares(p).map((fila) => fila.dorsal)).toEqual([5, null])
    expect(suplentes(p).map((fila) => fila.jugadora.apellido)).toEqual(['Acosta'])
  })
})

describe('etiquetaDePartido', () => {
  it('lleva la fecha y el marcador', () => {
    const p = partido({ aldosiviDeLocal: true, golesAldosivi: 6, golesRival: 1 })
    expect(etiquetaDePartido(p)).toBe('Fecha 11 · Aldosivi 6-1 All Boys')
  })

  it('respeta de qué lado jugó cada uno', () => {
    const p = partido({ aldosiviDeLocal: false, golesAldosivi: 2, golesRival: 3 })
    expect(etiquetaDePartido(p)).toBe('Fecha 11 · All Boys 3-2 Aldosivi')
  })

  it('sin resultado todavía, va "vs"', () => {
    const p = partido({ aldosiviDeLocal: true, golesAldosivi: null, golesRival: null })
    expect(etiquetaDePartido(p)).toBe('Fecha 11 · Aldosivi vs All Boys')
  })

  it('sin número de fecha usa el nombre de la temporada', () => {
    const p = { ...partido({ aldosiviDeLocal: true, golesAldosivi: 1, golesRival: 0 }), fecha_numero: null }
    expect(etiquetaDePartido(p)).toBe('Primera B 2026 · Aldosivi 1-0 All Boys')
  })
})
