/**
 * Las URLs de imagen del sitio, y cuáles se pueden transformar.
 *
 * Esto vivía adentro de `ImagenResponsive.tsx` y salió acá por la vista previa
 * del admin. Antes todas las imágenes venían del bucket, así que transformar
 * siempre era correcto. Ahora hay un segundo caso: la imagen que Charlie eligió
 * pero **todavía no se subió**, que en la preview es un `blob:` creado con
 * `URL.createObjectURL`.
 *
 * Un `blob:` no admite query params. El `srcSet` que arma el componente
 * —`?width=400 400w`— produciría tres URLs inválidas y la imagen no se
 * dibujaría: la preview mostraría un hueco justo donde va la portada, que es lo
 * que se quiere mirar. Por eso hay que saber distinguirlas.
 *
 * Es lógica pura y va con test propio: es la clase de detalle que se rompe en
 * silencio y se descubre mirando una preview rota.
 */

/** Los anchos del `srcSet`. Los mismos que el sitio viene sirviendo. */
export const ANCHOS_IMAGEN = [400, 800, 1600] as const

/**
 * `true` si la URL es local al navegador y no la sirve nadie.
 *
 * `blob:` es la imagen elegida y no subida; `data:` es el mismo caso pero
 * embebida. Ninguna de las dos pasa por el transformador de Supabase, y
 * ninguna de las dos se guarda jamás en la base (regla no negociable 6:
 * Instagram exige una URL HTTPS pública).
 */
export function esUrlLocal(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:')
}

/**
 * Reescribe una URL pública del bucket a su equivalente transformada.
 *
 * Si la URL no es del bucket —un `blob:`, o una absoluta de otro dominio— la
 * devuelve intacta en vez de pegarle parámetros que no entiende.
 */
export function urlTransformada(url: string, ancho: number): string {
  if (esUrlLocal(url)) return url

  const base = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')

  // Si el replace no cambió nada, la URL no es del bucket: no tiene sentido
  // pedirle un ancho a un servidor que no transforma.
  if (base === url) return url

  const separador = base.includes('?') ? '&' : '?'
  return `${base}${separador}width=${ancho}&quality=75`
}

/**
 * El `srcSet` de una imagen, o `undefined` cuando no corresponde ofrecer uno.
 *
 * Devolver `undefined` y no una cadena vacía es a propósito: `srcSet=""` es un
 * atributo presente y vacío, y el navegador lo trata distinto de no tenerlo.
 */
export function srcSetTransformado(url: string): string | undefined {
  if (urlTransformada(url, 800) === url) return undefined

  return ANCHOS_IMAGEN.map((a) => `${urlTransformada(url, a)} ${a}w`).join(', ')
}

// ============================================
// Subida al bucket
// ============================================

/**
 * Lo que el editor acepta subir.
 *
 * WebP y AVIF entran aunque el transformador de Supabase ya convierta a WebP:
 * si el original ya viene liviano, no hay por qué rechazarlo. Lo que no entra
 * es cualquier cosa que no sea una imagen — un PDF subido por error terminaría
 * como portada rota en la nota y en el posteo a Instagram.
 */
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const

/**
 * El techo de tamaño, en bytes.
 *
 * 8 MB es holgado para una foto de cancha sacada con un celular y corta las
 * subidas accidentales de un original sin comprimir. El transformador sirve
 * después la versión liviana; el original queda guardado tal cual.
 */
export const MAXIMO_BYTES = 8 * 1024 * 1024

export interface ChequeoImagen {
  ok: boolean
  motivo?: string
}

/** Si esta imagen se puede subir, y si no, por qué, en una frase para Charlie. */
export function chequearImagen(tipo: string, bytes: number): ChequeoImagen {
  if (!TIPOS_IMAGEN.includes(tipo as (typeof TIPOS_IMAGEN)[number])) {
    return { ok: false, motivo: 'Tiene que ser una imagen: JPG, PNG, WebP o AVIF' }
  }

  if (bytes > MAXIMO_BYTES) {
    const megas = (bytes / 1024 / 1024).toFixed(1)
    return { ok: false, motivo: `La imagen pesa ${megas} MB y el máximo son 8 MB` }
  }

  return { ok: true }
}

/**
 * La ruta que va a tener la imagen adentro del bucket.
 *
 * El nombre original no se conserva: "WhatsApp Image 2026-08-08 at 19.33.41.jpeg"
 * tiene espacios y puntos que complican la URL, y dos fotos distintas pueden
 * traer el mismo nombre. El id lo pone quien llama —`crypto.randomUUID()`— así
 * que esto queda puro y testeable.
 *
 * La extensión sí se conserva, sacada del tipo MIME y no del nombre: es lo que
 * decide con qué `content-type` lo sirve Storage.
 */
export function rutaEnBucket(tipo: string, id: string): string {
  const extension = tipo === 'image/jpeg' ? 'jpg' : tipo.replace('image/', '')
  return `notas/${id}.${extension}`
}
