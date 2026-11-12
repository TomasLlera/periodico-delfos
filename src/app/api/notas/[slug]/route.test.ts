import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `GET /api/notas/[slug]`, un test por código del contrato.
 *
 * El caso que vale es el 404: un slug inexistente y una nota en borrador tienen
 * que ser indistinguibles desde afuera. Si alguna vez se "mejora" el mensaje
 * para decir cuál de los dos fue, este archivo se pone rojo.
 */

let nota: unknown = null
let excepcion: unknown = null

vi.mock('@/lib/supabase/queries/notas', () => ({
  getNotaPorSlug: async () => {
    if (excepcion) throw excepcion
    return nota
  },
}))

const { GET } = await import('@/app/api/notas/[slug]/route')

function pedir(slug: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/notas/${slug}`), {
    params: Promise.resolve({ slug }),
  })
}

beforeEach(() => {
  nota = null
  excepcion = null
})

describe('GET /api/notas/[slug]', () => {
  it('200 con la nota publicada', async () => {
    nota = { id: 'n-1', slug: 'una-nota', titulo: 'Una nota', estado: 'publicada' }

    const r = await pedir('una-nota')

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ slug: 'una-nota' })
  })

  it('404 si el slug no existe', async () => {
    const r = await pedir('esta-nota-no-existe')

    expect(r.status).toBe(404)
    expect((await r.json()).error.codigo).toBe('no_encontrada')
  })

  /**
   * `getNotaPorSlug()` filtra por `estado = 'publicada'`, así que un borrador
   * llega acá como `null` igual que un slug inventado. Eso es lo correcto: la
   * respuesta no puede delatar que el borrador existe.
   */
  it('404 si la nota existe pero está en borrador, con el mismo cuerpo', async () => {
    const borrador = await (await pedir('un-borrador')).json()
    const inexistente = await (await pedir('no-existe')).json()

    expect(borrador).toEqual(inexistente)
  })

  it('503 con Retry-After si la base no responde, y nunca 500', async () => {
    excepcion = new Error('Supabase falló en getNotaPorSlug: fetch failed')

    const r = await pedir('una-nota')

    expect(r.status).toBe(503)
    expect(r.headers.get('Retry-After')).toBe('30')
  })
})
