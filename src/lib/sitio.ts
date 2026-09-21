/**
 * La URL pública del sitio, sin barra final.
 *
 * **`??` no alcanza, y esto costó un deploy.** Una variable *definida y vacía*
 * —que es lo que queda si en Vercel se importa un `.env.example`, donde todas
 * las claves están sin valor— pasa el `??` y llega como `''`. En el layout raíz
 * eso termina en `new URL('')`, que tira `ERR_INVALID_URL` y **voltea el build
 * entero** con un mensaje que habla de `/_not-found` y no nombra la variable
 * por ningún lado. Acá se trata el string vacío como lo que es: no cargada.
 *
 * `VERCEL_URL` es la red de contención. Un deploy sin la variable cargada sale
 * igual, con su propia URL, en vez de publicar `http://localhost:3000` adentro
 * de cada canonical, del `sitemap.xml`, del `robots.txt` y de cada `og:image`.
 * Ese es el peor de los dos fracasos posibles: la página se ve perfecta y el
 * SEO está roto, así que nadie lo mira hasta que es tarde.
 *
 * El orden importa: lo que diga `NEXT_PUBLIC_SITE_URL` le gana siempre a
 * `VERCEL_URL`, porque el día que haya dominio propio la URL de Vercel sigue
 * existiendo y sigue respondiendo.
 */
export function urlDelSitio(): string {
  // `process.env.NEXT_PUBLIC_SITE_URL` no es una lectura: Next reemplaza la
  // expresión entera por el literal al compilar, así que no se puede leer con
  // una variable de por medio.
  const declarada = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (declarada) return declarada.replace(/\/+$/, '')

  const vercel = process.env.VERCEL_URL?.trim()
  // `VERCEL_URL` viene sin protocolo: `mi-proyecto-abc123.vercel.app`.
  if (vercel) return `https://${vercel.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}
