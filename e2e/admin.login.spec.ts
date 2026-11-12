import { expect, test, type Page } from '@playwright/test'
import { EMAIL, HAY_CREDENCIALES, PASSWORD, SIN_CREDENCIALES } from './credenciales'

/**
 * El ingreso al panel, de punta a punta.
 *
 * **Es lo único de la suite que entra de verdad.** `admin.setup.ts` también
 * hace login, pero su trabajo es dejar la sesión guardada para los demás tests:
 * si el login se rompiera, el setup fallaría con "no apareció la barra del
 * panel" y habría que adivinar en qué paso. Acá cada paso del camino es un test
 * con su nombre, así que un rojo dice qué se rompió: la validación, las
 * credenciales, la redirección o la sesión.
 *
 * **Corre sin la sesión guardada**, al revés que `admin.spec.ts`. Es la razón
 * de que sea un proyecto aparte en `playwright.config.ts` y de que no dependa
 * de `entrar`: con `storageState` puesto, la primera visita a `/admin/login`
 * ya estaría logueada y no habría nada que probar.
 *
 * **Un solo tamaño y un solo tema.** Entrar no cambia con el ancho de la
 * pantalla, y correrlo en los cuatro proyectos del sitio público serían cuatro
 * logins por corrida contra Supabase Auth, que tiene límite de intentos. Es la
 * misma razón por la que el panel es un proyecto solo.
 *
 * Sin `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` se saltea en vez de fallar: la
 * suite tiene que poder correr en una máquina donde nadie cargó el usuario de
 * prueba. Se crean con `pnpm tsx scripts/usuario-e2e.ts --crear`.
 */

/**
 * El aviso de error del formulario, **acotado al `<form>`**.
 *
 * Un `getByRole('alert')` pelado no sirve acá y vale saber por qué: Next monta
 * su propio anunciador de rutas —`<div role="alert" id="__next-route-announcer__">`,
 * vacío— en todas las páginas, así que la búsqueda encuentra dos y Playwright
 * falla por ambigüedad en vez de por el aviso.
 *
 * Sigue buscando por rol y no por clase ni por texto: que el error tenga
 * `role="alert"` es parte de lo que se prueba, porque es lo que hace que un
 * lector de pantalla lo cante al aparecer.
 */
function avisoDelFormulario(page: Page) {
  return page.locator('form').getByRole('alert')
}

test.describe('el ingreso al panel', () => {
  test.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES)

  test('sin sesión, cualquier pantalla del panel lleva al login', async ({ page }) => {
    await page.goto('/admin/notas/nueva')

    await expect(page).toHaveURL(/\/admin\/login/)

    // De dónde venía queda en la URL: es lo que después lo devuelve ahí. Sin
    // esto, entrar desde un link a una nota te deja en el listado y hay que
    // volver a buscarla.
    expect(page.url()).toContain('volver=%2Fadmin%2Fnotas%2Fnueva')
  })

  test('el formulario pide el mail antes de mandar nada', async ({ page }) => {
    await page.goto('/admin/login')

    // El campo es `required`: lo frena el navegador y el formulario no viaja,
    // así que seguimos en la misma pantalla sin ningún aviso del servidor.
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByLabel('Mail')).toBeFocused()
  })

  /**
   * **Y lo dice con un 400, que ahora se puede afirmar.** El formulario entra
   * por `POST /api/auth/login`: un pedido mal armado es 400 y unas credenciales
   * que no sirven son 401, dos hechos distintos con dos códigos distintos.
   * Cuando esto era un Server Action los dos eran 200 y no había nada que
   * mirar más que el texto en pantalla.
   */
  test('con el mail puesto y sin contraseña lo dice el servidor, con un 400', async ({ page }) => {
    await page.goto('/admin/login')

    const respuesta = page.waitForResponse('**/api/auth/login')

    await page.getByLabel('Mail').fill(EMAIL as string)
    await page.getByRole('button', { name: 'Entrar' }).click()

    expect((await respuesta).status()).toBe(400)
    await expect(avisoDelFormulario(page)).toHaveText('Falta la contraseña')
  })

  /**
   * **El mensaje es el mismo para "no existe" y para "contraseña equivocada",
   * y eso es la prueba, no un detalle.** Distinguirlos le confirmaría a
   * cualquiera qué mails tienen cuenta en el panel. Si alguien algún día
   * "mejora" el mensaje para que sea más útil, este test se pone rojo.
   */
  test('con la contraseña equivocada no entra, da 401 y no dice qué falló', async ({ page }) => {
    await page.goto('/admin/login')

    const respuesta = page.waitForResponse('**/api/auth/login')

    await page.getByLabel('Mail').fill(EMAIL as string)
    await page.getByLabel('Contraseña').fill('esta-no-es-la-contrasena')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // **El assert que antes no se podía escribir.** Con el Server Action esto
    // era un 200 con el error adentro del cuerpo, igual que un login correcto.
    expect((await respuesta).status()).toBe(401)

    await expect(avisoDelFormulario(page)).toHaveText('No pudimos entrar con esos datos.')
    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('con un mail que no tiene cuenta dice exactamente lo mismo', async ({ page }) => {
    await page.goto('/admin/login')

    const respuesta = page.waitForResponse('**/api/auth/login')

    await page.getByLabel('Mail').fill('nadie-con-este-mail@periodicodelfos.com')
    await page.getByLabel('Contraseña').fill('cualquier-cosa')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Mismo código y mismo mensaje que la contraseña equivocada: distinguirlos
    // le confirmaría a cualquiera qué mails tienen cuenta en el panel.
    expect((await respuesta).status()).toBe(401)
    await expect(avisoDelFormulario(page)).toHaveText('No pudimos entrar con esos datos.')
  })

  test('con los datos bien entra y ve la barra del panel', async ({ page }) => {
    await page.goto('/admin/login')

    await page.getByLabel('Mail').fill(EMAIL as string)
    await page.getByLabel('Contraseña').fill(PASSWORD as string)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Que la URL cambie no alcanza: el layout del panel rebota al login si el
    // usuario no tiene fila en `autores` —es el mismo criterio que `es_autor()`
    // en RLS—. Lo que confirma que se entró es la barra.
    await expect(page.getByRole('navigation', { name: 'Secciones del panel' })).toBeVisible()
    await expect(page).toHaveURL(/\/admin$/)
  })

  test('después de entrar vuelve a la pantalla de la que lo echaron', async ({ page }) => {
    await page.goto('/admin/partidos')

    await expect(page).toHaveURL(/volver=%2Fadmin%2Fpartidos/)

    await page.getByLabel('Mail').fill(EMAIL as string)
    await page.getByLabel('Contraseña').fill(PASSWORD as string)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/\/admin\/partidos$/)
  })

  test('al salir se cierra la sesión de verdad', async ({ page }) => {
    await page.goto('/admin/login')
    await page.getByLabel('Mail').fill(EMAIL as string)
    await page.getByLabel('Contraseña').fill(PASSWORD as string)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page.getByRole('navigation', { name: 'Secciones del panel' })).toBeVisible()

    await page.getByRole('button', { name: 'Salir' }).click()
    await expect(page).toHaveURL(/\/admin\/login/)

    // **Lo que importa es esto y no la redirección.** Si `signOut()` no borrara
    // la cookie, volver a `/admin` entraría igual y la pantalla de login sería
    // decorativa.
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/login/)
  })
})
