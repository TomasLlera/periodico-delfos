import { expect, test, type Page } from '@playwright/test'
import { HAY_CREDENCIALES, SIN_CREDENCIALES } from './credenciales'

/**
 * El editor de notas sin señal: que no se pierda nada y que no se duplique.
 *
 * Antes de esto, un corte al guardar dejaba la pantalla genérica de Next —una
 * línea en inglés, sin botones— y se llevaba la nota. Lo encontró una prueba
 * igual a esta, contra el formulario montado aparte.
 *
 * **Ningún pedido llega al servidor.** Como `admin.spec.ts`, esto corre contra
 * la base de verdad y no puede crear notas: cada Server Action se intercepta
 * y se corta, que además es exactamente la falla que se quiere probar. El
 * camino feliz —el reintento que de verdad guarda— necesita una base de test.
 */

test.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES)

const TITULO = 'Prueba e2e del borrador — no publicar'
const TEXTO = 'Párrafo escrito antes de que se cortara la señal.'

/** Corta todo Server Action. Devuelve cuántos se intentaron. */
async function sinServidor(page: Page): Promise<{ intentos: number }> {
  const contador = { intentos: 0 }
  await page.route('**/admin/notas/**', async (route) => {
    const pedido = route.request()
    if (pedido.method() !== 'POST' || !pedido.headers()['next-action']) return route.continue()
    contador.intentos++
    await route.abort('internetdisconnected')
  })
  return contador
}

async function escribir(page: Page) {
  await page.locator('#titulo').fill(TITULO)
  await page.locator('#bajada').fill('Bajada de prueba')
  await page.locator('.ProseMirror').click()
  await page.keyboard.type(TEXTO)
}

async function conserva(page: Page) {
  await expect(page.locator('#titulo')).toHaveValue(TITULO)
  await expect(page.locator('.ProseMirror')).toContainText(TEXTO)
}

test.describe('el editor de notas sin señal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/notas/nueva', { waitUntil: 'load' })
  })

  test('guardar sin respuesta avisa y no pierde lo escrito', async ({ page }) => {
    await sinServidor(page)
    await escribir(page)

    await page.getByRole('button', { name: 'Guardar borrador' }).click()

    await expect(page.getByText(/Sin conexión: no pudimos confirmar/)).toBeVisible()
    await expect(page.getByText(/Application error/)).toHaveCount(0)
    await conserva(page)
  })

  test('publicar sin respuesta no publica solo al volver la señal: pregunta', async ({ page, context }) => {
    const servidor = await sinServidor(page)
    await escribir(page)

    await page.getByRole('button', { name: 'Vista previa y publicar' }).click()
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Publicar', exact: true }).click()
    await expect(page.getByText(/te vamos a preguntar si publicarla/)).toBeVisible()

    const antes = servidor.intentos
    await context.setOffline(false)

    await expect(page.getByRole('button', { name: 'Publicar ahora' })).toBeVisible()
    expect(servidor.intentos).toBe(antes)
    await conserva(page)
  })

  test('al recargar ofrece el borrador, y recuperarlo trae título y cuerpo', async ({ page }) => {
    await escribir(page)
    // La pausa del autoguardado: un segundo sin tocar nada.
    await page.waitForTimeout(1600)

    await page.reload({ waitUntil: 'load' })
    await expect(page.getByRole('heading', { name: 'Hay un borrador sin guardar en este dispositivo' })).toBeVisible()

    await page.getByRole('button', { name: 'Recuperar' }).click()
    await conserva(page)

    // Y se limpia, para no dejar el borrador de la prueba en el navegador.
    await page.waitForTimeout(1600)
    await page.reload({ waitUntil: 'load' })
    await page.getByRole('button', { name: 'Descartar' }).click()
    await expect(page.getByRole('heading', { name: /Hay un borrador sin guardar/ })).toHaveCount(0)
  })

  test('abrir el editor y no escribir no deja borrador', async ({ page }) => {
    await page.waitForTimeout(1600)
    await page.reload({ waitUntil: 'load' })

    await expect(page.getByRole('heading', { name: /Hay un borrador sin guardar/ })).toHaveCount(0)
  })
})
