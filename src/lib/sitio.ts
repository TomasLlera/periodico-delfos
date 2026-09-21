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
 * Las dos de Vercel son la red de contención. Un deploy sin la variable cargada
 * sale igual, con su propia URL, en vez de publicar `http://localhost:3000`
 * adentro de cada canonical, del `sitemap.xml`, del `robots.txt` y de cada
 * `og:image`. Ese es el peor de los dos fracasos posibles: la página se ve
 * perfecta y el SEO está roto, así que nadie lo mira hasta que es tarde.
 *
 * **`VERCEL_PROJECT_PRODUCTION_URL` va antes que `VERCEL_URL`, y no es un
 * detalle.** `VERCEL_URL` es la URL *de ese deploy*
 * —`periodico-delfos-pmyw34e8y-tomaslleras-projects.vercel.app`— y cambia en
 * cada push: las canonical apuntarían a una URL distinta cada vez, y lo que
 * Google o WhatsApp hayan cacheado quedaría colgado de una que ya no es la
 * buena. La otra es el dominio estable del proyecto. Se vio en el primer
 * deploy que anduvo, el 21/09.
 *
 * El orden importa: lo que diga `NEXT_PUBLIC_SITE_URL` le gana siempre a las
 * dos, porque el día que haya dominio propio las de Vercel siguen existiendo y
 * siguen respondiendo.
 */
export function urlDelSitio(): string {
  // `process.env.NEXT_PUBLIC_SITE_URL` no es una lectura: Next reemplaza la
  // expresión entera por el literal al compilar, así que no se puede leer con
  // una variable de por medio.
  const declarada = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (declarada) return declarada.replace(/\/+$/, '')

  // Las dos vienen sin protocolo: `mi-proyecto.vercel.app`.
  const deVercel =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim()
  if (deVercel) return `https://${deVercel.replace(/\/+$/, '')}`

  return 'http://localhost:3000'
}
