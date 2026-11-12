import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * `POST /api/auth/login`, un test por código del contrato.
 *
 * **Es la ruta que justifica el cambio entero.** El Server Action del panel
 * responde 200 tanto si entrás como si no, así que no hay nada que afirmar
 * sobre el protocolo. Acá cada situación tiene su número, y estos tests son los
 * que impiden que vuelvan a colapsar en uno solo.
 *
 * Supabase Auth se reemplaza por un doble: lo que se prueba es la traducción de
 * su respuesta a un código HTTP, no Supabase.
 */

interface RespuestaAuth {
  data: { user: { id: string; email: string } } | { user: null }
  error: { status?: number; code?: string; message: string } | null
}

let respuesta: RespuestaAuth
/** Para el caso en que el fetch ni sale y `signInWithPassword` tira. */
let excepcion: unknown = null

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: async () => {
        if (excepcion) throw excepcion
        return respuesta
      },
    },
  }),
}))

const { POST } = await import('@/app/api/auth/login/route')

function pedido(cuerpo: unknown, crudo?: string): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: crudo ?? JSON.stringify(cuerpo),
  })
}

const CORRECTAS = { email: 'prueba@periodicodelfos.com', password: 'una-contrasena' }

beforeEach(() => {
  excepcion = null
  respuesta = {
    data: { user: { id: 'u-1', email: CORRECTAS.email } },
    error: null,
  }
})

describe('POST /api/auth/login', () => {
  it('200 cuando las credenciales son correctas', async () => {
    const r = await POST(pedido(CORRECTAS))

    expect(r.status).toBe(200)
    expect(await r.json()).toEqual({ usuario: { id: 'u-1', email: CORRECTAS.email } })
  })

  it('400 si el cuerpo no es JSON', async () => {
    const r = await POST(pedido(null, 'esto no es json'))

    expect(r.status).toBe(400)
    expect((await r.json()).error.codigo).toBe('datos_invalidos')
  })

  it('400 si falta la contraseña', async () => {
    const r = await POST(pedido({ email: CORRECTAS.email }))

    expect(r.status).toBe(400)
  })

  it('400 si falta el mail', async () => {
    expect((await POST(pedido({ password: 'x' }))).status).toBe(400)
  })

  /**
   * **Un mail mal escrito es 400 y no 401**, y la diferencia importa: el 401
   * dice "probá con otras credenciales" y el 400 dice "así no se pide". Un
   * cliente que los confunde reintenta lo que nunca va a andar.
   */
  it('400 si el mail no tiene formato de mail', async () => {
    const r = await POST(pedido({ email: 'sin-arroba', password: 'x' }))

    expect(r.status).toBe(400)
    expect((await r.json()).error.mensaje).toContain('formato')
  })

  it('401 con la contraseña equivocada, aunque Supabase conteste 400', async () => {
    respuesta = {
      data: { user: null },
      error: { status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' },
    }

    const r = await POST(pedido(CORRECTAS))

    expect(r.status).toBe(401)
    expect((await r.json()).error.codigo).toBe('credenciales_invalidas')
  })

  /**
   * El mismo cuerpo, byte por byte, que el de la contraseña equivocada.
   * Distinguirlos le confirmaría a cualquiera qué mails tienen cuenta.
   */
  it('401 con un mail sin cuenta, y el mismo mensaje', async () => {
    respuesta = {
      data: { user: null },
      error: { status: 400, code: 'invalid_credentials', message: 'Invalid login credentials' },
    }
    const conMailInexistente = await (await POST(pedido({ ...CORRECTAS, email: 'nadie@x.com' }))).json()

    respuesta = {
      data: { user: null },
      error: { status: 400, code: 'user_not_found', message: 'User not found' },
    }
    const conUsuarioInexistente = await (await POST(pedido(CORRECTAS))).json()

    expect(conUsuarioInexistente).toEqual(conMailInexistente)
  })

  it('429 cuando Supabase corta por demasiados intentos', async () => {
    respuesta = {
      data: { user: null },
      error: { status: 429, code: 'over_request_rate_limit', message: 'Too many requests' },
    }

    const r = await POST(pedido(CORRECTAS))

    expect(r.status).toBe(429)
    expect((await r.json()).error.codigo).toBe('demasiados_intentos')
  })

  it('503 cuando Auth no responde, y nunca 500', async () => {
    respuesta = { data: { user: null }, error: { status: 0, message: 'Failed to fetch' } }

    expect((await POST(pedido(CORRECTAS))).status).toBe(503)
  })

  it('503 también si signInWithPassword tira en vez de devolver error', async () => {
    excepcion = new Error('fetch failed')

    expect((await POST(pedido(CORRECTAS))).status).toBe(503)
  })
})
