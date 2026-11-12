import { describe, expect, it, vi } from 'vitest'
import {
  ERRORES,
  cuerpoDeError,
  esErrorDeRed,
  mapearErrorDeAuth,
  mapearErrorSupabase,
  respuestaDeError,
} from '@/lib/api/errores'

/**
 * La traducción de lo que falla a un código HTTP.
 *
 * **Es la pieza que decide si la API cumple el criterio de la clase 8**, así
 * que se prueba sola y no sólo a través de las rutas: cada código tiene que
 * salir del hecho que le corresponde, y sobre todo **ningún error previsible
 * puede terminar en 500**.
 */

describe('el formato del cuerpo', () => {
  it('es siempre { error: { codigo, mensaje } }', () => {
    expect(cuerpoDeError(ERRORES.sinSesion())).toEqual({
      error: { codigo: 'sin_sesion', mensaje: 'Necesitás iniciar sesión para hacer esto.' },
    })
  })

  it('el mensaje está en español y la respuesta lleva el estado', async () => {
    const respuesta = respuestaDeError(ERRORES.demasiadosIntentos())

    expect(respuesta.status).toBe(429)
    expect(await respuesta.json()).toEqual({
      error: {
        codigo: 'demasiados_intentos',
        mensaje: 'Demasiados intentos seguidos. Esperá un momento y probá de nuevo.',
      },
    })
  })

  it('deja poner Retry-After, que es lo que vuelve útil a un 503', () => {
    const respuesta = respuestaDeError(ERRORES.servicioNoDisponible(), { 'Retry-After': '30' })

    expect(respuesta.status).toBe(503)
    expect(respuesta.headers.get('Retry-After')).toBe('30')
  })
})

describe('reconocer que el otro lado no contestó', () => {
  it.each([
    ['un fetch que no salió', new Error('fetch failed')],
    ['un timeout', new Error('Connection timed out')],
    ['un código de libuv', { code: 'ECONNREFUSED', message: 'connect ECONNREFUSED' }],
    ['una pasarela caída', { status: 503, message: 'Service Unavailable' }],
    ['un AuthRetryableFetchError', { status: 0, message: 'Failed to fetch' }],
  ])('%s es un error de red', (_caso, error) => {
    expect(esErrorDeRed(error)).toBe(true)
  })

  it('un error de Postgres no es un error de red', () => {
    expect(esErrorDeRed({ code: '23505', message: 'duplicate key' })).toBe(false)
  })
})

describe('los errores de Postgres, traducidos', () => {
  it('23505 (unique) es 409', () => {
    const error = mapearErrorSupabase({ code: '23505', message: 'duplicate key' }, { haySesion: true })

    expect(error.estado).toBe(409)
    expect(error.codigo).toBe('conflicto')
  })

  it('23514 (check) es 400 y no 500', () => {
    expect(
      mapearErrorSupabase({ code: '23514', message: 'minuto_valido' }, { haySesion: true }).estado,
    ).toBe(400)
  })

  it.each(['22007', '22008'])('%s (fecha inválida) es 400', (codigo) => {
    expect(mapearErrorSupabase({ code: codigo, message: 'bad date' }, { haySesion: true }).estado).toBe(400)
  })

  /**
   * El único caso ambiguo, y el que justifica el parámetro: el mismo código de
   * Postgres significa dos cosas distintas según haya sesión o no, y lo que
   * tiene que hacer quien llama también es distinto.
   */
  it('42501 (RLS) es 403 con sesión y 401 sin sesión', () => {
    const rls = { code: '42501', message: 'row-level security' }

    expect(mapearErrorSupabase(rls, { haySesion: true }).estado).toBe(403)
    expect(mapearErrorSupabase(rls, { haySesion: false }).estado).toBe(401)
  })

  it('la base caída es 503 y no 500', () => {
    expect(mapearErrorSupabase(new Error('fetch failed'), { haySesion: true }).estado).toBe(503)
  })

  /**
   * `exigir()` tira un `Error` de texto con el código entre paréntesis, así que
   * las queries que ya existen pierden la propiedad `code` por el camino.
   * Soportar esa forma es lo que permite reutilizarlas sin reescribirlas.
   */
  it('lee el código del texto que arma exigir()', () => {
    const error = mapearErrorSupabase(
      new Error('Supabase falló en insertarNota (23505): duplicate key'),
      { haySesion: true },
    )

    expect(error.estado).toBe(409)
  })

  it('lo que nadie previó es 500 y queda en el log', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(mapearErrorSupabase({ code: 'XX000', message: 'raro' }, { haySesion: true }).estado).toBe(500)
    expect(log).toHaveBeenCalled()

    log.mockRestore()
  })
})

describe('los errores de Auth, traducidos', () => {
  /**
   * **La decisión que hay que poder defender.** GoTrue responde 400 ante una
   * contraseña incorrecta y reserva el 401 para el token ilegible. La tabla de
   * la materia asigna el 401 a "credenciales inválidas", y esta API se alinea
   * con la tabla.
   */
  it('el 400 de credenciales inválidas se traduce a 401', () => {
    const error = mapearErrorDeAuth({
      status: 400,
      code: 'invalid_credentials',
      message: 'Invalid login credentials',
    })

    expect(error.estado).toBe(401)
    expect(error.codigo).toBe('credenciales_invalidas')
  })

  it('un usuario inexistente da exactamente lo mismo, para no delatar quién tiene cuenta', () => {
    const inexistente = mapearErrorDeAuth({ status: 400, code: 'user_not_found', message: 'x' })
    const equivocada = mapearErrorDeAuth({ status: 400, code: 'invalid_credentials', message: 'y' })

    expect(inexistente).toEqual(equivocada)
  })

  it('el rate limit es 429', () => {
    expect(mapearErrorDeAuth({ status: 429, message: 'too many requests' }).estado).toBe(429)
    expect(
      mapearErrorDeAuth({ status: 400, code: 'over_request_rate_limit', message: 'x' }).estado,
    ).toBe(429)
  })

  it('Auth sin responder es 503', () => {
    expect(mapearErrorDeAuth({ status: 0, message: 'Failed to fetch' }).estado).toBe(503)
  })
})
