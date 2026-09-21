/**
 * Las credenciales del panel y dónde queda su sesión.
 *
 * Vive en un archivo propio y **sin importar `@playwright/test`** porque lo
 * comparten un setup y un spec: importar `admin.setup.ts` desde
 * `admin.spec.ts` para reusar una constante vuelve a registrar el test del
 * setup y Playwright falla al cargar la suite.
 *
 * **Las credenciales salen del entorno y nunca del repo.** Sin ellas, los
 * tests del panel se saltean en lugar de fallar: la suite pública tiene que
 * poder correr en una máquina donde nadie cargó un usuario de prueba, y en CI
 * antes de que existan los secretos.
 *
 *     E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... pnpm test:e2e
 *
 * El usuario tiene que **tener fila en `autores`**, no sólo existir en Auth: el
 * layout del panel re-verifica eso —es el mismo criterio que `es_autor()` en
 * RLS— y sin la fila el login anda pero el panel rebota al login otra vez.
 */

/** La misma ruta que declara `playwright.config.ts`, que no puede importarla. */
export const SESION = 'e2e/.sesion-admin.json'

export const EMAIL = process.env.E2E_ADMIN_EMAIL
export const PASSWORD = process.env.E2E_ADMIN_PASSWORD

export const HAY_CREDENCIALES = Boolean(EMAIL && PASSWORD)

export const SIN_CREDENCIALES =
  'Sin E2E_ADMIN_EMAIL y E2E_ADMIN_PASSWORD no se puede entrar al panel.'
