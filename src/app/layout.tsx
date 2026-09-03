import type { Metadata } from 'next'
import { Archivo, Source_Serif_4, IBM_Plex_Mono } from 'next/font/google'
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // es-AR, no es-ES: el sitio de WordPress lo tiene mal configurado.
    <html
      lang="es-AR"
      className={`${archivo.variable} ${sourceSerif.variable} ${plexMono.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
