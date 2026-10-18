import { expect, test, type Page } from '@playwright/test'
import { HAY_CREDENCIALES, SIN_CREDENCIALES } from './credenciales'

/**
 * El panel: que las pantallas abran, que se llegue a todas desde la barra y
 * que los formularios se nieguen a guardar lo que está mal.
 *
 * **No crea ni borra datos, y es la única decisión de diseño del archivo.** La
 * suite corre contra la base de verdad —la misma que usa el sitio— y un test
 * que crea un equipo de prueba deja basura que después aparece en el `<select>`
 * de un partido real. Lo que se prueba es que las pantallas existan, carguen y
 * validen; los flujos completos de alta necesitan una base de test aparte.
 */

test.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES)

const SECCIONES = [
  { ruta: '/admin', titulo: 'Notas' },
  { ruta: '/admin/partidos', titulo: 'Partidos' },
  { ruta: '/admin/jugadoras', titulo: 'Jugadoras' },
  { ruta: '/admin/equipos', titulo: 'Equipos' },
  { ruta: '/admin/temporadas', titulo: 'Temporadas' },
  { ruta: '/admin/posteos', titulo: 'Posteos' },
]

test.describe('las secciones del panel', () => {
  for (const { ruta, titulo } of SECCIONES) {
    test(`${ruta} abre y se titula ${titulo}`, async ({ page }) => {
      await page.goto(ruta, { waitUntil: 'load' })

      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(1)
    })
  }

  test('a todas se llega desde la barra', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'load' })

    const barra = page.getByRole('navigation', { name: 'Secciones del panel' })
    for (const { ruta } of SECCIONES) {
      await expect(barra.locator(`a[href="${ruta}"]`)).toHaveCount(1)
    }
  })
})

/**
 * Lo que el panel tiene que negarse a guardar.
 *
 * Son casos que la base rechazaría igual con un CHECK, y por eso mismo
 * importan: si el formulario los deja pasar, el error llega como un 400 de
 * Postgres y el trabajo se pierde.
 */
test.describe('los formularios validan antes de escribir', () => {
  test('un equipo sin nombre no se guarda', async ({ page }) => {
    await page.goto('/admin/equipos/nuevo', { waitUntil: 'load' })

    await page.getByRole('button', { name: 'Crear el equipo' }).click()

    await expect(page.getByText('El nombre no puede quedar vacío')).toBeVisible()
    // Y sigue en la misma pantalla: no navegó al listado.
    await expect(page).toHaveURL(/\/admin\/equipos\/nuevo$/)
  })

  test('un equipo no puede jugar contra sí mismo', async ({ page }) => {
    await page.goto('/admin/partidos/nuevo', { waitUntil: 'load' })

    // `exact: true` en los tres: por omisión `getByLabel` matchea por
    // substring y "Local" también es parte de "Goles del local", así que el
    // locator resuelve a dos elementos y Playwright corta por modo estricto.
    // Vale para todo formulario de partido, que tiene las dos parejas.
    const local = page.getByLabel('Local', { exact: true })
    const opciones = await local.locator('option').all()
    test.skip(opciones.length < 2, 'La base no tiene equipos cargados todavía.')

    const uno = (await opciones[1].getAttribute('value')) as string
    await local.selectOption(uno)
    await page.getByLabel('Visitante', { exact: true }).selectOption(uno)

    await page.getByRole('button', { name: 'Crear el partido' }).click()

    await expect(page.getByText('Un equipo no puede jugar contra sí mismo')).toBeVisible()
  })

  test('un partido finalizado necesita el resultado', async ({ page }) => {
    await page.goto('/admin/partidos/nuevo', { waitUntil: 'load' })

    const opciones = await page.getByLabel('Local', { exact: true }).locator('option').all()
    test.skip(opciones.length < 3, 'La base necesita al menos dos equipos.')

    await page
      .getByLabel('Local', { exact: true })
      .selectOption((await opciones[1].getAttribute('value')) as string)
    await page
      .getByLabel('Visitante', { exact: true })
      .selectOption((await opciones[2].getAttribute('value')) as string)
    await page.getByLabel('Estado', { exact: true }).selectOption('finalizado')

    await page.getByRole('button', { name: 'Crear el partido' }).click()

    await expect(
      page.getByText('Un partido finalizado necesita el resultado').first(),
    ).toBeVisible()
  })
})

/**
 * El editor de notas, que es la pantalla que más se usa.
 *
 * No escribe ni guarda: verifica que la barra tenga los dos botones que se
 * agregaron esta sesión —imagen y planilla—, que eran el último pendiente del
 * Step 19 y no existían hasta ahora.
 */
test.describe('el editor de notas', () => {
  test('la barra tiene los dos nodos propios', async ({ page }) => {
    await page.goto('/admin/notas/nueva', { waitUntil: 'load' })

    await expect(page.getByRole('button', { name: 'Insertar una imagen' })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Embeber la planilla de un partido' }),
    ).toBeVisible()
  })

  test('el panel de la planilla se abre y se cierra', async ({ page }) => {
    await page.goto('/admin/notas/nueva', { waitUntil: 'load' })

    await page.getByRole('button', { name: 'Embeber la planilla de un partido' }).click()
    await expect(page.getByText('Embeber una planilla')).toBeVisible()

    await page.getByRole('button', { name: 'Cerrar' }).click()
    await expect(page.getByText('Embeber una planilla')).toHaveCount(0)
  })
})

/**
 * La carga de la tabla de posiciones, que es la única pantalla del panel donde
 * se escribe un dato deportivo a mano.
 *
 * **No guarda nada**, como el resto del archivo: lo que se prueba es con qué
 * filas abre el formulario, que es lo que decide si cargar una fecha son cuatro
 * correcciones o cien números tipeados de nuevo. La decisión en sí está testeada
 * sin navegador en `src/lib/entidades/tabla.test.ts`; acá se prueba el cableado
 * contra la base de verdad.
 */
test.describe('la tabla de posiciones', () => {
  /** El id de la temporada sale del listado: no se puede hardcodear. */
  async function irALaTabla(page: Page, fecha?: number) {
    await page.goto('/admin/temporadas', { waitUntil: 'load' })

    const link = page.locator('a[href^="/admin/tabla/"]').first()
    await expect(link).toBeVisible()
    const href = await link.getAttribute('href')

    await page.goto(fecha === undefined ? href! : `${href}?fecha=${fecha}`, {
      waitUntil: 'load',
    })
  }

  test('una fecha nueva abre precargada con la fecha anterior', async ({ page }) => {
    // Sin `?fecha=`, abre en la siguiente a la última cargada: la fecha nueva.
    await irALaTabla(page)

    const aviso = page.getByText(/Precargada con la tabla de la fecha|Primera fecha de la temporada/)
    await expect(aviso).toBeVisible()

    // Y con filas, que es el punto: precargada no es vacía.
    await expect(page.getByLabel('Puesto', { exact: false }).first()).toBeVisible()
  })

  test('una fecha ya cargada abre con lo suyo y lo dice', async ({ page }) => {
    await irALaTabla(page, 1)

    await expect(page.getByText(/La fecha 1 ya está cargada/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Guardar la fecha 1' })).toBeVisible()
  })

  /** Se carga desde el celular: el teclado numérico sale del tipo del input. */
  test('los números se cargan con teclado numérico', async ({ page }) => {
    await irALaTabla(page, 1)

    const ganados = page.locator('#ganados-0')
    await expect(ganados).toHaveAttribute('type', 'number')
    await expect(ganados).toHaveAttribute('inputmode', 'numeric')
  })
})
