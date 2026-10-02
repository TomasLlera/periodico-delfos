import { describe, expect, it } from 'vitest'
import { datosDePosteo } from '@/lib/tiptap/posteo'

/**
 * Lo que se prueba acá es un filtro de seguridad, no un parser de cortesía: la
 * URL que devuelve termina en un `href` del cuerpo de una nota publicada.
 */

describe('datosDePosteo — Instagram', () => {
  it('lee un posteo de la forma corta', () => {
    expect(datosDePosteo('https://www.instagram.com/p/C8xYzAbCdEf/')).toEqual({
      red: 'instagram',
      url: 'https://www.instagram.com/p/C8xYzAbCdEf/',
      usuario: null,
    })
  })

  it('saca el handle cuando la URL lo trae', () => {
    expect(datosDePosteo('https://instagram.com/aldosivi.fem/p/C8xYzAbCdEf/')).toEqual({
      red: 'instagram',
      // El handle no entra en la URL canónica: `/p/CÓDIGO/` resuelve igual y no
      // se rompe si la cuenta se cambia el nombre.
      url: 'https://www.instagram.com/p/C8xYzAbCdEf/',
      usuario: 'aldosivi.fem',
    })
  })

  it('normaliza el plural de los reels, que es lo que reparte la app', () => {
    expect(datosDePosteo('https://www.instagram.com/reels/C8xYzAbCdEf/')?.url).toBe(
      'https://www.instagram.com/reel/C8xYzAbCdEf/',
    )
  })

  it('acepta reel, tv y el dominio de celular', () => {
    expect(datosDePosteo('https://m.instagram.com/reel/C8xYzAbCdEf')?.url).toBe(
      'https://www.instagram.com/reel/C8xYzAbCdEf/',
    )
    expect(datosDePosteo('https://www.instagram.com/tv/C8xYzAbCdEf/')?.url).toBe(
      'https://www.instagram.com/tv/C8xYzAbCdEf/',
    )
  })

  it('descarta los parámetros de seguimiento que pega la app', () => {
    expect(datosDePosteo('https://www.instagram.com/p/C8xYzAbCdEf/?igsh=MXZ2a2&utm_source=ig')?.url)
      .toBe('https://www.instagram.com/p/C8xYzAbCdEf/')
  })

  it('rechaza el perfil, que no es un posteo', () => {
    expect(datosDePosteo('https://www.instagram.com/aldosivi.fem/')).toBeNull()
  })

  it('rechaza un código que no tiene forma de código', () => {
    expect(datosDePosteo('https://www.instagram.com/p/no!/')).toBeNull()
    expect(datosDePosteo('https://www.instagram.com/p/abc/')).toBeNull()
  })
})

describe('datosDePosteo — X', () => {
  it('lee un posteo con handle', () => {
    expect(datosDePosteo('https://x.com/aldosivi/status/1783456789012345678')).toEqual({
      red: 'x',
      url: 'https://x.com/aldosivi/status/1783456789012345678',
      usuario: 'aldosivi',
    })
  })

  it('traduce twitter.com, que sigue siendo el mismo posteo', () => {
    expect(datosDePosteo('https://twitter.com/aldosivi/status/1783456789012345678')).toEqual({
      red: 'x',
      url: 'https://x.com/aldosivi/status/1783456789012345678',
      usuario: 'aldosivi',
    })
  })

  it('acepta el plural viejo y lo que cuelga después del id', () => {
    expect(datosDePosteo('https://twitter.com/aldosivi/statuses/1783456789012345678')?.url).toBe(
      'https://x.com/aldosivi/status/1783456789012345678',
    )
    expect(
      datosDePosteo('https://x.com/aldosivi/status/1783456789012345678/photo/1?s=20')?.url,
    ).toBe('https://x.com/aldosivi/status/1783456789012345678')
  })

  it('lee las dos formas sin handle', () => {
    const esperado = {
      red: 'x',
      url: 'https://x.com/i/status/1783456789012345678',
      usuario: null,
    }
    expect(datosDePosteo('https://x.com/i/web/status/1783456789012345678')).toEqual(esperado)
    expect(datosDePosteo('https://x.com/i/status/1783456789012345678')).toEqual(esperado)
  })

  it('rechaza un id que no es un número y un handle imposible', () => {
    expect(datosDePosteo('https://x.com/aldosivi/status/no-es-un-id')).toBeNull()
    expect(datosDePosteo('https://x.com/un.handle.con.puntos/status/1783456789012345678')).toBeNull()
  })

  it('rechaza el perfil y la búsqueda', () => {
    expect(datosDePosteo('https://x.com/aldosivi')).toBeNull()
    expect(datosDePosteo('https://x.com/search?q=aldosivi')).toBeNull()
  })
})

describe('datosDePosteo — lo que no pasa', () => {
  it('rechaza lo que no es un string', () => {
    expect(datosDePosteo(undefined)).toBeNull()
    expect(datosDePosteo(null)).toBeNull()
    expect(datosDePosteo(42)).toBeNull()
    expect(datosDePosteo({ url: 'https://x.com/a/status/1' })).toBeNull()
    expect(datosDePosteo('   ')).toBeNull()
  })

  it('rechaza un esquema que no es http', () => {
    expect(datosDePosteo('javascript:alert(1)')).toBeNull()
    expect(datosDePosteo('data:text/html,<script>alert(1)</script>')).toBeNull()
  })

  it('rechaza un dominio que se parece pero no es', () => {
    // El caso que mataría un `endsWith('instagram.com')`.
    expect(datosDePosteo('https://instagram.com.evil.io/p/C8xYzAbCdEf/')).toBeNull()
    expect(datosDePosteo('https://notinstagram.com/p/C8xYzAbCdEf/')).toBeNull()
    expect(datosDePosteo('https://facebook.com/periodicodelfos/posts/123')).toBeNull()
  })

  it('acepta la URL sin protocolo, que es lo que copia Safari', () => {
    expect(datosDePosteo('instagram.com/p/C8xYzAbCdEf/')?.red).toBe('instagram')
    expect(datosDePosteo('  x.com/aldosivi/status/1783456789012345678  ')?.red).toBe('x')
  })

  it('no se cuelga con una URL recortada a mitad de camino', () => {
    expect(datosDePosteo('https://x.com')).toBeNull()
    expect(datosDePosteo('https://x.com/aldosivi/status/')).toBeNull()
    expect(datosDePosteo('https://www.instagram.com/p/')).toBeNull()
    expect(datosDePosteo('https://x.com/i/')).toBeNull()
  })
})
