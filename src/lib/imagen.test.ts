import { describe, expect, it } from 'vitest'
import {
  MAXIMO_BYTES,
  chequearImagen,
  esUrlLocal,
  rutaEnBucket,
  srcSetTransformado,
  urlTransformada,
} from './imagen'

const BUCKET = 'https://kftenasaixqugovknopm.supabase.co/storage/v1/object/public/media/wp/foto.jpg'
const RENDER = 'https://kftenasaixqugovknopm.supabase.co/storage/v1/render/image/public/media/wp/foto.jpg'

/**
 * El entorno con el transformador habilitado.
 *
 * Los tests de abajo lo pasan explícitamente porque **el valor por omisión es
 * apagado**: `/storage/v1/render/image/` es una función de plan pago y sin ella
 * Supabase contesta 403, con lo que el `<img>` no dibuja nada. Pasar el entorno
 * en vez de tocar `process.env` es lo mismo que ya hace `esDryRun()`.
 */
const PRENDIDO = { NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM: 'true' }
const APAGADO: Record<string, string | undefined> = {}

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

describe('urlTransformada', () => {
  it('manda la URL del bucket al transformador, con el ancho pedido', () => {
    expect(urlTransformada(BUCKET, 800, PRENDIDO)).toBe(`${RENDER}?width=800&quality=75`)
  })

  it('usa & si la URL ya traía query string', () => {
    expect(urlTransformada(`${BUCKET}?v=2`, 400, PRENDIDO)).toBe(`${RENDER}?v=2&width=400&quality=75`)
  })

  it('devuelve el blob intacto: no admite parámetros', () => {
    const blob = 'blob:http://localhost:3000/abc-123'
    expect(urlTransformada(blob, 800, PRENDIDO)).toBe(blob)
  })

  it('deja pasar una URL de otro dominio sin tocarla', () => {
    const ajena = 'https://periodicodelfos.com/wp-content/uploads/foto.jpg'
    expect(urlTransformada(ajena, 800, PRENDIDO)).toBe(ajena)
  })

  /**
   * **El caso que rompió el sitio en producción.** Sin el plan que habilita el
   * transformador, `/render/image/` contesta `403 FeatureNotEnabled` con un
   * JSON; como la URL está en el `src` de un `<img>`, no se dibuja nada y
   * desaparecen todas las imágenes a la vez. Apagado, la URL tiene que quedar
   * apuntando al archivo original, que es público y responde siempre.
   */
  it('apagado, devuelve la URL del bucket sin tocar: el original siempre responde', () => {
    expect(urlTransformada(BUCKET, 800, APAGADO)).toBe(BUCKET)
    expect(urlTransformada(BUCKET, 800, APAGADO)).not.toContain('render/image')
  })

  it('apagado, tampoco le pega el width', () => {
    expect(urlTransformada(BUCKET, 400, APAGADO)).not.toContain('width=')
  })
})

describe('srcSetTransformado', () => {
  it('ofrece los tres anchos para una imagen del bucket', () => {
    const srcSet = srcSetTransformado(BUCKET, PRENDIDO)

    expect(srcSet).toContain('400w')
    expect(srcSet).toContain('800w')
    expect(srcSet).toContain('1600w')
  })

  it('no ofrece srcSet para un blob, que es lo que rompía la preview', () => {
    expect(srcSetTransformado('blob:http://localhost:3000/abc-123', PRENDIDO)).toBeUndefined()
  })

  // Sin transformador no hay anchos que ofrecer: los tres apuntarían al mismo
  // original, y un `srcSet` que repite la misma URL tres veces sólo confunde al
  // navegador sin ahorrarle un byte.
  it('apagado, no ofrece ningún srcSet', () => {
    expect(srcSetTransformado(BUCKET, APAGADO)).toBeUndefined()
  })

  it('tampoco para una imagen de otro dominio', () => {
    expect(srcSetTransformado('https://periodicodelfos.com/foto.jpg')).toBeUndefined()
  })
})

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
