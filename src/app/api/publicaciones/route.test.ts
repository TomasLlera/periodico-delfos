import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoNota } from '@/actions/notas'

/**
 * `POST /api/publicaciones`, un test por código del contrato.
 *
 * **Lo que esta suite fija es el 201.** Publicar no es editar: antes de
 * publicarla, `/nota/<slug>` devolvía 404, y después devuelve 200. La petición
 * hace existir un recurso público que no existía, que es exactamente lo que
 * significa 201 Created — y por eso la respuesta tiene que llevar `Location`.
 */

let resultado: ResultadoNota
let excepcion: unknown = null
const publicar = vi.fn()

vi.mock('@/actions/notas', () => ({
  publicarNota: async (datos: unknown, id: string | null, publicadaEn: string | null) => {
    publicar(datos, id, publicadaEn)
    if (excepcion) throw excepcion
    return resultado
  },
}))

const { POST } = await import('@/app/api/publicaciones/route')

const NOTA = { titulo: 'Una nota', slug: 'una-nota' }

function publicarPedido(cuerpo: unknown, crudo?: string): Promise<Response> {
  return POST(
    new Request('http://localhost/api/publicaciones', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: crudo ?? JSON.stringify(cuerpo),
    }),
  )
}

beforeEach(() => {
  excepcion = null
  publicar.mockClear()
  resultado = { id: 'n-1', slug: 'una-nota' }
})

describe('POST /api/publicaciones', () => {
  it('201 con el id y el slug de la nota publicada', async () => {
    const r = await publicarPedido({ id: 'n-1', nota: NOTA, publicada_en: null })

    expect(r.status).toBe(201)
    expect(await r.json()).toEqual({ id: 'n-1', slug: 'una-nota' })
  })

  /** Lo que el 201 pide: dónde quedó lo que se creó. */
  it('201 con Location apuntando a la nota pública', async () => {
    const r = await publicarPedido({ id: 'n-1', nota: NOTA, publicada_en: null })

    expect(r.headers.get('Location')).toBe('/nota/una-nota')
  })

  it('acepta la nota anidada o como cuerpo entero', async () => {
    await publicarPedido({ ...NOTA, id: 'n-1' })

    expect(publicar).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: 'Una nota' }),
      'n-1',
      null,
    )
  })

  it('pasa la fecha de archivo tal cual: es lo que evita postear a las redes', async () => {
    await publicarPedido({ id: 'n-1', nota: NOTA, publicada_en: '2023-04-20T10:00:00.000Z' })

    expect(publicar).toHaveBeenCalledWith(expect.anything(), 'n-1', '2023-04-20T10:00:00.000Z')
  })

  it('400 si el cuerpo no es JSON', async () => {
    expect((await publicarPedido(null, 'esto no es json')).status).toBe(400)
  })

  it('400 si la nota todavía no se puede publicar, y dice qué le falta', async () => {
    resultado = {
      error: 'La nota todavía no se puede publicar',
      motivos: ['Falta la bajada'],
      codigo: 'no_publicable',
    }

    const r = await publicarPedido({ id: 'n-1', nota: NOTA })

    expect(r.status).toBe(400)
    expect((await r.json()).error.mensaje).toContain('Falta la bajada')
  })

  it('400 si la fecha de archivo no sirve', async () => {
    resultado = { error: 'Esa fecha no se puede usar.', codigo: 'fecha_invalida' }

    expect((await publicarPedido({ id: 'n-1', nota: NOTA })).status).toBe(400)
  })

  it('401 sin sesión', async () => {
    resultado = { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

    const r = await publicarPedido({ id: 'n-1', nota: NOTA })

    expect(r.status).toBe(401)
    expect((await r.json()).error.codigo).toBe('sin_sesion')
  })

  it('409 si el slug ya existe', async () => {
    resultado = { error: 'Ya existe una nota con ese slug', codigo: 'slug_duplicado' }

    const r = await publicarPedido({ nota: NOTA })

    expect(r.status).toBe(409)
  })

  it('503 con la base caída, y nunca 500', async () => {
    resultado = { error: 'El servicio no está disponible.', codigo: 'no_disponible' }

    const r = await publicarPedido({ id: 'n-1', nota: NOTA })

    expect(r.status).toBe(503)
    expect(r.headers.get('Retry-After')).toBe('30')
  })

  it('503 si publicarNota tira en vez de devolver un resultado', async () => {
    excepcion = new Error('fetch failed')

    expect((await publicarPedido({ id: 'n-1', nota: NOTA })).status).toBe(503)
  })
})
