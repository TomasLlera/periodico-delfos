import { cargarEnvLocal } from '../scripts/env-local'

/**
 * Las credenciales del panel y dónde queda su sesión.
 *
 * Vive en un archivo propio y **sin importar `@playwright/test`** porque lo
 * comparten un setup y un spec: importar `admin.setup.ts` desde
 * `admin.spec.ts` para reusar una constante vuelve a registrar el test del
 * setup y Playwright falla al cargar la suite. Por la misma razón lo puede
 * leer `playwright.config.ts`, que decide con esto si arma los proyectos del
 * panel.
 *
 * **Las credenciales salen del entorno o de `.env.local`, nunca del repo.**
 * `.env.local` está en `.gitignore` y es donde ya viven las claves de Supabase;
 * las dos de acá las deja `scripts/usuario-e2e.ts`. Se leen de ahí porque
 * pasarlas a mano en cada corrida es exactamente cómo la suite del panel
 * estuvo escrita y sin correr una sola vez: sin las variables los doce tests
 * no se saltean, ni se arman.
 *
 *     pnpm tsx scripts/usuario-e2e.ts --crear    # una vez, y ya
 *     E2E_ADMIN_EMAIL=otro@ejemplo.com pnpm test:e2e   # pisa el archivo
 *
 * El usuario tiene que **tener fila en `autores`**, no sólo existir en Auth: el
 * layout del panel re-verifica eso —es el mismo criterio que `es_autor()` en
 * RLS— y sin la fila el login anda pero el panel rebota al login otra vez. El
 * script se ocupa de las dos cosas.
 */

cargarEnvLocal()

/** La misma ruta que declara `playwright.config.ts`, que no puede importarla. */
export const SESION = 'e2e/.sesion-admin.json'

export const EMAIL = process.env.E2E_ADMIN_EMAIL
export const PASSWORD = process.env.E2E_ADMIN_PASSWORD

export const HAY_CREDENCIALES = Boolean(EMAIL && PASSWORD)

export const SIN_CREDENCIALES =
  'Sin E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD no se puede entrar al panel. Corré: pnpm tsx scripts/usuario-e2e.ts --crear'
