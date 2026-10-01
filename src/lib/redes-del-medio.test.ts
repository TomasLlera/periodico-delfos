import { describe, expect, it } from 'vitest'
import { redesDelMedio, urlDeRedValida } from '@/lib/redes-del-medio'

describe('urlDeRedValida', () => {
  it('acepta una URL completa y le saca la barra final', () => {
    expect(urlDeRedValida('https://instagram.com/delfos/')).toBe('https://instagram.com/delfos')
  })

  it('rechaza la variable definida y vacia, que es lo que deja un .env.example', () => {
    expect(urlDeRedValida('')).toBeNull()
    expect(urlDeRedValida('   ')).toBeNull()
    expect(urlDeRedValida(undefined)).toBeNull()
  })

  it('rechaza un handle suelto: daria un link relativo a un 404 del propio sitio', () => {
    expect(urlDeRedValida('@periodicodelfos')).toBeNull()
    expect(urlDeRedValida('instagram.com/delfos')).toBeNull()
  })

  it('rechaza protocolos que no son http(s)', () => {
    expect(urlDeRedValida('javascript:alert(1)')).toBeNull()
  })
})

describe('redesDelMedio', () => {
  it('sin ninguna cargada devuelve la lista vacia y el chrome no dibuja nada', () => {
    expect(redesDelMedio({})).toEqual([])
  })

  it('devuelve solo las cargadas, en el orden en que se muestran', () => {
    const redes = redesDelMedio({
      youtube: 'https://youtube.com/@delfos',
      instagram: 'https://instagram.com/delfos',
      x: '',
    })

    expect(redes.map((r) => r.clave)).toEqual(['instagram', 'youtube'])
    expect(redes[0].etiqueta).toBe('Periódico Delfos en Instagram')
  })
})
