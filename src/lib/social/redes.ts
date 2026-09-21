/**
 * El contrato que cumple cada red, y el modo dry-run.
 *
 * Los tres clientes de verdad —`facebook.ts`, `instagram.ts`, `x.ts`— son los
 * Steps 15 y 16 del Build Order y **están bloqueados por afuera**: Meta exige
 * pasar su App Review, que tarda días, y X pide una app del Developer Portal
 * con OAuth 1.0a. Nada de eso se puede escribir sin credenciales.
 *
 * Lo que sí se puede es todo lo demás: el fan-out durable, la idempotencia, los
 * reintentos y el registro en `social_posts`. Por eso el blueprint pide armarlo
 * **primero en modo dry-run** —"loguea e inserta en `social_posts` sin postear
 * de verdad"—: cuando las credenciales lleguen, lo único que falta es
 * reemplazar tres funciones que ya tienen su forma definida acá.
 *
 * **El dry-run no es un mock de test.** Es un modo de producción: escribe en
 * `social_posts` lo mismo que escribiría un posteo real, con un id falso que se
 * reconoce a simple vista, así se puede publicar una nota de punta a punta y
 * ver el pipeline entero funcionando sin publicar nada en ninguna red.
 */

import type { Red } from '@/types'
import type { CopyDeRed } from '@/lib/social/compose'

export interface ResultadoPosteo {
  externalPostId?: string
  externalUrl?: string
  error?: string
  /** `true` si no se posteó de verdad. Queda anotado en `social_posts`. */
  simulado?: boolean
}

export interface Publicacion {
  copy: CopyDeRed
  /**
   * La imagen de portada, URL pública del bucket.
   *
   * Instagram **no postea sin imagen** (su API pide `image_url`), así que para
   * esa red es obligatoria; las otras dos la usan si está.
   */
  imagenUrl: string | null
  notaSlug: string
}

/** Las variables de entorno que cada red necesita para poder postear. */
export const CREDENCIALES: Record<Red, readonly string[]> = {
  facebook: ['FACEBOOK_PAGE_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
  instagram: ['INSTAGRAM_BUSINESS_ACCOUNT_ID', 'FACEBOOK_PAGE_ACCESS_TOKEN'],
  x: ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET'],
}

/**
 * `true` si están todas las variables que esa red necesita.
 *
 * Recibe el entorno por parámetro en vez de leer `process.env` adentro, para
 * poder probarlo sin ensuciar el proceso.
 */
export function tieneCredenciales(
  red: Red,
  entorno: Record<string, string | undefined>,
): boolean {
  return CREDENCIALES[red].every((nombre) => {
    const valor = entorno[nombre]
    return typeof valor === 'string' && valor.trim() !== ''
  })
}

export function credencialesQueFaltan(
  red: Red,
  entorno: Record<string, string | undefined>,
): string[] {
  return CREDENCIALES[red].filter((nombre) => !entorno[nombre]?.trim())
}

/**
 * `true` si hay que simular en vez de postear.
 *
 * Dos caminos y los dos importan. `SOCIAL_DRY_RUN=true` es el interruptor
 * explícito, para probar el pipeline con las credenciales puestas sin publicar
 * nada. Y **la falta de credenciales también simula**, en lugar de fallar: así
 * el proyecto funciona de punta a punta antes de que Meta conteste el App
 * Review, que es el bloqueo de mayor lead time del proyecto.
 */
export function esDryRun(
  red: Red,
  entorno: Record<string, string | undefined>,
): boolean {
  if (entorno.SOCIAL_DRY_RUN === 'true') return true
  return !tieneCredenciales(red, entorno)
}

/**
 * Un posteo simulado.
 *
 * El id empieza con `simulado-` a propósito: si alguna vez uno de estos llega
 * al panel o a un log creyéndose real, se ve de una. Nada de ids que parezcan
 * de Meta.
 */
export function postearSimulado(red: Red, publicacion: Publicacion): ResultadoPosteo {
  return {
    externalPostId: `simulado-${red}-${publicacion.notaSlug}`,
    simulado: true,
  }
}

/**
 * La forma que van a tener `facebook.ts`, `instagram.ts` y `x.ts`.
 *
 * Devuelven `{ error }` en vez de tirar: un fan-out en el que una red que
 * explota se lleva puestas a las otras dos es peor que uno en el que una
 * falla y queda registrada.
 */
export type Publicador = (publicacion: Publicacion) => Promise<ResultadoPosteo>

/**
 * El publicador de cada red.
 *
 * Hoy las tres entradas son el simulado. **Acá es donde se enchufan los
 * clientes de verdad** cuando existan: una línea por red, sin tocar la función
 * durable ni el fan-out.
 */
export function publicadorDe(
  red: Red,
  entorno: Record<string, string | undefined>,
): Publicador {
  if (esDryRun(red, entorno)) {
    return async (publicacion) => postearSimulado(red, publicacion)
  }

  // Steps 15 y 16: acá van `postearEnFacebook`, `postearEnInstagram` y
  // `postearEnX`. Mientras no existan, tener credenciales cargadas no alcanza
  // para postear, y decirlo es mejor que simular en silencio con las claves
  // puestas: quien las cargó espera que se publique.
  return async () => ({
    error: `El cliente de ${red} todavía no está escrito (Steps 15 y 16 del Build Order).`,
  })
}
