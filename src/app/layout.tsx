import type { Metadata, Viewport } from 'next'
import { Archivo, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
import { BarraEstado } from '@/components/layout/BarraEstado'
import { ProveedorTema } from '@/components/layout/ProveedorTema'
import { COLOR_BARRA_NAVEGADOR } from '@/lib/colores'
import { urlOg } from '@/lib/seo'
import { getEstadoDelSitio } from '@/lib/supabase/queries/estado'
import './globals.css'
import { urlDelSitio } from '@/lib/sitio'

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

const SITE_URL = urlDelSitio()

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
    // La tarjeta por omisión, para las páginas que no definen la suya. Sin
    // esto la portada se comparte como un rectángulo gris con el dominio, que
    // es el defecto del sitio de WordPress que esta migración venía a dejar
    // atrás. Ojo: una página que define `openGraph` pisa este objeto entero y
    // tiene que volver a poner la imagen — para eso está `openGraphBase()`.
    images: [
      {
        url: urlOg({ titulo: 'El fútbol femenino de Aldosivi, fecha a fecha' }, SITE_URL),
        alt: 'Periódico Delfos',
      },
    ],
  },
  alternates: {
    types: {
      'application/rss+xml': `${SITE_URL}/rss.xml`,
    },
  },
}

/**
 * La barra del navegador empalma con la cabecera en cada tema. Son dos
 * `<meta name="theme-color">` con `media`, que siguen al sistema;
 * `<ToggleTema />` los reescribe cuando el tema está forzado.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: COLOR_BARRA_NAVEGADOR.light },
    { media: '(prefers-color-scheme: dark)', color: COLOR_BARRA_NAVEGADOR.dark },
  ],
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
    // `suppressHydrationWarning` alcanza sólo a los atributos de <html>, no a
    // sus hijos: el script de next-themes pone `data-theme` y `color-scheme`
    // antes de hidratar, y sin esto React avisa que no coinciden con el HTML
    // del servidor —que no puede saber el tema—.
    <html
      lang="es-AR"
      className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh antialiased">
        <ProveedorTema>
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
        </ProveedorTema>
      </body>
    </html>
  )
}
