import Script from 'next/script'

/**
 * Google Analytics 4, si hay una medición cargada.
 *
 * **Sin `NEXT_PUBLIC_GA_ID` no inyecta nada.** No es una optimización: en
 * desarrollo y en los previews de Vercel las visitas del equipo ensuciarían las
 * métricas del medio, y en los tests de Playwright cada corrida sumaría
 * doscientas sesiones falsas. Como la variable sólo se carga en producción, el
 * resto del tiempo esto no existe.
 *
 * **`afterInteractive` y no `beforeInteractive`.** La analítica no puede
 * competir con el LCP: el Step 20 midió el tiempo de pintado de las tres rutas
 * principales y un script de terceros bloqueando el arranque se lo come entero.
 * Con esta estrategia Next lo carga una vez que la página ya respondió.
 *
 * **Cuidado antes de prenderlo en producción.** GA deja cookies, y la política
 * de privacidad del sitio todavía no existe —ver el comentario de `<Footer />`:
 * no se escribió justamente porque dependía, entre otras cosas, de si el sitio
 * iba a usar analítica—. Cargar la variable sin publicar esa página deja al
 * medio midiendo gente sin decirlo en ningún lado.
 */
export function Analitica() {
  // `process.env.X` va escrito literal: Next reemplaza la expresión entera al
  // compilar y no se puede leer con una variable de por medio. Y se descarta el
  // string vacío, que es lo que deja un `.env.example` importado en Vercel.
  const medicion = process.env.NEXT_PUBLIC_GA_ID?.trim()
  if (!medicion) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${medicion}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${medicion}');`}
      </Script>
    </>
  )
}
