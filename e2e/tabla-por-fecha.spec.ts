import { expect, test } from '@playwright/test'

/**
 * El selector de fecha de la tabla de posiciones.
 *
 * **Es el único pedazo de la tabla que no se puede testear con vitest.** Todo
 * lo que decide qué fila va dónde es lógica pura y está cubierto en
 * `src/lib/temporada.test.ts`; lo que falta probar es el contrato con el
 * navegador, que no es lógica: que el click no navegue, que la URL quede
 * compartible, que entrar con `?fecha=` abra esa fecha y que el teclado alcance.
 *
 * Corre contra `/demo/temporada` y no contra una temporada real **a propósito**:
 * las dos fechas de la demo son datos falsos congelados en
 * `src/app/demo/temporada/datos-demo.ts`, así que el test no depende de cuántas
 * fechas haya cargado Charlie esta semana. Es la misma razón por la que los
 * datos falsos viven encerrados en `src/app/demo/` (CONTRIBUTING).
 */
const DEMO = '/demo/temporada'

/** La sección de la pestaña 2, que es la que tiene el selector. */
const TABLA = 'section:has(h2#demo-tabla)'

test('abre en la última fecha cargada', async ({ page }) => {
  await page.goto(DEMO, { waitUntil: 'load' })

  const tabla = page.locator(TABLA)
  await expect(tabla.getByRole('button', { name: '12', pressed: true })).toBeVisible()
  await expect(tabla.locator('caption')).toContainText('terminar la fecha 12')
})

test('cambiar de fecha escribe la URL y no recarga la página', async ({ page }) => {
  await page.goto(DEMO, { waitUntil: 'load' })

  const tabla = page.locator(TABLA)

  // Si el click navegara, esto se perdería: es la prueba de que no navega.
  await page.evaluate(() => {
    ;(window as unknown as { noRecargo: boolean }).noRecargo = true
  })

  await tabla.getByRole('button', { name: '11', exact: true }).click()

  await expect(tabla.locator('caption')).toContainText('terminar la fecha 11')
  expect(new URL(page.url()).searchParams.get('fecha')).toBe('11')
  expect(await page.evaluate(() => (window as { noRecargo?: boolean }).noRecargo)).toBe(true)
})

test('entrar con ?fecha= abre esa fecha', async ({ page }) => {
  await page.goto(`${DEMO}?fecha=11`, { waitUntil: 'load' })

  const tabla = page.locator(TABLA)
  await expect(tabla.getByRole('button', { name: '11', pressed: true })).toBeVisible()
  await expect(tabla.locator('caption')).toContainText('terminar la fecha 11')
})

/**
 * En la primera fecha cargada no hay con qué comparar, así que no se dibuja
 * ningún indicador. El texto alternativo es lo que se cuenta —y no la flecha—
 * porque es el que tiene que estar: la flecha sola no la lee nadie.
 */
test('la primera fecha cargada no muestra indicadores y la siguiente sí', async ({ page }) => {
  await page.goto(`${DEMO}?fecha=11`, { waitUntil: 'load' })

  const tabla = page.locator(TABLA)
  const indicadores = tabla.locator('tbody .sr-only')

  await expect(indicadores).toHaveCount(0)

  await tabla.getByRole('button', { name: '12', exact: true }).click()
  await expect(tabla.locator('caption')).toContainText('terminar la fecha 12')

  // Diez equipos, diez indicadores: dos se movieron y ocho mantuvieron.
  await expect(indicadores).toHaveCount(10)
  await expect(tabla.getByText('Subió 1 puesto')).toBeAttached()
  await expect(tabla.getByText('Bajó 1 puesto')).toBeAttached()
  await expect(tabla.getByText('Mantiene el puesto').first()).toBeAttached()
})

test('el selector se opera con el teclado', async ({ page }) => {
  await page.goto(DEMO, { waitUntil: 'load' })

  const tabla = page.locator(TABLA)
  await tabla.getByRole('button', { name: '11', exact: true }).focus()
  await page.keyboard.press('Enter')

  await expect(tabla.locator('caption')).toContainText('terminar la fecha 11')
})
