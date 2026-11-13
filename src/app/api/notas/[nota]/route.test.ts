import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoNota } from '@/actions/notas'

/**
 * `GET`, `PUT` y `DELETE` de `/api/notas/[nota]`, un test por código.
 *
 * Los tres casos que esta suite existe para fijar:
 *
 * - **El 404 del GET es el mismo para un slug inventado y para un borrador.**
 *   Si alguien "mejora" el mensaje para decir cuál de los dos fue, se pone
 *   rojo: distinguirlos delataría qué se está escribiendo.
 * - **Editar es 200, no 201.** No nace nada: cambia lo que ya estaba.
 * - **Borrar algo que no existe es 404**, no un 200 con el aviso adentro.
 */

let nota: unknown = null
let excepcionGet: unknown = null

let resultadoGuardar: ResultadoNota
let resultadoBorrar: ResultadoNota
let excepcionAccion: unknown = null

vi.mock('@/lib/supabase/queries/notas', () => ({
  getNotaPorSlug: async () => {
    if (excepcionGet) throw excepcionGet
    return nota
  },
}))

vi.mock('@/actions/notas', () => ({
  guardarNota: async () => {
    if (excepcionAccion) throw excepcionAccion
    return resultadoGuardar
  },
  borrarNota: async () => {
    if (excepcionAccion) throw excepcionAccion
    return resultadoBorrar
  },
}))

const { GET, PUT, DELETE } = await import('@/app/api/notas/[nota]/route')

const NOTA_VALIDA = { titulo: 'Una nota', slug: 'una-nota' }

function contexto(valor: string) {
  return { params: Promise.resolve({ nota: valor }) }
}

function leer(slug: string): Promise<Response> {
  return GET(new Request(`http://localhost/api/notas/${slug}`), contexto(slug))
}

function editar(id: string, cuerpo: unknown, crudo?: string): Promise<Response> {
  return PUT(
    new Request(`http://localhost/api/notas/${id}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: crudo ?? JSON.stringify(cuerpo),
    }),
    contexto(id),
  )
}

function borrar(id: string): Promise<Response> {
  return DELETE(new Request(`http://localhost/api/notas/${id}`, { method: 'DELETE' }), contexto(id))
}

beforeEach(() => {
  nota = null
  excepcionGet = null
  excepcionAccion = null
  resultadoGuardar = { id: 'n-1', slug: 'una-nota' }
  resultadoBorrar = {}
})

describe('GET /api/notas/[nota]', () => {
  it('200 con la nota publicada', async () => {
    nota = { id: 'n-1', slug: 'una-nota', estado: 'publicada' }

    const r = await leer('una-nota')

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ slug: 'una-nota' })
  })

  it('404 si el slug no existe', async () => {
    const r = await leer('esta-nota-no-existe')

    expect(r.status).toBe(404)
    expect((await r.json()).error.codigo).toBe('no_encontrada')
  })

  it('404 con el mismo cuerpo si la nota está en borrador', async () => {
    const borradorr = await (await leer('un-borrador')).json()
    const inexistente = await (await leer('no-existe')).json()

    expect(borradorr).toEqual(inexistente)
  })

  it('503 con Retry-After si la base no responde, y nunca 500', async () => {
    excepcionGet = new Error('Supabase falló en getNotaPorSlug: fetch failed')

    const r = await leer('una-nota')

    expect(r.status).toBe(503)
    expect(r.headers.get('Retry-After')).toBe('30')
  })
})

describe('PUT /api/notas/[nota]', () => {
  /**
   * **200 y no 201.** Editar no crea nada. El 201 es de `POST /api/notas`
   * (nace la nota) y de `POST /api/publicaciones` (nace la nota pública).
   */
  it('200 al editar una nota que ya existe', async () => {
    const r = await editar('n-1', NOTA_VALIDA)

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ id: 'n-1' })
  })

  it('400 si el cuerpo no es JSON', async () => {
    expect((await editar('n-1', null, 'esto no es json')).status).toBe(400)
  })

  it('400 si faltan datos, con el detalle de qué falta', async () => {
    resultadoGuardar = {
      error: 'Faltan datos',
      motivos: ['El título no puede quedar vacío'],
      codigo: 'datos_invalidos',
    }

    const r = await editar('n-1', {})

    expect(r.status).toBe(400)
    expect((await r.json()).error.mensaje).toContain('El título no puede quedar vacío')
  })

  it('401 sin sesión', async () => {
    resultadoGuardar = { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

    const r = await editar('n-1', NOTA_VALIDA)

    expect(r.status).toBe(401)
    expect((await r.json()).error.codigo).toBe('sin_sesion')
  })

  it('404 si esa nota no existe o no es tuya', async () => {
    resultadoGuardar = { error: 'Esa nota no existe, o no es tuya.', codigo: 'no_encontrada' }

    const r = await editar('n-9', NOTA_VALIDA)

    expect(r.status).toBe(404)
  })

  it('409 si el slug ya lo tiene otra nota', async () => {
    resultadoGuardar = { error: 'Ya existe una nota con ese slug', codigo: 'slug_duplicado' }

    const r = await editar('n-1', NOTA_VALIDA)

    expect(r.status).toBe(409)
    expect((await r.json()).error.codigo).toBe('conflicto')
  })

  it('503 con la base caída, y nunca 500', async () => {
    resultadoGuardar = { error: 'El servicio no está disponible.', codigo: 'no_disponible' }

    const r = await editar('n-1', NOTA_VALIDA)

    expect(r.status).toBe(503)
    expect(r.headers.get('Retry-After')).toBe('30')
  })

  it('503 si el action tira en vez de devolver un resultado', async () => {
    excepcionAccion = new Error('fetch failed')

    expect((await editar('n-1', NOTA_VALIDA)).status).toBe(503)
  })
})

describe('DELETE /api/notas/[nota]', () => {
  it('200 al borrar', async () => {
    const r = await borrar('n-1')

    expect(r.status).toBe(200)
    expect(await r.json()).toMatchObject({ id: 'n-1' })
  })

  it('401 sin sesión', async () => {
    resultadoBorrar = { error: 'Se cerró la sesión. Entrá de nuevo.', codigo: 'sin_sesion' }

    expect((await borrar('n-1')).status).toBe(401)
  })

  /**
   * Antes esto era un 200 con "no se borró" adentro del cuerpo: desde afuera,
   * borrar y no borrar eran la misma respuesta.
   */
  it('404 si la nota ya no existe o no es tuya', async () => {
    resultadoBorrar = {
      error: 'No se borró: la nota ya no existe, o no es tuya.',
      codigo: 'no_encontrada',
    }

    const r = await borrar('n-9')

    expect(r.status).toBe(404)
    expect((await r.json()).error.codigo).toBe('no_encontrada')
  })

  it('503 con la base caída, y nunca 500', async () => {
    resultadoBorrar = { error: 'El servicio no está disponible.', codigo: 'no_disponible' }

    expect((await borrar('n-1')).status).toBe(503)
  })
})
