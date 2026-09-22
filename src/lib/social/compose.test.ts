import { describe, expect, it } from 'vitest'
import { fechaHoraPartido } from '@/lib/formato'
import { componerCopy, componerTodos, HASHTAGS } from '@/lib/social/compose'
import { LARGO_MAXIMO_X, largoEnX, pesoDeTexto } from '@/lib/social/limites'
import type {
  Autor,
  Equipo,
  EstadoPartido,
  EventoConJugadora,
  Jugadora,
  NotaConRelaciones,
  PartidoCompleto,
  PartidoConEquipos,
  Temporada,
  TipoEvento,
} from '@/types'

// ============================================
// Fixtures mínimos
// ============================================

const URL_SITIO = 'https://periodicodelfos.com'

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

const ALL_BOYS: Equipo = {
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

const GARRO: Jugadora = { ...CORTADI, id: 'j2', apellido: 'Garro', slug: 'ana-garro', nombre: 'Ana' }

const AUTOR: Autor = {
  id: 'a1',
  nombre: 'Charlie Redondo',
  slug: 'charlie-redondo',
  bio: null,
  foto_url: null,
  instagram: null,
  x_handle: null,
  firma_como: null,
}

interface EventoParcial {
  minuto: number
  adicionado?: number
  tipo: TipoEvento
  equipo: Equipo
  jugadora: Jugadora
}

function evento(indice: number, parcial: EventoParcial): EventoConJugadora {
  const { jugadora } = parcial
  return {
    id: `e${indice}`,
    partido_id: 'p1',
    minuto: parcial.minuto,
    adicionado: parcial.adicionado ?? 0,
    tipo: parcial.tipo,
    equipo_id: parcial.equipo.id,
    jugadora_id: jugadora.id,
    jugadora_nombre: null,
    jugadora_sale_id: null,
    jugadora_sale_nombre: null,
    detalle: null,
    jugadora: {
      id: jugadora.id,
      nombre: jugadora.nombre,
      apellido: jugadora.apellido,
      slug: jugadora.slug,
    },
    jugadora_sale: null,
  }
}

/** `aldosiviDeLocal` decide de qué lado del fixture entra Aldosivi. */
function partido(opciones: {
  aldosiviDeLocal?: boolean
  golesAldosivi?: number | null
  golesRival?: number | null
  estado?: EstadoPartido
  cancha?: string | null
  fechaNumero?: number | null
  eventos?: EventoParcial[]
} = {}): PartidoCompleto {
  const local = opciones.aldosiviDeLocal ?? true
  const golesAldosivi = opciones.golesAldosivi ?? null
  const golesRival = opciones.golesRival ?? null

  return {
    id: 'p1',
    temporada_id: TEMPORADA.id,
    fecha_numero: opciones.fechaNumero === undefined ? 11 : opciones.fechaNumero,
    fecha_hora: '2026-08-15T18:30:00.000Z',
    equipo_local_id: local ? ALDOSIVI.id : ALL_BOYS.id,
    equipo_visitante_id: local ? ALL_BOYS.id : ALDOSIVI.id,
    goles_local: local ? golesAldosivi : golesRival,
    goles_visitante: local ? golesRival : golesAldosivi,
    estado: opciones.estado ?? 'finalizado',
    cancha: opciones.cancha ?? null,
    arbitra: null,
    slug: 'p1',
    observaciones: null,
    created_at: '2026-08-15T22:00:00.000Z',
    equipo_local: local ? ALDOSIVI : ALL_BOYS,
    equipo_visitante: local ? ALL_BOYS : ALDOSIVI,
    temporada: TEMPORADA,
    eventos: (opciones.eventos ?? []).map((parcial, indice) => evento(indice, parcial)),
    formaciones: [],
  }
}

function nota(opciones: {
  titulo?: string
  bajada?: string
  slug?: string
  partido?: PartidoConEquipos | null
} = {}): NotaConRelaciones {
  const suPartido = opciones.partido === undefined ? null : opciones.partido
  return {
    id: 'n1',
    titulo: opciones.titulo ?? 'Las Tiburonas cerraron la fecha con una sonrisa',
    slug: opciones.slug ?? 'tiburonas-all-boys',
    bajada: opciones.bajada ?? 'El equipo de Mar del Plata sumó de a tres en el Minella.',
    cuerpo: { type: 'doc', content: [] },
    imagen_portada: null,
    imagen_alt: 'Las jugadoras festejan',
    imagen_credito: null,
    categoria: 'cronica',
    temporada_id: TEMPORADA.id,
    partido_id: suPartido?.id ?? null,
    autor_id: AUTOR.id,
    estado: 'publicada',
    publicada_en: '2026-08-15T23:00:00.000Z',
    destacada: false,
    auto_post: true,
    redes: ['facebook', 'instagram', 'x'],
    created_at: '2026-08-15T22:30:00.000Z',
    updated_at: '2026-08-15T23:00:00.000Z',
    autor: AUTOR,
    temporada: TEMPORADA,
    partido: suPartido,
  }
}

const GOLES: EventoParcial[] = [
  { minuto: 23, tipo: 'gol', equipo: ALDOSIVI, jugadora: CORTADI },
  { minuto: 61, tipo: 'gol_penal', equipo: ALDOSIVI, jugadora: GARRO },
]

// ============================================
// Las tres formas del copy
// ============================================

describe('forma del copy — partido finalizado', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })
  const datos = { nota: nota({ partido: p }), partido: p, urlSitio: URL_SITIO }

  it('abre con ⚽, la fecha y el marcador', () => {
    const { texto } = componerCopy('facebook', datos)
    expect(texto.split('\n')[0]).toBe('⚽ Fecha 11 · Aldosivi 2-1 All Boys')
  })

  it('nombra a las goleadoras de Aldosivi con su minuto, desde los eventos', () => {
    // Regla no negociable 1: sale de `resumenGoles()`, no de un texto tipeado.
    const { texto } = componerCopy('facebook', datos)
    expect(texto).toContain("⚽ Cortadi 23', Garro 61' (p)")
  })

  it('usa el nombre de la temporada cuando el partido no tiene número de fecha', () => {
    const sinFecha = partido({ golesAldosivi: 2, golesRival: 1, fechaNumero: null })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: sinFecha }),
      partido: sinFecha,
      urlSitio: URL_SITIO,
    })
    expect(texto.split('\n')[0]).toBe('⚽ Primera B 2026 · Aldosivi 2-1 All Boys')
  })

  it('se arma igual sin el partido completo, pero pierde las goleadoras', () => {
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('⚽ Fecha 11 · Aldosivi 2-1 All Boys')
    expect(texto).not.toContain('Cortadi')
  })

  it('no muestra la línea de goleadoras en un 0-0', () => {
    const cero = partido({ golesAldosivi: 0, golesRival: 0 })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: cero }),
      partido: cero,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Aldosivi 0-0 All Boys')
    expect(texto).not.toContain('⚽ \n')
  })
})

