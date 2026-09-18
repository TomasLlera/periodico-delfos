import type { Metadata } from 'next'
import { Archivo, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { getEstadoDelSitio } from '@/lib/supabase/queries/estado'
import './globals.css'

/**
 * Archivo en su eje expandido: titulares con peso de portada deportiva sin
 * caer en el condensado de Oswald que usa medio internet.
 */
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-display',
  axes: ['wdth'],
})

/** Serif de pantalla diseñada para textos largos. Es el arreglo de lectura. */
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  display: 'swap',
  variable: '--fuente-body',
})

/** Sólo para datos: minutos, dorsales, resultados. */
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '700'],
  variable: '--fuente-data',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Periódico Delfos',
    template: '%s · Periódico Delfos',
  },
  description:
    'El fútbol femenino de Aldosivi, fecha a fecha. Crónicas, análisis y estadísticas de las Tiburonas.',
  openGraph: {
    siteName: 'Periódico Delfos',
    locale: 'es_AR',
    type: 'website',
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
  },
}

/**
 * `<BarraEstado />` va acá y no en cada página: el blueprint la pide "fija
 * arriba, siempre visible", y en el layout raíz aparece en todas sin que
 * ninguna tenga que acordarse de ponerla.
 *
 * Se dibuja sola cuando haya base. Hoy `getEstadoDelSitio()` devuelve todo en
 * `null` —no hay proyecto de Supabase— y la barra no renderiza nada, que es lo
 * correcto: un resultado inventado en el borde superior de todas las páginas
 * es la peor forma de romper la regla no negociable 1.
 */
export default async function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  const { temporada, ultimo, proximo, posicion } = await getEstadoDelSitio()

  return (
    // es-AR, no es-ES: el sitio de WordPress lo tiene mal configurado.
    <html
      lang="es-AR"
      className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh antialiased">
        {temporada && (
          <BarraEstado
            temporada={temporada}
            ultimo={ultimo}
            proximo={proximo}
            posicion={posicion}
          />
        )}
        {children}

        {/* El slot de las ventanas. En casi todas las páginas esto es `null`
            —lo pone `@modal/default.tsx`— y sólo se llena cuando se interceptó
            la ruta de un partido, o sea cuando alguien apretó un chip de la
            franja sin recargar la página. */}
        {modal}
      </body>
    </html>
  )
}
