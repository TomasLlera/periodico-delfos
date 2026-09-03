import { describe, expect, it } from 'vitest'
import {
  idDeAdjunto,
  partirEpigrafe,
  rutaEnBucket,
  urlOriginal,
  urlPublicaDeBucket,
} from '@/lib/migracion/imagenes'

describe('idDeAdjunto', () => {
  it('lee el id que WordPress deja en la clase del <img>', () => {
    expect(idDeAdjunto('wp-image-2647')).toBe(2647)
    expect(idDeAdjunto('alignnone size-large wp-image-123')).toBe(123)
  })

  it('devuelve null cuando no está', () => {
    expect(idDeAdjunto('size-large')).toBeNull()
    expect(idDeAdjunto(null)).toBeNull()
    expect(idDeAdjunto('wp-image-')).toBeNull()
  })
})

describe('urlOriginal', () => {
  it('saca el sufijo de tamaño que WordPress agrega a las variantes', () => {
    expect(
      urlOriginal('https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-WA0043-1-1024x576.jpg'),
    ).toBe('https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-WA0043-1.jpg')
  })

  it('no toca una URL que ya es la original', () => {
    const url = 'https://periodicodelfos.com/wp-content/uploads/2026/08/deffb4c1-6a42.jpg'
    expect(urlOriginal(url)).toBe(url)
  })

  it('no confunde un guion con números en el medio del nombre', () => {
    const url = 'https://periodicodelfos.com/wp-content/uploads/2024/05/aldosivi-2024-campeon.jpg'
    expect(urlOriginal(url)).toBe(url)
  })
})

describe('rutaEnBucket', () => {
  it('conserva el año y el mes de WordPress para no duplicar archivos', () => {
    expect(
      rutaEnBucket('https://periodicodelfos.com/wp-content/uploads/2026/08/IMG-20260808-WA0043-1.jpg'),
    ).toBe('wp/2026/08/img-20260808-wa0043-1.jpg')
  })

  it('normaliza acentos, espacios y mayúsculas', () => {
    expect(
      rutaEnBucket('https://periodicodelfos.com/wp-content/uploads/2024/05/Campeón%20Primera%20C.png'),
    ).toBe('wp/2024/05/campeon-primera-c.png')
  })

  it('aguanta una URL que no viene de /uploads/', () => {
    expect(rutaEnBucket('https://otro.com/fotos/tapa.jpg')).toBe('wp/fotos/tapa.jpg')
  })
})

describe('urlPublicaDeBucket', () => {
  it('arma la URL que después transforma <ImagenResponsive />', () => {
    expect(urlPublicaDeBucket('https://abc.supabase.co', 'wp/2026/08/foto.jpg')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/wp/2026/08/foto.jpg',
    )
  })

  it('tolera la barra final en la URL del proyecto', () => {
    expect(urlPublicaDeBucket('https://abc.supabase.co/', 'wp/a.jpg')).toBe(
      'https://abc.supabase.co/storage/v1/object/public/media/wp/a.jpg',
    )
  })
})

describe('partirEpigrafe', () => {
  it('separa el crédito del pie de foto', () => {
    expect(partirEpigrafe('Once titular de las Tiburonas. Foto: Prensa Aldosivi.')).toEqual({
      epigrafe: 'Once titular de las Tiburonas',
      credito: 'Prensa Aldosivi',
    })
  })

  it('reconoce las otras formas de atribuir', () => {
    expect(partirEpigrafe('Las Tiburonas festejan. Fotos: Juan Pérez').credito).toBe('Juan Pérez')
    expect(partirEpigrafe('El gol del ascenso — Crédito: AFA').credito).toBe('AFA')
    expect(partirEpigrafe('Gentileza: Prensa Aldosivi').epigrafe).toBeNull()
  })

  it('deja el pie entero cuando no hay atribución', () => {
    expect(partirEpigrafe('Titulares y suplentes de las Tiburonas')).toEqual({
      epigrafe: 'Titulares y suplentes de las Tiburonas',
      credito: null,
    })
  })

  it('devuelve nulos cuando no hay pie', () => {
    expect(partirEpigrafe('')).toEqual({ epigrafe: null, credito: null })
    expect(partirEpigrafe(null)).toEqual({ epigrafe: null, credito: null })
    expect(partirEpigrafe('   ')).toEqual({ epigrafe: null, credito: null })
  })
})
