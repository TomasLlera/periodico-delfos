import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
