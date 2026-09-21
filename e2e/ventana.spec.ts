import { expect, test } from '@playwright/test'

/**
 * La ventana de la planilla: apretar un chip de la franja de resultados abre el
 * partido como modal, sin salir de la página.
 *
 * Viene de `e2e/borradores/ventana.js`. Lo que verifica no es un detalle de
 * interfaz: es que la ventana sea **un link de verdad** y no un `onClick`. De
 * ahí salen las cuatro propiedades que se prueban abajo —URL compartible,
 * historial, Escape, foco restaurado— y sobre todo la última, que es la que
 * nadie mira: sin JavaScript el chip tiene que navegar igual.
 *
 * Usa `/demo/fixture`, que dibuja doce fechas con datos inventados: la ruta
 * real depende de que haya partidos en la base.
 */

const FRANJA = '/demo/fixture'
const CHIPS = 'ol a[href^="/demo/fixture/"]'

test.describe('la ventana de la planilla', () => {
  test('la franja dibuja las doce fechas como links', async ({ page }) => {
    await page.goto(FRANJA, { waitUntil: 'load' })

    const chips = page.locator(CHIPS)
    await expect(chips).toHaveCount(12)

    // Un `href` de verdad es lo que hace que ande sin JS, que se pueda abrir
    // en otra pestaña y que el navegador lo muestre en la barra de estado.
    await expect(chips.first()).toHaveAttribute('href', /^\/demo\/fixture\//)
  })

  test('apretar un chip abre la ventana y cambia la URL', async ({ page }) => {
    await page.goto(FRANJA, { waitUntil: 'load' })

    await page.locator(CHIPS).first().click()

    const ventana = page.locator('dialog[open]')
    await expect(ventana).toBeVisible()

    // La URL es la del partido: es lo que se comparte y lo que queda en el
    // historial. Una ventana que no cambia la URL no se puede compartir.
    expect(page.url()).toContain('/demo/fixture/')

    // `showModal()` es lo que da trampa de foco y Escape sin escribirlos; el
    // nombre accesible es lo que hace que el lector de pantalla la anuncie
    // como algo y no como "diálogo".
    await expect(ventana).toHaveAttribute('aria-labelledby', 'titulo-ventana')
  })

  test('adentro está la planilla, y no desborda', async ({ page }) => {
    await page.goto(FRANJA, { waitUntil: 'load' })
    await page.locator(CHIPS).first().click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    // "Titulares" y "Suplentes" son los títulos que dibuja
    // `FormacionesPartido`. El borrador buscaba "Formaciones", que es el
    // nombre del componente y no aparece en pantalla en ningún lado.
    await expect(
      page.locator('dialog[open]').getByText(/Titulares/i).first(),
    ).toBeVisible()

    const medida = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      cliente: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }))
    expect(medida.doc).toBeLessThanOrEqual(medida.cliente)
    expect(medida.body).toBeLessThanOrEqual(medida.cliente)
  })

  test('Escape la cierra, vuelve a la franja y el foco vuelve al chip', async ({ page }) => {
    await page.goto(FRANJA, { waitUntil: 'load' })
    await page.locator(CHIPS).first().click()
    await expect(page.locator('dialog[open]')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page).toHaveURL(new RegExp(`${FRANJA}$`))

    // Que el foco vuelva al chip es lo que separa una ventana usable con
    // teclado de una que deja al usuario al principio de la página.
    const href = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? null)
    expect(href).toMatch(/^\/demo\/fixture\//)
  })

  test('entrar directo a la URL del partido da la página entera, no la ventana', async ({
    page,
  }) => {
    await page.goto(FRANJA, { waitUntil: 'load' })
    const href = await page.locator(CHIPS).first().getAttribute('href')

    await page.goto(href as string, { waitUntil: 'load' })

    await expect(page.locator('dialog[open]')).toHaveCount(0)
    await expect(page.locator('h1')).toHaveCount(1)
  })
})

/**
 * Lo que nadie prueba y es la razón de que la ventana sea un link.
 *
 * Con `javaScriptEnabled: false` la intercepción de Next no corre, así que el
 * chip tiene que comportarse como lo que es: un link a una página que existe.
 * Si algún día alguien lo cambia por un `onClick`, esto se cae.
 */
test.describe('sin JavaScript', () => {
  test.use({ javaScriptEnabled: false })

  test('el chip navega a la página entera', async ({ page }) => {
    await page.goto(FRANJA)
    await page.locator(CHIPS).first().click()
    await page.waitForLoadState('load')

    expect(page.url()).not.toMatch(new RegExp(`${FRANJA}$`))
    await expect(page.locator('dialog[open]')).toHaveCount(0)
  })
})
