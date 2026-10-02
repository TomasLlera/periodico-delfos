import { describe, expect, it } from 'vitest'
import { idDeYouTube, miniaturaDeYouTube, urlEmbebidaDeYouTube } from '@/lib/tiptap/video'

const ID = 'dQw4w9WgXcQ'

describe('idDeYouTube', () => {
  it('saca el id de las cinco formas en que YouTube reparte un video', () => {
    expect(idDeYouTube(`https://www.youtube.com/watch?v=${ID}`)).toBe(ID)
    expect(idDeYouTube(`https://youtu.be/${ID}`)).toBe(ID)
    expect(idDeYouTube(`https://www.youtube.com/shorts/${ID}`)).toBe(ID)
    expect(idDeYouTube(`https://www.youtube.com/embed/${ID}`)).toBe(ID)
    expect(idDeYouTube(`https://m.youtube.com/watch?v=${ID}&t=90s`)).toBe(ID)
  })

  it('aguanta lo que agrega el boton Compartir del celular', () => {
    expect(idDeYouTube(`https://youtu.be/${ID}?si=AbCdEfGhIjKl`)).toBe(ID)
    expect(idDeYouTube(`  https://youtu.be/${ID}  `)).toBe(ID)
  })

  it('acepta pegar sin protocolo, que es lo que sale de copiar de la barra', () => {
    expect(idDeYouTube(`youtu.be/${ID}`)).toBe(ID)
    expect(idDeYouTube(`www.youtube.com/watch?v=${ID}`)).toBe(ID)
  })

  it('acepta el id pelado, que es lo que queda guardado en el documento', () => {
    expect(idDeYouTube(ID)).toBe(ID)
  })

  it('rechaza cualquier cosa que no sea un video de YouTube', () => {
    expect(idDeYouTube('https://vimeo.com/12345')).toBeNull()
    expect(idDeYouTube('https://www.youtube.com/@periodicodelfos')).toBeNull()
    expect(idDeYouTube('https://www.youtube.com/watch?v=corto')).toBeNull()
    expect(idDeYouTube('')).toBeNull()
    expect(idDeYouTube(null)).toBeNull()
    expect(idDeYouTube(42)).toBeNull()
  })

  it('rechaza un dominio ajeno que se hace pasar por YouTube', () => {
    expect(idDeYouTube(`https://youtube.com.atacante.ru/watch?v=${ID}`)).toBeNull()
    expect(idDeYouTube(`https://noyoutube.com/watch?v=${ID}`)).toBeNull()
  })

  it('rechaza un protocolo que no es http(s): es la inyeccion que evita guardar el id', () => {
    expect(idDeYouTube('javascript:alert(1)')).toBeNull()
    expect(idDeYouTube('data:text/html,<script>alert(1)</script>')).toBeNull()
  })
})

describe('urlEmbebidaDeYouTube', () => {
  it('usa el dominio sin cookies', () => {
    expect(urlEmbebidaDeYouTube(ID)).toBe(`https://www.youtube-nocookie.com/embed/${ID}`)
  })
})

describe('miniaturaDeYouTube', () => {
  it('arma la miniatura del video', () => {
    expect(miniaturaDeYouTube(ID)).toBe(`https://i.ytimg.com/vi/${ID}/hqdefault.jpg`)
  })
})
