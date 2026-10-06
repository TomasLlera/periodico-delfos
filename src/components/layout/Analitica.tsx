import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'

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
 *
 * **Vercel Web Analytics**: Incluye `<Analytics />` de `@vercel/analytics/next`
 * que captura métricas de rendimiento y navegación. A diferencia de GA, esta
 * analítica de Vercel no usa cookies y es compatible con privacidad. Se carga
 * automáticamente en producción cuando está habilitada en el dashboard de Vercel.
 */
export function Analitica() {
  // `process.env.X` va escrito literal: Next reemplaza la expresión entera al
  // compilar y no se puede leer con una variable de por medio. Y se descarta el
  // string vacío, que es lo que deja un `.env.example` importado en Vercel.
  const medicion = process.env.NEXT_PUBLIC_GA_ID?.trim()

  return (
    <>
      {/* Vercel Web Analytics - no requiere configuración de variables de
          entorno, se activa automáticamente cuando está habilitada en el
          dashboard de Vercel */}
      <Analytics />

      {/* Google Analytics 4 - sólo si hay ID de medición configurado */}
      {medicion && (
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
      )}
    </>
  )
}
