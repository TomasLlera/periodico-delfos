import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Cabeceras de seguridad para todo el sitio.
 *
 * **La CSP es parcial a propósito.** Una CSP que limite `script-src` necesita
 * un nonce por request, y el nonce sale del middleware: un middleware en todo
 * el sitio vuelve dinámicas todas las rutas y se lleva el ISR (ver
 * `src/middleware.ts`). Next, `next-themes`, el JSON-LD y Analytics usan
 * scripts inline, así que sin nonce habría que permitir `'unsafe-inline'` y la
 * directiva no protegería nada. Lo que va acá es lo que no rompe nada y sí
 * cierra algo:
 *
 * - `frame-ancestors 'none'`: nadie puede meter el sitio en un iframe. Es la
 *   defensa contra clickjacking del panel. El sitio no se embebe a sí mismo en
 *   ningún lado (`SelectorViewport` no es un iframe).
 * - `base-uri 'self'`: un `<base>` inyectado no puede redirigir los links
 *   relativos a otro dominio.
 * - `object-src 'none'`: nada de `<object>`/`<embed>`.
 * - `form-action 'self'`: los formularios —login, buscador, Server Actions—
 *   sólo postean al propio sitio.
 *
 * HSTS va sin `includeSubDomains`: otros subdominios de periodicodelfos.com
 * podrían seguir en HTTP mientras dure la migración desde WordPress.
 */
const CABECERAS_DE_SEGURIDAD = [
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  // Lo mismo que `frame-ancestors`, para navegadores que no leen CSP.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
]

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: CABECERAS_DE_SEGURIDAD }]
  },

  // Hay un pnpm-lock.yaml en el home del usuario que hace que Next infiera mal
  // la raíz del workspace. Fijarla evita que el build trace archivos de más.
  outputFileTracingRoot: path.resolve(process.cwd()),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp'],
  },
}

export default nextConfig
