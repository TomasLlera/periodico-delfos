import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `GET /api/notas` y `POST /api/notas`, un test por código del contrato.
 *
 * Los dos casos que esta suite existe para fijar:
 *
 * - **Una búsqueda sin coincidencias es 200 con `[]`.** No es un error y no es
 *   un 404. Es el que alguien cambia por error al leer los 404 de al lado.
 * - **El POST crea siempre un borrador.** Si alguna vez acepta publicar,
 *   dispararía el auto-posteo a las tres redes desde un pedido sin
 *   confirmación, y eso se afirma explícitamente acá abajo.
 */

let resultadosBusqueda: unknown[] = []
let excepcionBusqueda: unknown = null

let respuestaInsert: { data: unknown; error: { code?: string; message: string } | null }
let excepcionInsert: unknown = null
const insertarNota = vi.fn()

let usuario: { id: string } | null = null
let autor: { id: string; firma_como: string | null } | null = null
let excepcionSesion: unknown = null

vi.mock('@/lib/supabase/queries/notas', () => ({
  buscarNotas: async () => {
    if (excepcionBusqueda) throw excepcionBusqueda
    return resultadosBusqueda
  },
  insertarNota: async (fila: unknown) => {
    insertarNota(fila)
    if (excepcionInsert) throw excepcionInsert
    return respuestaInsert
  },
}))

vi.mock('@/lib/supabase/queries/autores', () => ({
  getAutorDeLaSesion: async () => {
    if (excepcionSesion) throw excepcionSesion
    return autor
  },
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => {
        if (excepcionSesion) throw excepcionSesion
        return { data: { user: usuario } }
      },
    },
  }),
}))

const { GET, POST } = await import('@/app/api/notas/route')

const NOTA_VALIDA = {
  titulo: 'Las Tiburonas ganaron el clásico',
  slug: 'las-tiburonas-ganaron-el-clasico',
  bajada: 'Una bajada de prueba, que es obligatoria.',
  cuerpo: { type: 'doc', content: [] },
  imagen_portada: null,
  imagen_alt: '',
  imagen_credito: null,
  categoria: 'cronica',
  temporada_id: null,
  partido_id: null,
  destacada: false,
  auto_post: false,
  redes: [],
  publicada_en: null,
}

function buscar(q?: string): Promise<Response> {
  const url = q === undefined ? 'http://localhost/api/notas' : `http://localhost/api/notas?q=${encodeURIComponent(q)}`
  return GET(new Request(url))
}

function crear(cuerpo: unknown, crudo?: string): Promise<Response> {
  return POST(
    new Request('http://localhost/api/notas', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: crudo ?? JSON.stringify(cuerpo),
    }),
  )
}

beforeEach(() => {
  resultadosBusqueda = []
  excepcionBusqueda = null
  excepcionInsert = null
  excepcionSesion = null
  insertarNota.mockClear()
  respuestaInsert = { data: { id: 'n-1', slug: NOTA_VALIDA.slug, estado: 'borrador' }, error: null }
  usuario = { id: 'u-1' }
  autor = { id: 'a-1', firma_como: null }
})

describe('GET /api/notas', () => {
  it('200 con la lista cuando hay coincidencias', async () => {
    resultadosBusqueda = [{ id: 'n-1', titulo: 'Una nota' }]

    const r = await buscar('tiburonas')

    expect(r.status).toBe(200)
    expect(await r.json()).toHaveLength(1)
  })

  /**
   * **Que no haya resultados no es un error.** El recurso existe, la consulta
   * fue válida y la respuesta informa que no hay nada. Un 404 acá sería
   * incorrecto y además sacaría la búsqueda del índice.
   */
  it('200 con [] cuando no hay coincidencias, y no 404', async () => {
    resultadosBusqueda = []

    const r = await buscar('zzzzzzzzzzzz')

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual([])
  })

  it('400 si la búsqueda es más corta que el mínimo', async () => {
    const r = await buscar('a')

    expect(r.status).toBe(400)
    expect((await r.json()).error.codigo).toBe('datos_invalidos')
  })

  it('400 si no viene el parámetro q', async () => {
    expect((await buscar()).status).toBe(400)
  })

  it('503 con Retry-After si la base no responde, y nunca 500', async () => {
    excepcionBusqueda = new Error('Supabase falló en buscarNotas: fetch failed')

    const r = await buscar('tiburonas')

    expect(r.status).toBe(503)
    expect(r.headers.get('Retry-After')).toBe('30')
  })
})

describe('POST /api/notas', () => {
  it('201 y devuelve la nota con su id', async () => {
    const r = await crear(NOTA_VALIDA)

    expect(r.status).toBe(201)
    expect(await r.json()).toMatchObject({ id: 'n-1' })
  })

  /**
   * **La afirmación que protege el auto-posteo.** Publicar emite
   * `nota/publicada` a Inngest y eso postea a Facebook, Instagram y X. Esta
   * ruta no puede hacerlo, aunque el cuerpo lo pida.
   */
  it('crea siempre como borrador, aunque el cuerpo diga otra cosa', async () => {
    await crear({ ...NOTA_VALIDA, estado: 'publicada', publicada_en: '2026-11-12T10:00:00Z' })

    expect(insertarNota).toHaveBeenCalledWith(
      expect.objectContaining({ estado: 'borrador', autor_id: 'a-1' }),
    )
  })

  it('401 sin sesión', async () => {
    usuario = null

    const r = await crear(NOTA_VALIDA)

    expect(r.status).toBe(401)
    expect((await r.json()).error.codigo).toBe('sin_sesion')
  })

  /**
   * Tener sesión de Supabase Auth no es lo mismo que ser autor: el panel exige
   * fila en `autores`, igual que `es_autor()` en RLS. Son dos hechos distintos
   * y por eso son dos códigos distintos.
   */
  it('403 con sesión pero sin fila en autores', async () => {
    autor = null

    const r = await crear(NOTA_VALIDA)

    expect(r.status).toBe(403)
    expect((await r.json()).error.codigo).toBe('sin_permiso')
  })

  it('400 si falta el título', async () => {
    const { titulo: _titulo, ...sinTitulo } = NOTA_VALIDA

    expect((await crear(sinTitulo)).status).toBe(400)
  })

  it('400 si hay imagen y el alt está vacío (regla no negociable 4)', async () => {
    const r = await crear({ ...NOTA_VALIDA, imagen_portada: 'https://x/y.jpg', imagen_alt: '' })

    expect(r.status).toBe(400)
    expect((await r.json()).error.mensaje).toContain('alternativo')
  })

  it('400 si el cuerpo no es JSON', async () => {
    expect((await crear(null, 'esto no es json')).status).toBe(400)
  })

  it('409 si el slug ya existe', async () => {
    respuestaInsert = { data: null, error: { code: '23505', message: 'duplicate key' } }

    const r = await crear(NOTA_VALIDA)

    expect(r.status).toBe(409)
    expect((await r.json()).error.mensaje).toContain('slug')
  })

  it('503 si la base no responde al insertar, y nunca 500', async () => {
    excepcionInsert = new Error('fetch failed')

    expect((await crear(NOTA_VALIDA)).status).toBe(503)
  })

  it('503 si la base no responde al resolver quién llama', async () => {
    excepcionSesion = new Error('fetch failed')

    expect((await crear(NOTA_VALIDA)).status).toBe(503)
  })
})
