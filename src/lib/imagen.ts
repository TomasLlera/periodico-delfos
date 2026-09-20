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
