import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Lo que importa de `exigir()` es que las queries de verdad lo usen: que una
 * base caída llegue a la página como una excepción —y Next siga sirviendo la
 * copia buena— en vez de como una lista vacía.
 *
 * El cliente de Supabase se reemplaza por un builder que acepta cualquier
 * cadena (`.from().select().eq()...`) y al final resuelve lo que diga el test.
 */

let respuesta: { data: unknown; error: { message: string; code?: string } | null }

function builder(): unknown {
  return new Proxy(
    {},
    {
      get: (_, prop) =>
        prop === 'then'
          ? (resolver: (r: typeof respuesta) => unknown) => resolver(respuesta)
          : () => builder(),
    },
  )
}

vi.mock('@/lib/supabase/server', () => ({
  createStaticClient: () => builder(),
  createClient: async () => builder(),
  haySupabase: () => true,
}))
// admin.ts importa `server-only`, que fuera de Next tira al importarse.
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => builder() }))

const { getUltimasNotas, getNotaPrincipal } = await import('@/lib/supabase/queries/notas')

describe('las queries de notas con la base caída', () => {
  beforeEach(() => {
    respuesta = { data: null, error: null }
  })

  it('getUltimasNotas tira en vez de devolver una portada vacía', async () => {
    respuesta = { data: null, error: { message: 'fetch failed' } }
    await expect(getUltimasNotas()).rejects.toThrow('Supabase falló en getUltimasNotas: fetch failed')
  })

  it('getNotaPrincipal tira en vez de decir que no hay tapa', async () => {
    respuesta = { data: null, error: { message: 'timeout', code: '57014' } }
    await expect(getNotaPrincipal()).rejects.toThrow('getNotaPrincipal (57014)')
  })

  it('sin error, devuelve lo mismo que antes', async () => {
    respuesta = { data: [{ id: 'a' }], error: null }
    await expect(getUltimasNotas()).resolves.toEqual([{ id: 'a' }])
  })

  it('sin filas y sin error no es una falla: lista vacía y tapa null', async () => {
    respuesta = { data: null, error: null }
    await expect(getUltimasNotas()).resolves.toEqual([])
    await expect(getNotaPrincipal()).resolves.toBeNull()
  })
})
