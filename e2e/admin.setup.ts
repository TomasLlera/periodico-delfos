import { expect, test as setup } from '@playwright/test'
import { EMAIL, HAY_CREDENCIALES, PASSWORD, SESION, SIN_CREDENCIALES } from './credenciales'

/**
 * Entrar una sola vez y dejar la sesión guardada para todos los tests del
 * panel.
 *
 * Es un `setup` de Playwright y no un `beforeEach`: hacer login antes de cada
 * test son veinte logins contra Supabase Auth por corrida, y Supabase tiene
 * límite de intentos. Se entra una vez, se guarda el estado del navegador en
 * `SESION` y los tests del panel lo reusan.
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
setup('entrar al panel', async ({ page }) => {
  setup.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES)

  await page.goto('/admin/login')

  await page.getByLabel('Mail').fill(EMAIL as string)
  await page.getByLabel('Contraseña').fill(PASSWORD as string)
  await page.getByRole('button', { name: 'Entrar' }).click()

  // Que la URL cambie no alcanza: el layout del panel puede rebotar al login
  // si el usuario no tiene fila en `autores`. Lo que confirma que se entró es
  // la barra del panel.
  await expect(page.getByRole('navigation', { name: 'Secciones del panel' })).toBeVisible()

  await page.context().storageState({ path: SESION })
})
