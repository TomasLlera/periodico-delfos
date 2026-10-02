/**
 * Las cuentas del medio, para los links del chrome.
 *
 * **No son las credenciales del auto-posteo.** Eso vive en `lib/social/*`, va
 * con tokens y es sólo servidor. Esto es la otra punta: las URL públicas a las
 * que un lector va a mirar las redes, y por eso son `NEXT_PUBLIC_`.
 *
 * **Salen del entorno y no de una constante en el código.** Los handles son uno
 * de los datos que CONTRIBUTING pone del lado de Charlie —junto con el mail del
 * medio y el responsable de datos— y escribir `instagram.com/periodicodelfos` a
 * ojo es inventar un dato que después alguien publica. Con el entorno se cargan
 * una vez en Vercel y no hay que tocar un `.tsx` ni abrir un PR.
 *
 * **Sin ninguna cargada no se dibuja nada**, que es exactamente lo que pasa
 * hoy: los componentes preguntan por el largo de esta lista antes de pintar.
 * Es el mismo criterio del pie, que tampoco muestra la columna "Seguinos"
 * mientras no haya adónde mandar.
 */

import { NOMBRE_DE_RED, type ClaveDeRed } from '@/lib/logos-redes'

export interface RedDelMedio {
  /** Qué red es. Decide el ícono. */
  clave: ClaveDeRed
  /** Lo que lee un lector de pantalla: "Periódico Delfos en Instagram". */
  etiqueta: string
  url: string
}

/**
 * Una URL sólo entra si es http(s) y se puede parsear.
 *
 * Es la misma trampa que documenta `urlDelSitio()`: una variable **definida y
 * vacía** —lo que queda al importar un `.env.example` en Vercel— pasa cualquier
 * `??` y llega como `''`. Un `<a href="">` apunta a la página actual, así que
 * el ícono quedaría dibujado y mudo en lugar de no estar. Y un valor a medias,
 * como el handle suelto `@periodicodelfos`, daría un link relativo que lleva a
 * un 404 del propio sitio.
 */
export function urlDeRedValida(valor: string | undefined): string | null {
  const limpio = valor?.trim()
  if (!limpio) return null

  try {
    const url = new URL(limpio)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString().replace(/\/+$/, '')
  } catch {
    return null
  }
}

/**
 * Arma la lista con las que estén cargadas, en el orden en que se muestran.
 *
 * Recibe el entorno por parámetro para poder testearla; en producción se la
 * llama sin argumento. Los `process.env.X` van escritos literal porque Next
 * reemplaza la expresión entera al compilar y no se pueden leer con una
 * variable de por medio.
 */
export function redesDelMedio(
  entorno: Record<string, string | undefined> = {
    instagram: process.env.NEXT_PUBLIC_URL_INSTAGRAM,
    x: process.env.NEXT_PUBLIC_URL_X,
    youtube: process.env.NEXT_PUBLIC_URL_YOUTUBE,
    facebook: process.env.NEXT_PUBLIC_URL_FACEBOOK,
  },
): RedDelMedio[] {
  const claves: RedDelMedio['clave'][] = ['instagram', 'x', 'youtube', 'facebook']

  return claves.flatMap((clave) => {
    const url = urlDeRedValida(entorno[clave])
    if (!url) return []
    return [{ clave, etiqueta: `Periódico Delfos en ${NOMBRE_DE_RED[clave]}`, url }]
  })
}
