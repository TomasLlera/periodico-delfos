import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { urlDelSitio } from '@/lib/sitio'

/**
 * El caso que voltea el build no es el de la variable ausente sino el de la
 * variable **vacía**, y por eso está testeado: un `?? 'http://localhost:3000'`
 * lo deja pasar, llega `''` a `new URL('')` y el build se cae con un error que
 * habla de `/_not-found` y no nombra la variable. Pasó en el primer deploy a
 * Vercel.
 */
describe('urlDelSitio', () => {
  const previo = {
    sitio: process.env.NEXT_PUBLIC_SITE_URL,
    vercel: process.env.VERCEL_URL,
    produccion: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  }

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.VERCEL_URL
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = previo.sitio
    process.env.VERCEL_URL = previo.vercel
    process.env.VERCEL_PROJECT_PRODUCTION_URL = previo.produccion
  })

  it('usa la variable cuando está cargada', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://periodicodelfos.com'

    expect(urlDelSitio()).toBe('https://periodicodelfos.com')
  })

  it('le saca la barra final, que duplicaría las de cada URL armada', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://periodicodelfos.com/'

    expect(urlDelSitio()).toBe('https://periodicodelfos.com')
  })

  it('trata la variable vacía como no cargada', () => {
    // El caso de Vercel: definida al importar un `.env.example`, sin valor.
    process.env.NEXT_PUBLIC_SITE_URL = ''

    expect(urlDelSitio()).toBe('http://localhost:3000')
  })

  it('trata la variable en blanco como no cargada', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '   '

    expect(urlDelSitio()).toBe('http://localhost:3000')
  })

  it('cae a VERCEL_URL, y le pone el protocolo que no trae', () => {
    process.env.NEXT_PUBLIC_SITE_URL = ''
    process.env.VERCEL_URL = 'periodico-delfos-abc123.vercel.app'

    expect(urlDelSitio()).toBe('https://periodico-delfos-abc123.vercel.app')
  })

  it('el dominio estable del proyecto le gana a la URL del deploy', () => {
    // `VERCEL_URL` cambia en cada push: si ganara ella, cada deploy publicaría
    // canonical distintas y lo que Google cacheó quedaría colgado de una URL
    // que ya no existe. Pasó en el primer deploy que anduvo.
    process.env.VERCEL_URL = 'periodico-delfos-pmyw34e8y-tomaslleras-projects.vercel.app'
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'periodico-delfos.vercel.app'

    expect(urlDelSitio()).toBe('https://periodico-delfos.vercel.app')
  })

  it('la variable propia le gana a VERCEL_URL', () => {
    // El día que haya dominio propio, la URL de Vercel sigue existiendo y sigue
    // respondiendo: si ganara ella, las canonical apuntarían al lugar equivocado.
    process.env.NEXT_PUBLIC_SITE_URL = 'https://periodicodelfos.com'
    process.env.VERCEL_URL = 'periodico-delfos-abc123.vercel.app'

    expect(urlDelSitio()).toBe('https://periodicodelfos.com')
  })

  it('cae a localhost cuando no hay ninguna', () => {
    expect(urlDelSitio()).toBe('http://localhost:3000')
  })
})
