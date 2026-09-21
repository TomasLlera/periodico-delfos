/**
 * Carga `.env.local` en `process.env`.
 *
 * `tsx` y Playwright no son Next: nadie lee el `.env.local` por nosotros. Vive
 * en un archivo propio porque lo necesitan tres lados —los dos scripts y
 * `e2e/credenciales.ts`— y tener tres copias de doce líneas garantiza que un
 * día se arreglen dos. No se usa `dotenv` para no sumar una dependencia por
 * esto.
 *
 * **Lo que ya está en el entorno le gana al archivo**, que es lo que permite
 * pisar una variable en una corrida puntual sin editar nada:
 *
 *     E2E_ADMIN_EMAIL=otro@ejemplo.com pnpm test:e2e
 *
 * El `.env.local` de esta máquina está en CRLF. El `\r` no entra en el valor
 * porque en JavaScript `.` no matchea un retorno de carro, así que lo come el
 * `\s*` del final; si alguna vez se cambia esa expresión, es lo primero a
 * mirar cuando una clave llegue con basura invisible al final.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export function cargarEnvLocal(raiz = process.cwd()): void {
  const archivo = path.resolve(raiz, '.env.local')
  if (!existsSync(archivo)) return

  for (const linea of readFileSync(archivo, 'utf8').split('\n')) {
    const par = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i.exec(linea)
    if (!par) continue
    const [, clave = '', bruto = ''] = par
    if (process.env[clave] !== undefined) continue
    process.env[clave] = bruto.replace(/^["']|["']$/g, '')
  }
}
