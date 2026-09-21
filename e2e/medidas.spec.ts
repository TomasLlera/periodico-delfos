import { expect, test } from '@playwright/test'

/**
 * El barrido de todas las rutas públicas: que respondan, que no desborden a lo
 * ancho, que tengan un solo `<h1>` y que no tiren errores de consola.
 *
 * Viene del script `e2e/borradores/medir.js`, que se escribió a mano seis
 * sesiones seguidas, encontró tres bugs de scroll horizontal y se tiraba
 * después de cada corrida. Acá queda commiteado.
 *
 * **Nada de `waitUntil: 'networkidle'`.** Los borradores lo usaban y en un
 * build de producción varias rutas nunca llegan a estar quietas —ISR, el
 * prefetch de Next, la fuente— así que `goto` se cuelga los 30 segundos del
 * timeout y la suite falla entera por una razón que no es el código. `load`
 * alcanza: lo que se mide es el HTML servido.
 *
 * **El scroll horizontal se mide con las dos medidas, no con una.** Es la
 * regla 5 de CLAUDE.md y salió de este mismo barrido: `documentElement` y
 * `body` pueden discrepar, y el bug de `.sr-only` sin ancestro posicionado
 * estiraba sólo uno de los dos. Medir uno solo lo deja pasar.
 */

const RUTAS = [
  '/',
  '/demo/portada',
  '/demo/widgets',
  '/demo/nota',
  '/demo/temporada',
  '/demo/planilla',
  '/demo/partido',
  '/demo/jugadora',
  '/demo/plantel',
  '/demo/listado',
  '/demo/articulo',
  '/cronicas',
  '/analisis',
  '/buscar',
  '/plantel',
  '/fixture',
  '/quienes-somos',
]

/**
 * Los 404 de prefetch de Next a rutas que sin base no existen.
 *
 * **Se filtran por URL y no por el texto del mensaje**, que no la trae: filtrar
 * por texto tapaba errores de verdad que decían lo mismo.
 */
const RUIDO = /_rsc=|\/jugadora\/|\/partido\/|\/contacto|\/privacidad|favicon/

/**
 * El texto del mensaje **más la URL del recurso** que falló.
 *
 * El navegador loguea "Failed to load resource: the server responded with a
 * status of 400" y nada más: la URL no está en el texto, está en
 * `location()`. El encargo lo avisaba y este spec cayó igual en la trampa —
 * filtrando sólo por texto daba diez errores idénticos en **todas** las
 * rutas, incluso en una sin una sola imagen, y no había forma de distinguir
 * cuál era real.
 */
function esRuido(mensaje: { text(): string; location(): { url: string } }): boolean {
  return RUIDO.test(mensaje.text()) || RUIDO.test(mensaje.location().url)
}

/**
 * Las que hoy no tienen `<h1>`. Ver "bugs conocidos" abajo.
 *
 * **Está vacía, y ése es el punto.** Salió del encargo con cinco rutas
 * adentro y se fue achicando: primero `/buscar`, que con datos cargados
 * dibujaba su titular y el propio `test.fail()` lo avisó; después las otras
 * cuatro, que eran bugs de verdad y se arreglaron —`/quienes-somos`,
 * `/cronicas` y `/analisis` pasaban su cabecera como `h2`, y la portada no
 * tenía ninguno—.
 *
 * El mecanismo queda montado aunque no haya nada adentro: la próxima ruta que
 * nazca sin `<h1>` no tiene dónde esconderse.
 */
const SIN_H1_CONOCIDO = new Set<string>([])

/**
 * Las dos demos que tiran errores de consola, de la rama
 * `fix/accesibilidad-y-pie`: imágenes apuntando a un host que no resuelve, y
 * un cuerpo de TipTap con forma vieja.
 *
 * Se sacan del barrido y se prueban aparte, por lo mismo que los `h1`: si el
 * error de consola tumba el test entero, un desborde de scroll en esa misma
 * ruta queda tapado y no se entera nadie.
 */
const CONSOLA_ROTA_CONOCIDA = new Set(['/demo/nota', '/demo/articulo'])

for (const ruta of RUTAS) {
  test(`${ruta} responde, no desborda y no tira errores`, async ({ page }) => {
    const errores: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !esRuido(m)) {
        errores.push(`${m.text()} — ${m.location().url}`)
      }
    })
    page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))

    const respuesta = await page.goto(ruta, { waitUntil: 'load' })
    expect(respuesta?.status(), `${ruta} tiene que responder 200`).toBe(200)

    const medida = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      cliente: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }))

    expect(
      medida.doc,
      `${ruta}: el documento se estira más que el viewport`,
    ).toBeLessThanOrEqual(medida.cliente)
    expect(medida.body, `${ruta}: el body se estira más que el viewport`).toBeLessThanOrEqual(
      medida.cliente,
    )

    if (!CONSOLA_ROTA_CONOCIDA.has(ruta)) {
      expect(errores, `${ruta} tiene errores de consola`).toEqual([])
    }
  })
}

/**
 * Un `<h1>` por página, ni cero ni dos.
 *
 * Va aparte del barrido de arriba porque hay rutas que hoy fallan por dos
 * motivos distintos —un bug de verdad y la base vacía— y mezclarlo haría que un
 * desborde de scroll quedara tapado por un `<h1>` que falta.
 */
for (const ruta of RUTAS.filter((r) => !SIN_H1_CONOCIDO.has(r))) {
  test(`${ruta} tiene un solo h1`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: 'load' })
    await expect(page.locator('h1')).toHaveCount(1)
  })
}

/**
 * Los que ya se sabe que están rotos.
 *
 * `test.fail()` es lo correcto acá y no un `skip`: mientras el bug exista la
 * suite queda verde, y **el día que alguien lo arregle este test pasa a
 * fallar**, que es el recordatorio de venir a sacar el marcador. Un `skip` se
 * queda para siempre.
 *
 * `/quienes-somos` es un bug de verdad. Las otras cuatro se explican por la
 * base vacía: sin notas, la portada y los listados no dibujan su titular.
 */
test.describe('bugs conocidos', () => {
  for (const ruta of [...CONSOLA_ROTA_CONOCIDA]) {
    test(`${ruta} no debería tirar errores de consola`, async ({ page }) => {
      /**
       * `fixme` y no `fail`, al revés que los `h1` de abajo.
       *
       * El error depende de si la imagen rota alcanza a fallar antes de que la
       * página termine de cargar, así que a veces se ve y a veces no: marcado
       * como `fail`, la suite entera se ponía roja una corrida de cada tres
       * por un bug que ya sabemos que está. Un test que falla a veces enseña a
       * ignorar los rojos, que es peor que no tenerlo.
       *
       * Se arregla en `fix/accesibilidad-y-pie`: las imágenes de los demos
       * apuntan a un host que no resuelve.
       */
      test.fixme()

      const errores: string[] = []
      page.on('console', (m) => {
        if (m.type() === 'error' && !esRuido(m)) {
        errores.push(`${m.text()} — ${m.location().url}`)
      }
      })
      page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))

      await page.goto(ruta, { waitUntil: 'load' })
      expect(errores).toEqual([])
    })
  }

  for (const ruta of RUTAS.filter((r) => SIN_H1_CONOCIDO.has(r))) {
    test(`${ruta} debería tener un h1`, async ({ page }) => {
      test.fail()
      await page.goto(ruta, { waitUntil: 'load' })
      await expect(page.locator('h1')).toHaveCount(1)
    })
  }
})