describe('forma del copy — partido programado', () => {
  const p = partido({
    estado: 'programado',
    cancha: 'Estadio José María Minella',
  })
  const datos = { nota: nota({ partido: p }), partido: p, urlSitio: URL_SITIO }

  it('abre con 🔍 y anuncia el cruce, sin marcador', () => {
    const { texto } = componerCopy('facebook', datos)
    expect(texto.split('\n')[0]).toBe('🔍 Previa Fecha 11 · Aldosivi vs All Boys')
  })

  it('da el día y la cancha, con la fecha que formatea el helper', () => {
    const { texto } = componerCopy('facebook', datos)
    // Contra el helper y no contra un string fijo: `fechaHoraPartido()` formatea
    // en la zona horaria de la máquina y el test no puede depender de eso.
    expect(texto).toContain(`📅 ${fechaHoraPartido(p.fecha_hora)} · Estadio José María Minella`)
  })

  it('omite la cancha cuando todavía no se sabe, sin dejar el separador colgado', () => {
    const sinCancha = partido({ estado: 'programado', cancha: null })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: sinCancha }),
      partido: sinCancha,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain(`📅 ${fechaHoraPartido(sinCancha.fecha_hora)}\n`)
    expect(texto).not.toContain('· \n')
  })

  it('nunca inventa un resultado para un partido que no se jugó', () => {
    const { texto } = componerCopy('facebook', datos)
    expect(texto).not.toMatch(/\d-\d/)
  })
})

