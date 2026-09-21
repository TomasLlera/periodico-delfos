import { describe, expect, it } from 'vitest'
import {
  avisosDePartido,
  entradaDesdePartido,
  esquemaPartido,
  filaDePartido,
  slugDePartido,
} from './partido'

const ALDOSIVI = '0e5f7a10-0000-4000-8000-000000000001'
const CLAYPOLE = '0e5f7a10-0000-4000-8000-000000000002'
const TEMPORADA = '0e5f7a10-0000-4000-8000-000000000003'

const VALIDO = {
  temporada_id: TEMPORADA,
  fecha_numero: 4,
  fecha_hora_local: '2026-08-02T15:30',
  equipo_local_id: ALDOSIVI,
  equipo_visitante_id: CLAYPOLE,
  goles_local: 6,
  goles_visitante: 1,
  estado: 'finalizado',
  cancha: 'José María Minella',
  arbitra: '',
  slug: 'fecha-4-aldosivi-claypole-2026',
  observaciones: '',
}

describe('slugDePartido', () => {
  it('arma el del blueprint: fecha, los dos equipos y el año', () => {
    expect(
      slugDePartido({
        fechaNumero: 11,
        localCorto: 'Aldosivi',
        visitanteCorto: 'All Boys',
        anio: 2026,
      }),
    ).toBe('fecha-11-aldosivi-all-boys-2026')
  })

  /**
   * Sin el año, la fecha 11 contra All Boys de la temporada siguiente chocaría
   * contra el único de `partidos.slug`.
   */
  it('el año es lo que deja repetir el mismo cruce en otra temporada', () => {
    const a = slugDePartido({ fechaNumero: 11, localCorto: 'Aldosivi', visitanteCorto: 'All Boys', anio: 2026 })
    const b = slugDePartido({ fechaNumero: 11, localCorto: 'Aldosivi', visitanteCorto: 'All Boys', anio: 2027 })
    expect(a).not.toBe(b)
  })

  it('un partido sin número de fecha cae en la fecha del calendario', () => {
    expect(
      slugDePartido({
        fechaNumero: null,
        localCorto: 'Aldosivi',
        visitanteCorto: 'Kimberley',
        anio: 2026,
        fechaHoraLocal: '2026-03-08T16:00',
      }),
    ).toBe('2026-03-08-aldosivi-kimberley-2026')
  })

  it('saca los acentos del nombre del rival', () => {
    expect(
      slugDePartido({ fechaNumero: 2, localCorto: 'Atlético Sarmiento', visitanteCorto: 'Aldosivi', anio: 2026 }),
    ).toBe('fecha-2-atletico-sarmiento-aldosivi-2026')
  })
})

describe('esquemaPartido', () => {
  it('acepta un partido completo', () => {
    expect(esquemaPartido.safeParse(VALIDO).success).toBe(true)
  })

  it('no deja que un equipo juegue contra sí mismo', () => {
    const r = esquemaPartido.safeParse({ ...VALIDO, equipo_visitante_id: ALDOSIVI })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Un equipo no puede jugar contra sí mismo')
  })

  /** El mismo CHECK que `finalizado_tiene_resultado`, pero antes de Postgres. */
  it('un finalizado sin resultado no pasa', () => {
    const r = esquemaPartido.safeParse({ ...VALIDO, goles_local: null })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Un partido finalizado necesita el resultado')
  })

  it('un programado sin resultado sí pasa: todavía no se jugó', () => {
    const r = esquemaPartido.safeParse({
      ...VALIDO,
      estado: 'programado',
      goles_local: null,
      goles_visitante: null,
    })
    expect(r.success).toBe(true)
  })

  it('rechaza una fecha de campeonato que es un error de tipeo', () => {
    expect(esquemaPartido.safeParse({ ...VALIDO, fecha_numero: 44 }).success).toBe(false)
  })

  it('rechaza un marcador imposible', () => {
    expect(esquemaPartido.safeParse({ ...VALIDO, goles_local: 300 }).success).toBe(false)
  })

  it('exige la fecha y la hora', () => {
    expect(esquemaPartido.safeParse({ ...VALIDO, fecha_hora_local: '' }).success).toBe(false)
  })

  it('no acepta una fecha y hora que no se puede convertir', () => {
    const r = esquemaPartido.safeParse({ ...VALIDO, fecha_hora_local: 'el sábado a la tarde' })
    expect(r.success).toBe(false)
  })
})

describe('filaDePartido', () => {
  it('convierte la hora de Mar del Plata a UTC para la base', () => {
    const fila = filaDePartido(esquemaPartido.parse(VALIDO))
    expect(fila?.fecha_hora).toBe('2026-08-02T18:30:00.000Z')
  })

  it('los campos vacíos llegan como null', () => {
    const fila = filaDePartido(esquemaPartido.parse(VALIDO))
    expect(fila?.arbitra).toBe(null)
    expect(fila?.observaciones).toBe(null)
  })
})

describe('entradaDesdePartido', () => {
  it('un partido nuevo arranca programado y en la temporada activa', () => {
    const entrada = entradaDesdePartido(null, {
      temporadaId: TEMPORADA,
      fechaHoraLocal: '2026-09-20T16:00',
    })
    expect(entrada.estado).toBe('programado')
    expect(entrada.temporada_id).toBe(TEMPORADA)
    expect(entrada.goles_local).toBe(null)
  })

  it('sin temporada activa el select arranca sin elegir, y Zod lo va a pedir', () => {
    const entrada = entradaDesdePartido(null, { temporadaId: null, fechaHoraLocal: '2026-09-20T16:00' })
    expect(entrada.temporada_id).toBe('')
    expect(esquemaPartido.safeParse(entrada).success).toBe(false)
  })
})

describe('avisosDePartido', () => {
  const equipos = [
    { id: ALDOSIVI, es_aldosivi: true },
    { id: CLAYPOLE, es_aldosivi: false },
  ]

  it('no avisa nada de un partido normal', () => {
    expect(
      avisosDePartido(
        { equipo_local_id: ALDOSIVI, equipo_visitante_id: CLAYPOLE, estado: 'finalizado', goles_local: 6, goles_visitante: 1 },
        equipos,
      ),
    ).toEqual([])
  })

  it('avisa si ninguno de los dos es Aldosivi', () => {
    const avisos = avisosDePartido(
      { equipo_local_id: CLAYPOLE, equipo_visitante_id: '0e5f7a10-0000-4000-8000-000000000004', estado: 'programado', goles_local: null, goles_visitante: null },
      equipos,
    )
    expect(avisos[0]).toContain('Ninguno de los dos equipos es Aldosivi')
  })

  it('no avisa con el formulario a medio llenar', () => {
    expect(
      avisosDePartido(
        { equipo_local_id: '', equipo_visitante_id: '', estado: 'programado', goles_local: null, goles_visitante: null },
        equipos,
      ),
    ).toEqual([])
  })

  it('avisa del estado que quedó sin cambiar', () => {
    const avisos = avisosDePartido(
      { equipo_local_id: ALDOSIVI, equipo_visitante_id: CLAYPOLE, estado: 'programado', goles_local: 2, goles_visitante: 0 },
      equipos,
    )
    expect(avisos[0]).toContain('programado')
  })
})
