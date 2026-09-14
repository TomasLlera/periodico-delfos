/**
 * Convierte `.migracion-wp/redirects.json` (lo que emite `migrate-wp.ts`) en
 * el `vercel.json` del proyecto.
 *
 *     pnpm tsx scripts/generate-redirects.ts
 *     pnpm tsx scripts/generate-redirects.ts --entrada otro.json --salida otro/vercel.json
 *     pnpm tsx scripts/generate-redirects.ts --ayuda
 *
 * Sólo I/O: la traducción de vocabulario (`origen`/`destino`/`permanente` →
 * `source`/`destination`/`permanent`) y las validaciones (sin loops, sin
 * `origen` repetido) viven en `formatoVercel()`, `lib/migracion/vercel.ts`,
 * que tiene test.
 *
 * Si ya existe un `vercel.json`, se conservan sus otras claves y sólo se
 * reemplaza `redirects` — el archivo no es sólo nuestro, Vercel también lee
 * `headers`, `rewrites`, etc. desde ahí.
 */

import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { formatoVercel } from '@/lib/migracion/vercel'

const AYUDA = `
Genera vercel.json a partir de las redirecciones que emitió la migración.

  --entrada <archivo>   Por omisión .migracion-wp/redirects.json
  --salida <archivo>    Por omisión vercel.json
  --ayuda               Esto
`

interface Opciones {
  entrada: string
  salida: string
  ayuda: boolean
}

function leerOpciones(argv: readonly string[]): Opciones {
  const valor = (nombre: string): string | undefined => {
    const indice = argv.indexOf(`--${nombre}`)
    return indice === -1 ? undefined : argv[indice + 1]
  }

  return {
    entrada: path.resolve(process.cwd(), valor('entrada') ?? '.migracion-wp/redirects.json'),
    salida: path.resolve(process.cwd(), valor('salida') ?? 'vercel.json'),
    ayuda: argv.includes('--ayuda'),
  }
}

const esquemaArchivoRedirects = z.object({
  generado: z.string(),
  origen: z.string(),
  redirecciones: z.array(
    z.object({
      origen: z.string(),
      destino: z.string(),
      permanente: z.literal(true),
    }),
  ),
})

async function main(): Promise<void> {
  const opciones = leerOpciones(process.argv.slice(2))

  if (opciones.ayuda) {
    console.log(AYUDA)
    return
  }

  if (!existsSync(opciones.entrada)) {
    throw new Error(
      `No existe ${path.relative(process.cwd(), opciones.entrada)}. Correr primero scripts/migrate-wp.ts.`,
    )
  }

  const crudo = JSON.parse(await readFile(opciones.entrada, 'utf8')) as unknown
  const { redirecciones } = esquemaArchivoRedirects.parse(crudo)

  const vercelJson: Record<string, unknown> = existsSync(opciones.salida)
    ? (JSON.parse(await readFile(opciones.salida, 'utf8')) as Record<string, unknown>)
    : {}

  vercelJson.redirects = formatoVercel(redirecciones)

  await writeFile(opciones.salida, `${JSON.stringify(vercelJson, null, 2)}\n`, 'utf8')

  console.log(
    `\n✓ ${redirecciones.length} redirecciones escritas en ${path.relative(process.cwd(), opciones.salida)}\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