describe('forma del copy — sin partido', () => {
  const datos = {
    nota: nota({ titulo: 'Quién es quién en el plantel 2026', partido: null }),
    urlSitio: URL_SITIO,
  }

  it('usa el título como titular, sin emoji deportivo', () => {
    const { texto } = componerCopy('facebook', datos)
    expect(texto.split('\n')[0]).toBe('Quién es quién en el plantel 2026')
  })

  it('no arrastra ninguna línea de datos deportivos', () => {
    const { texto } = componerCopy('facebook', datos)
    expect(texto).not.toContain('📅')
    expect(texto).not.toContain('Fecha 11')
  })
})

describe('forma del copy — partido sin resultado que anunciar', () => {
  it('aclara el estado de un partido suspendido', () => {
    // Sin la etiqueta, un suspendido se lee igual que un partido cualquiera.
    const p = partido({ estado: 'suspendido' })
    const { texto } = componerCopy('facebook', {
      nota: nota({ titulo: 'Se suspendió por lluvia', partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto.split('\n')[0]).toBe('Se suspendió por lluvia')
    expect(texto).toContain('Fecha 11 · Primera B 2026 · Suspendido')
  })

  it('marca el partido en curso como en juego', () => {
    const p = partido({ estado: 'en_curso', golesAldosivi: 1, golesRival: 0 })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('En juego')
    // Un parcial no se publica como si fuera el final.
    expect(texto).not.toContain('Aldosivi 1-0 All Boys')
  })

  it('no dice "Final" cuando el partido está finalizado pero sin marcador cargado', () => {
    const p = partido({ estado: 'finalizado', golesAldosivi: null, golesRival: null })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Fecha 11 · Primera B 2026')
    expect(texto).not.toContain('Final')
  })
})

// ============================================
// Aldosivi primero, siempre
// ============================================

describe('Aldosivi va siempre primero en el marcador', () => {
  it('de local', () => {
    const p = partido({ aldosiviDeLocal: true, golesAldosivi: 2, golesRival: 1 })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Aldosivi 2-1 All Boys')
  })

  it('de visitante, con sus goles del lado de Aldosivi', () => {
    // La misma regla que `ladosDelPartido()`: es un medio de un solo club y que
    // la columna propia cambie de lado obliga a releer el marcador cada vez.
    const p = partido({ aldosiviDeLocal: false, golesAldosivi: 2, golesRival: 1 })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Aldosivi 2-1 All Boys')
    expect(texto).not.toContain('All Boys 1-2 Aldosivi')
  })

  it('de visitante y perdiendo: el orden no cambia con el resultado', () => {
    const p = partido({ aldosiviDeLocal: false, golesAldosivi: 0, golesRival: 3 })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Aldosivi 0-3 All Boys')
  })

  it('también en la previa, que no tiene marcador', () => {
    const p = partido({ aldosiviDeLocal: false, estado: 'programado' })
    const { texto } = componerCopy('facebook', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(texto).toContain('Aldosivi vs All Boys')
  })
})

// ============================================
// X: el conteo y el orden de sacrificio
// ============================================

const BAJADA_LARGA =
  'El equipo de Mar del Plata se trajo los tres puntos de Floresta con una ' +
  'actuación sólida en el fondo y un segundo tiempo en el que manejó la pelota ' +
  'como no lo había hecho en toda la temporada, y ahora queda a dos puntos de ' +
  'la punta cuando faltan apenas cuatro fechas para el final del campeonato.'

/**
 * Los tamaños de los fixtures de X no son arbitrarios: con el partido de
 * arriba el encabezado pesa 35, la línea de goleadoras 29 y la cola —el 🔗, el
 * link que cuenta 23 y los hashtags— 63. Contando los blancos que separan los
 * bloques, a la bajada le quedan **148 con la línea de datos puesta y 178 sin
 * ella**, y ahí es donde se ve cuál de los dos se sacrifica primero.
 */
const BAJADA_ENTRE_148_Y_178 =
  'El equipo de Mar del Plata se trajo los tres puntos de Floresta con una ' +
  'actuación sólida en el fondo y ahora queda a dos de la punta cuando faltan ' +
  'cuatro fechas.'

/**
 * Un título de 197 deja apenas 16 de presupuesto: ni la primera palabra de
 * `BAJADA_DE_PALABRA_LARGA` entra, que es el único caso que llega al escalón 4.
 */
const TITULO_QUE_NO_DEJA_LUGAR =
  'Las Tiburonas cerraron una fecha inolvidable en el estadio José María ' +
  'Minella y ahora quedan a dos puntos de la punta del campeonato cuando ' +
  'faltan apenas cuatro fechas para el final de la temporada'

const BAJADA_DE_PALABRA_LARGA =
  'Incontrastablemente superadoras, las de Mar del Plata se trajeron los tres puntos.'

describe('X — el conteo', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })

  it('nunca se pasa de 280 y lo declara', () => {
    const copy = componerCopy('x', {
      nota: nota({ partido: p, bajada: BAJADA_LARGA }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(copy.largo).toBe(largoEnX(copy.texto))
    expect(copy.largo).toBeLessThanOrEqual(LARGO_MAXIMO_X)
    expect(copy.limite).toBe(LARGO_MAXIMO_X)
    expect(copy.entra).toBe(true)
  })

  it('mide el link como 23, así que un slug largo no roba bajada', () => {
    const corta = componerCopy('x', {
      nota: nota({ partido: p, bajada: BAJADA_LARGA, slug: 'a' }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    const larga = componerCopy('x', {
      nota: nota({
        partido: p,
        bajada: BAJADA_LARGA,
        slug: 'tiburonas-2-1-all-boys-fecha-11-primera-b-2026-cronica-del-partido',
      }),
      partido: p,
      urlSitio: URL_SITIO,
    })

    // El slug largo tiene 64 caracteres más y entra exactamente la misma bajada.
    expect(corta.largo).toBe(larga.largo)
    expect(pesoDeTexto(larga.texto)).toBeGreaterThan(pesoDeTexto(corta.texto) + 60)
    expect(largoEnX(larga.texto)).toBeLessThanOrEqual(LARGO_MAXIMO_X)
  })

  it('el peso que declara no es la cantidad de caracteres', () => {
    const copy = componerCopy('x', {
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    // Los emoji suman de a 2 y el link resta 40 y pico: nunca coinciden.
    expect(copy.largo).not.toBe(copy.texto.length)
  })
})

describe('X — el orden de sacrificio', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })
  const conBajada = (bajada: string) =>
    componerCopy('x', { nota: nota({ partido: p, bajada }), partido: p, urlSitio: URL_SITIO })

  it('con todo lo que entra, no sacrifica nada', () => {
    const copy = conBajada('Ganó con goles de Cortadi y Garro.')
    expect(copy.texto).toContain("⚽ Cortadi 23', Garro 61' (p)")
    expect(copy.texto).toContain('Ganó con goles de Cortadi y Garro.')
    expect(copy.recortado).toBe(false)
  })

  it('1º se cae la línea de datos, entera, antes de tocar la bajada', () => {
    // 161 de bajada: no entra con las goleadoras (148) y sí sin ellas (178).
    // La bajada explica de qué se trata; las goleadoras están en la nota.
    const copy = conBajada(BAJADA_ENTRE_148_Y_178)

    expect(copy.texto).not.toContain('Cortadi')
    expect(copy.texto).toContain(BAJADA_ENTRE_148_Y_178)
    expect(copy.texto).not.toContain('…')
    expect(copy.recortado).toBe(true)
    expect(copy.largo).toBeLessThanOrEqual(LARGO_MAXIMO_X)
  })

  it('2º recién ahí se recorta la bajada, y la línea de datos ya no está', () => {
    const copy = conBajada(BAJADA_LARGA)

    expect(copy.texto).not.toContain('Cortadi 23')
    expect(copy.texto).toContain('…')
    expect(copy.texto).toContain('El equipo de Mar del Plata')
    expect(copy.recortado).toBe(true)
    expect(copy.largo).toBeLessThanOrEqual(LARGO_MAXIMO_X)
  })

  it('3º si no entra ni una palabra, la bajada se va entera', () => {
    const copy = componerCopy('x', {
      nota: nota({
        titulo: TITULO_QUE_NO_DEJA_LUGAR,
        bajada: BAJADA_DE_PALABRA_LARGA,
        partido: null,
      }),
      urlSitio: URL_SITIO,
    })

    // Ni "Incontrastablemente" sola entra en los 16 que quedan: antes que
    // publicar media palabra, el bloque se va completo.
    expect(copy.texto).not.toContain('Incontrastablemente')
    expect(copy.texto).not.toContain('…')
    expect(copy.recortado).toBe(true)
    expect(copy.entra).toBe(true)
    expect(copy.largo).toBeLessThanOrEqual(LARGO_MAXIMO_X)
  })

  it('nunca toca el título ni el link, en ninguno de los escalones', () => {
    const link = `${URL_SITIO}/nota/tiburonas-all-boys`

    for (const bajada of ['Corto.', BAJADA_ENTRE_148_Y_178, BAJADA_LARGA, '']) {
      const copy = componerCopy('x', {
        nota: nota({ titulo: TITULO_QUE_NO_DEJA_LUGAR, bajada, partido: null }),
        urlSitio: URL_SITIO,
      })
      expect(copy.texto).toContain(TITULO_QUE_NO_DEJA_LUGAR)
      expect(copy.texto).toContain(link)
    }
  })

  it('avisa con entra:false cuando ni el título con el link entran en 280', () => {
    const copy = componerCopy('x', {
      nota: nota({ titulo: 'x'.repeat(400), bajada: 'Algo', partido: null }),
      urlSitio: URL_SITIO,
    })
    expect(copy.entra).toBe(false)
    expect(copy.largo).toBeGreaterThan(LARGO_MAXIMO_X)
  })

  it('no se declara recortado cuando la nota simplemente no tiene bajada', () => {
    const copy = componerCopy('x', {
      nota: nota({ bajada: '', partido: null }),
      urlSitio: URL_SITIO,
    })
    expect(copy.recortado).toBe(false)
    expect(copy.texto).not.toContain('\n\n\n')
  })

  it('el recorte de la bajada corta por palabra', () => {
    const copy = conBajada(BAJADA_LARGA)
    const recortada = copy.texto.split('\n\n')[1]
    const contenido = recortada.slice(0, -1)

    expect(recortada.endsWith('…')).toBe(true)
    expect(BAJADA_LARGA.startsWith(contenido)).toBe(true)
    expect(BAJADA_LARGA[contenido.length]).toBe(' ')
  })
})

// ============================================
// Instagram
// ============================================

describe('Instagram', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })
  const copy = componerCopy('instagram', {
    nota: nota({ partido: p }),
    partido: p,
    urlSitio: URL_SITIO,
  })

  it('no lleva link: en el caption no es clickeable', () => {
    expect(copy.texto).not.toContain('http')
    expect(copy.texto).not.toContain('🔗')
    expect(copy.texto).not.toContain('/nota/')
  })

  it('deja el dominio pelado, que es lo que alguien tipea si le interesó', () => {
    expect(copy.texto).toContain('Nota completa en periodicodelfos.com')
  })

  it('sirve igual sin el link: marcador, goleadoras, bajada y hashtags', () => {
    expect(copy.texto).toContain('⚽ Fecha 11 · Aldosivi 2-1 All Boys')
    expect(copy.texto).toContain("⚽ Cortadi 23', Garro 61' (p)")
    expect(copy.texto).toContain('El equipo de Mar del Plata sumó de a tres')
    expect(copy.texto).toContain('#Aldosivi')
    expect(copy.entra).toBe(true)
    expect(copy.recortado).toBe(false)
  })

  it('no recorta una bajada que en X no habría entrado', () => {
    // 2200 contra 280: lo que X sacrifica, Instagram lo publica entero.
    const largo = componerCopy('instagram', {
      nota: nota({ partido: p, bajada: BAJADA_LARGA }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(largo.texto).toContain(BAJADA_LARGA)
    expect(largo.recortado).toBe(false)
  })

  it('recorta a 2200 cuando la bajada es absurda, y lo declara', () => {
    const desmedida = componerCopy('instagram', {
      nota: nota({ partido: p, bajada: 'palabra '.repeat(400).trim() }),
      partido: p,
      urlSitio: URL_SITIO,
    })
    expect(desmedida.largo).toBeLessThanOrEqual(2200)
    expect(desmedida.entra).toBe(true)
    expect(desmedida.recortado).toBe(true)
    expect(desmedida.texto).toContain('…')
  })

  it('aguanta un urlSitio mal formado sin romperse', () => {
    const roto = componerCopy('instagram', {
      nota: nota({ partido: null }),
      urlSitio: 'no-es-una-url',
    })
    expect(roto.texto).toContain('Nota completa en')
    expect(roto.entra).toBe(true)
  })
})

// ============================================
// Facebook y la puerta de entrada
// ============================================

describe('Facebook', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })
  const copy = componerCopy('facebook', {
    nota: nota({ partido: p, bajada: BAJADA_LARGA }),
    partido: p,
    urlSitio: URL_SITIO,
  })

  it('lleva todo: no tiene por qué sacrificar nada', () => {
    expect(copy.texto).toContain("⚽ Cortadi 23', Garro 61' (p)")
    expect(copy.texto).toContain(BAJADA_LARGA)
    expect(copy.recortado).toBe(false)
    expect(copy.entra).toBe(true)
  })

  it('lleva el link con 🔗 y los hashtags al final', () => {
    expect(copy.texto).toContain(`🔗 ${URL_SITIO}/nota/tiburonas-all-boys`)
    expect(copy.texto.endsWith(HASHTAGS.join(' '))).toBe(true)
  })
})

describe('componerTodos', () => {
  const p = partido({ golesAldosivi: 2, golesRival: 1, eventos: GOLES })
  const todos = componerTodos({
    nota: nota({ partido: p, bajada: BAJADA_LARGA }),
    partido: p,
    urlSitio: URL_SITIO,
  })

  it('devuelve las tres redes, cada una con su red declarada', () => {
    expect(todos.facebook.red).toBe('facebook')
    expect(todos.instagram.red).toBe('instagram')
    expect(todos.x.red).toBe('x')
  })

  it('las tres entran en su límite', () => {
    for (const copy of Object.values(todos)) {
      expect(copy.entra).toBe(true)
      expect(copy.largo).toBeLessThanOrEqual(copy.limite)
    }
  })

  it('las tres abren con el mismo marcador', () => {
    for (const copy of Object.values(todos)) {
      expect(copy.texto.startsWith('⚽ Fecha 11 · Aldosivi 2-1 All Boys')).toBe(true)
    }
  })

  it('ignora la barra final del urlSitio en vez de duplicarla', () => {
    const conBarra = componerTodos({
      nota: nota({ partido: p }),
      partido: p,
      urlSitio: `${URL_SITIO}///`,
    })
    expect(conBarra.facebook.texto).toContain(`${URL_SITIO}/nota/`)
    expect(conBarra.facebook.texto).not.toContain('//nota/')
  })
})
