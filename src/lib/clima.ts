import { z } from 'zod'

/**
 * La temperatura de Mar del Plata para la línea de fecha de la cabecera.
 *
 * **La ciudad es fija y no la del lector.** "Mar del Plata" en la cabecera es
 * la línea de fecha del diario —de dónde se escribe—, como en un diario
 * impreso, no dónde está quien lee. Además, geolocalizar al visitante obliga a
 * pedirle permiso al entrar o a mirar la IP en cada request, y cualquiera de
 * las dos vuelve dinámica una portada que hoy es estática con ISR.
 *
 * Open-Meteo no pide API key ni atribución, así que no hay secreto que
 * guardar ni límite de plan que vigilar.
 */

/** Plaza San Martín, Mar del Plata. */
const MAR_DEL_PLATA = { latitud: -38.0023, longitud: -57.5575 }

const URL_CLIMA =
  `https://api.open-meteo.com/v1/forecast?latitude=${MAR_DEL_PLATA.latitud}` +
  `&longitude=${MAR_DEL_PLATA.longitud}&current=temperature_2m`

/** Media hora. Es una temperatura en una cabecera, no un dato en vivo. */
const REVALIDAR = 1800

/**
 * La forma de la respuesta se valida: es una API externa y el resto del sitio
 * no puede romperse porque un día devuelva otra cosa.
 */
const RESPUESTA = z.object({
  current: z.object({
    temperature_2m: z.number(),
  }),
})

/** Los grados enteros de una respuesta cruda, o null si no se entiende. */
export function temperaturaDe(crudo: unknown): number | null {
  const leido = RESPUESTA.safeParse(crudo)
  if (!leido.success) return null

  const grados = Math.round(leido.data.current.temperature_2m)
  // `Math.round(-0.4)` es -0, que se imprime "-0".
  return grados === 0 ? 0 : grados
}

/** "14°", "−3°". El signo menos es U+2212, como en `etiquetaDiferencia`. */
export function etiquetaTemperatura(grados: number): string {
  return grados < 0 ? `−${Math.abs(grados)}°` : `${grados}°`
}

/** "14 grados" — lo que se lee en voz alta: el símbolo de grado no se anuncia. */
export function temperaturaAccesible(grados: number): string {
  return `${grados} ${Math.abs(grados) === 1 ? 'grado' : 'grados'}`
}

/**
 * La temperatura de ahora, o null si no se pudo leer.
 *
 * **Nunca tira**: la cabecera está en todas las páginas del sitio y una API de
 * clima caída no puede tumbar ninguna. Sin dato, la cabecera muestra la ciudad
 * y la fecha, como antes de que esto existiera.
 */
export async function getTemperatura(): Promise<number | null> {
  try {
    const respuesta = await fetch(URL_CLIMA, { next: { revalidate: REVALIDAR } })
    if (!respuesta.ok) return null
    return temperaturaDe(await respuesta.json())
  } catch {
    return null
  }
}
