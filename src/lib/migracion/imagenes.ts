/**
 * De las imágenes de WordPress al bucket `media`.
 *
 * **No se redimensiona nada.** El blueprint (sección 5, paso 2) pedía convertir
 * cada foto a WebP en 400, 800 y 1600 px, pero eso se decidió antes de que
 * existiera `<ImagenResponsive />`, que arma su `srcset` contra el
 * transformador de Supabase Storage (`/render/image/public/…?width=800`). El
 * transformador ya entrega WebP en el ancho pedido: generar las tres variantes
 * acá sería subir cuatro archivos para servir uno y dejar el `srcset` apuntando
 * a copias que nadie regenera cuando se cambia la foto. Se sube el original y
 * listo — de paso, la migración no necesita `sharp`.
 */

import { normalizarEspacios, sinDiacriticos } from '@/lib/migracion/texto'

/** El id del adjunto, escondido en la clase `wp-image-2647` del `<img>`. */
export function idDeAdjunto(clase: string | null | undefined): number | null {
  const encontrado = /\bwp-image-(\d+)\b/.exec(clase ?? '')
  return encontrado ? Number(encontrado[1]) : null
}

/**
 * La URL del archivo original a partir de la de una variante.
 *
 * WordPress sirve en el cuerpo la variante escalada (`…-1024x576.jpg`) y guarda
 * el original al lado, sin el sufijo. Se sube el original porque el
 * transformador de Supabase baja de tamaño pero no inventa píxeles: partir de
 * los 1024 px del cuerpo dejaría la foto de portada peor de lo que está hoy.
 */
export function urlOriginal(url: string): string {
  return url.replace(/-\d{2,5}x\d{2,5}(?=\.[a-z0-9]{2,5}(?:$|\?))/i, '')
}

function decodificarRuta(ruta: string): string {
  try {
    return decodeURIComponent(ruta)
  } catch {
    // Un `%` suelto en el nombre del archivo rompe `decodeURIComponent`.
    return ruta
  }
}

/** Nombre de archivo apto para una URL pública: sin acentos, sin espacios. */
function normalizarNombre(nombre: string): string {
  return sinDiacriticos(decodificarRuta(nombre))
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Ruta dentro del bucket `media`.
 *
 * Conserva el `año/mes` de WordPress: es lo que hace que dos notas que usan la
 * misma foto apunten al mismo objeto en vez de subirla dos veces, y que la ruta
 * no dependa de la nota —una imagen puede estar en varias.
 */
export function rutaEnBucket(url: string): string {
  const camino = decodificarRuta(new URL(url, 'https://periodicodelfos.com').pathname)
  const desdeUploads = /\/uploads\/(.+)$/.exec(camino)
  const relativa = desdeUploads ? desdeUploads[1] : camino.replace(/^\/+/, '')

  const partes = relativa
    .split('/')
    .map(normalizarNombre)
    .filter((parte) => parte !== '')

  return `wp/${partes.join('/')}`
}

/** La URL pública de un objeto del bucket, que es la que se guarda en `notas`. */
export function urlPublicaDeBucket(urlSupabase: string, ruta: string): string {
  return `${urlSupabase.replace(/\/+$/, '')}/storage/v1/object/public/media/${ruta}`
}

export interface EpigrafeYCredito {
  epigrafe: string | null
  credito: string | null
}

/**
 * Parte el `<figcaption>` de WordPress en epígrafe y crédito.
 *
 * Los pies de foto del sitio viejo son siempre *"Once titular de las Tiburonas.
 * Foto: Prensa Aldosivi."*: una descripción y, pegada atrás, la atribución.
 * `<ImagenResponsive />` los dibuja distinto —el crédito va en itálica, después
 * de un punto medio— así que llegan separados o no se separan nunca.
 *
 * Exige los dos puntos: sin ellos no hay forma de saber dónde termina la
 * descripción, y partir de más deja epígrafes mutilados. Lo que no matchea
 * queda entero como epígrafe, que es el peor caso aceptable.
 */
export function partirEpigrafe(caption: string | null | undefined): EpigrafeYCredito {
  const texto = normalizarEspacios(caption ?? '')
  if (texto === '') return { epigrafe: null, credito: null }

  const marca = /(?:^|[\s.·|(\-–—])(?:fotos?|imagen|cr[ée]dito|gentileza)\s*:\s*/iu.exec(texto)
  if (!marca) return { epigrafe: texto, credito: null }

  const epigrafe = normalizarEspacios(texto.slice(0, marca.index)).replace(/[.,;·|(\-–—]$/u, '')
  const credito = normalizarEspacios(texto.slice(marca.index + marca[0].length)).replace(/\.$/, '')

  return {
    epigrafe: epigrafe === '' ? null : normalizarEspacios(epigrafe),
    credito: credito === '' ? null : credito,
  }
}
