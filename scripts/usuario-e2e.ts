/**
 * El usuario de prueba del panel, el que necesita `e2e/admin.spec.ts`.
 *
 *     pnpm tsx scripts/usuario-e2e.ts             # sólo mira y cuenta cómo está
 *     pnpm tsx scripts/usuario-e2e.ts --crear     # lo crea y guarda las claves
 *     pnpm tsx scripts/usuario-e2e.ts --ayuda
 *
 * Existe porque **el panel pide dos cosas y no una**: un usuario de Supabase
 * Auth y una fila en `autores` con el mismo UUID. Con la primera sola el login
 * anda y el layout del panel rebota al login sin decir por qué —es el mismo
 * criterio que `es_autor()` en `0008_rls.sql`— y es el error que más cuesta
 * diagnosticar de todo el panel. Hacerlo a mano en dos pantallas de la consola
 * de Supabase es exactamente donde se olvida el segundo paso.
 *
 * **Correr en seco es lo normal**, como en `migrate-wp.ts`: sin `--crear` no
 * escribe nada, ni en la base ni en el disco.
 *
 * Es idempotente: si el usuario ya existe le cambia la contraseña por una
 * nueva en lugar de fallar, que es lo que hace falta el día que se pierda.
 *
 * ── Por qué un usuario aparte y no el de Charlie ──
 *
 * Porque la suite corre contra la base de verdad. Entrar con la cuenta del
 * único autor del medio significa que un test que se cuelgue deja la sesión de
 * Charlie invalidada, y que cualquier cosa que llegue a escribirse queda
 * firmada por él. La fila de más en `autores` no se ve en ningún lado del
 * sitio público: no hay página de autores, y el nombre sólo sale en las notas
 * que firma — y ésta no firma ninguna.
 */

import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { cargarEnvLocal } from './env-local'

/**
 * El mail va a un dominio propio y no a `ejemplo.com`: Supabase Auth guarda la
 * dirección tal cual y un día alguien la mira en la consola: que se entienda
 * de dónde salió sin preguntar. No recibe correo ni hace falta que lo reciba,
 * porque el usuario se crea ya confirmado.
 */
const MAIL = 'e2e@periodicodelfos.com'
const NOMBRE = 'Usuario de prueba (e2e)'
const SLUG = 'usuario-de-prueba-e2e'

const AYUDA = `
Crea el usuario de prueba que usa la suite del panel.

  pnpm tsx scripts/usuario-e2e.ts             en seco: informa y no escribe
  pnpm tsx scripts/usuario-e2e.ts --crear     crea o repone, y guarda las claves
  pnpm tsx scripts/usuario-e2e.ts --mail x@y  usa otra dirección

Con --crear escribe E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD en .env.local (que
está en .gitignore). Es lo único que toca de ese archivo.
`.trim()

function valorDeBandera(nombre: string): string | undefined {
  const i = process.argv.indexOf(`--${nombre}`)
  return i === -1 ? undefined : process.argv[i + 1]
}

/**
 * Una contraseña que nadie va a escribir a mano.
 *
 * `base64url` no trae caracteres que haya que escapar en una línea de `.env`
 * ni en una shell, que es de donde sale la mitad de los problemas de una clave
 * generada.
 */
function claveNueva(): string {
  return randomBytes(24).toString('base64url')
}

/**
 * Deja las dos claves en `.env.local`, reemplazando las que hubiera.
 *
 * Se reescribe el archivo entero con las mismas líneas salvo esas dos porque
 * apendear a ciegas deja dos definiciones de la misma variable y gana una que
 * depende del orden de lectura. Se respeta el fin de línea que ya tenga el
 * archivo: el de esta máquina está en CRLF y mezclarlos ensucia un diff que
 * nadie va a ver, porque el archivo no se commitea, pero se abre a mano.
 */
function guardarEnEnvLocal(raiz: string, claves: Record<string, string>): void {
  const archivo = path.resolve(raiz, '.env.local')
  const previo = existsSync(archivo) ? readFileSync(archivo, 'utf8') : ''
  const finDeLinea = previo.includes('\r\n') ? '\r\n' : '\n'

  const nombres = Object.keys(claves)
  const conservadas = previo
    .split(/\r?\n/)
    .filter((linea) => !nombres.some((clave) => new RegExp(`^\\s*${clave}\\s*=`).test(linea)))

  const bloque = [
    '',
    '# ── Suite del panel (scripts/usuario-e2e.ts) ─────────────',
    '# Usuario de prueba con fila en `autores`. No commitear.',
    ...nombres.map((clave) => `${clave}=${claves[clave]}`),
  ]

  // Se normaliza la cola para no acumular líneas en blanco entre corridas.
  while (conservadas.length > 0 && conservadas[conservadas.length - 1]?.trim() === '') {
    conservadas.pop()
  }

  writeFileSync(archivo, [...conservadas, ...bloque, ''].join(finDeLinea), 'utf8')
}

async function main(): Promise<void> {
  if (process.argv.includes('--ayuda')) {
    console.log(AYUDA)
    return
  }

  const raiz = process.cwd()
  cargarEnvLocal(raiz)

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !servicio) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Completá .env.local desde .env.example.',
    )
  }

  const mail = valorDeBandera('mail') ?? process.env.E2E_ADMIN_EMAIL ?? MAIL
  const escribir = process.argv.includes('--crear')

  // Service role: crear usuarios es una operación de administrador y la fila de
  // `autores` la escribe alguien que todavía no es autor, así que RLS la
  // rechazaría. Nunca sale de este script ni de `lib/supabase/admin.ts`.
  const supabase = createClient(url, servicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: usuarios, error: errorLista } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  })
  if (errorLista) throw errorLista

  const existente = usuarios.users.find((u) => u.email?.toLowerCase() === mail.toLowerCase())

  console.log(`Base:    ${url}`)
  console.log(`Mail:    ${mail}`)
  console.log(`En Auth: ${existente ? `sí (${existente.id})` : 'no'}`)

  if (existente) {
    const { data: fila } = await supabase
      .from('autores')
      .select('id, nombre, slug')
      .eq('id', existente.id)
      .maybeSingle()
    console.log(`Autor:   ${fila ? `sí (${fila.slug})` : 'NO — el panel lo va a rebotar al login'}`)
  }

  if (!escribir) {
    console.log('\nEn seco: no se escribió nada. Con --crear lo crea o le repone la clave.')
    return
  }

  const clave = claveNueva()
  let id: string

  if (existente) {
    const { error } = await supabase.auth.admin.updateUserById(existente.id, { password: clave })
    if (error) throw error
    id = existente.id
    console.log('\nUsuario ya existía: se le puso una contraseña nueva.')
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: mail,
      password: clave,
      // Sin esto el usuario queda pendiente de confirmar y el login falla con
      // "Email not confirmed", que no se parece en nada a la causa.
      email_confirm: true,
    })
    if (error) throw error
    id = data.user.id
    console.log('\nUsuario creado en Auth.')
  }

  // `autores.id` es FK a `auth.users(id)`: el UUID no se inventa, sale de Auth.
  const { error: errorAutor } = await supabase
    .from('autores')
    .upsert({ id, nombre: NOMBRE, slug: SLUG }, { onConflict: 'id' })
  if (errorAutor) throw errorAutor
  console.log(`Fila en autores: ${SLUG}`)

  guardarEnEnvLocal(raiz, { E2E_ADMIN_EMAIL: mail, E2E_ADMIN_PASSWORD: clave })
  console.log('\nE2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD quedaron en .env.local.')
  console.log('Ya se puede correr: pnpm test:e2e')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
