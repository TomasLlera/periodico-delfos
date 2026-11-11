/**
 * Las URLs de imagen del sitio, y lo que se puede subir al bucket.
 *
 * **Acá vivían `urlTransformada()`, `srcSetTransformado()` y `ANCHOS_IMAGEN`,
 * que armaban las URLs del transformador de Supabase Storage.** Se fueron
 * cuando `ImagenResponsive` pasó a `next/image`: `/storage/v1/render/image/` es
 * una función de plan pago, dejó de estar habilitada y contestaba
 * `403 FeatureNotEnabled`, con lo que no se dibujaba ni una imagen del sitio.
 * Ahora redimensiona Next, que no depende del plan de Supabase, y ya no hay dos
 * servidores de imágenes que mantener sincronizados.
 *
 * Lo que sí quedó es `esUrlLocal()`, por el mismo caso que le dio origen: la
 * imagen que se eligió en el editor y todavía no se subió.
 */

/**
 * `true` si la URL es local al navegador y no la sirve nadie.
 *
 * `blob:` es la imagen elegida y no subida; `data:` es el mismo caso pero
 * embebida. Ninguna de las dos se guarda jamás en la base (regla no negociable
 * 6: Instagram exige una URL HTTPS pública), y ninguna de las dos puede pasar
 * por el optimizador de Next: corre en el servidor y un `blob:` sólo existe en
 * el navegador que lo creó. Por eso `ImagenResponsive` las marca
 * `unoptimized`.
 *
 * Es lógica pura y va con test propio: es la clase de detalle que se rompe en
 * silencio y se descubre mirando una preview rota.
 */
export function esUrlLocal(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:')
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
