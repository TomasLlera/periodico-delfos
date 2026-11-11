import { describe, expect, it } from 'vitest'
import { MAXIMO_BYTES, chequearImagen, esUrlLocal, rutaEnBucket } from './imagen'

const BUCKET = 'https://kftenasaixqugovknopm.supabase.co/storage/v1/object/public/media/wp/foto.jpg'

describe('esUrlLocal', () => {
  it('reconoce un blob', () => {
    expect(esUrlLocal('blob:http://localhost:3000/abc-123')).toBe(true)
  })

  it('reconoce un data URI', () => {
    expect(esUrlLocal('data:image/png;base64,iVBOR')).toBe(true)
  })

  it('una URL del bucket no es local', () => {
    expect(esUrlLocal(BUCKET)).toBe(false)
  })
})

// Acá estaban los describe de `urlTransformada` y `srcSetTransformado`, que
// armaban las URLs del transformador de Supabase. Se fueron con las funciones
// cuando `ImagenResponsive` pasó a `next/image`: el redimensionado ya no lo
// hace una URL que este repo construya, así que no hay nada puro que probar.
// Lo que reemplaza a esos tests es que las imágenes se vean, y eso lo cubre
// `e2e/medidas.spec.ts` al exigir cero errores de consola en cada ruta.

describe('chequearImagen', () => {
  it('acepta un JPG de tamaño normal', () => {
    expect(chequearImagen('image/jpeg', 2 * 1024 * 1024)).toEqual({ ok: true })
  })

  it('rechaza lo que no es imagen', () => {
    const r = chequearImagen('application/pdf', 1000)
    expect(r.ok).toBe(false)
    expect(r.motivo).toContain('JPG')
  })

  it('rechaza lo que pasa los 8 MB, y dice cuánto pesa', () => {
    const r = chequearImagen('image/png', 12.5 * 1024 * 1024)
    expect(r.ok).toBe(false)
    expect(r.motivo).toContain('12.5 MB')
  })

  it('justo en el límite entra', () => {
    expect(chequearImagen('image/webp', MAXIMO_BYTES).ok).toBe(true)
  })
})

describe('rutaEnBucket', () => {
  it('usa jpg y no jpeg', () => {
    expect(rutaEnBucket('image/jpeg', 'abc')).toBe('notas/abc.jpg')
  })

  it('saca la extensión del tipo, no del nombre original', () => {
    expect(rutaEnBucket('image/webp', 'abc')).toBe('notas/abc.webp')
  })
})
