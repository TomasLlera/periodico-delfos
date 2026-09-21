import { expect, test } from '@playwright/test'

/**
 * La auditoría de SEO del Step 20, automatizada.
 *
 * El Build Order la pide junto con las de accesibilidad y performance, y las
 * tres tienen el mismo problema: hechas a mano una vez, no vuelven a hacerse
 * nunca y la regresión entra sin que nadie se entere. Esto mira **el HTML
 * servido**, no el código, que es la única forma de encontrar lo que ya
 * encontró: `og:site_name` y `og:locale` estaban puestos una sola vez en el
 * layout raíz y faltaban en todas las páginas que definen su propio
 * `openGraph`, porque Next lo pisa entero en vez de completarlo. Leyendo los
 * archivos eso no se ve.
 *
 * **Corre en un solo proyecto.** A diferencia de la de accesibilidad, acá los
 * cuatro viewports no aportan nada: ninguna de estas etiquetas depende del
 * ancho ni del tema, y correrla cuatro veces sería multiplicar por cuatro el
 * mismo resultado.
 *
 * Lo que esto NO cubre, y hay que mirar a mano: si el título describe la
 * página o sólo la nombra, si la bajada da ganas de entrar, y si los datos
 * estructurados pasan el validador de Google (que exige su propio servicio).
 */

/**
 * Las rutas que existen siempre, con base cargada o vacía.
 *
 * `/buscar` y las de `/demo` van aparte: se verifica lo contrario, que estén
 * fuera del índice.
 */
const RUTAS_FIJAS = ['/', '/cronicas', '/analisis', '/quienes-somos']

/**
 * El largo máximo del `<title>` de las páginas fijas.
 *
 * 70 caracteres es donde Google empieza a cortar. Se exige sólo acá: el título
 * de una nota o de un partido lo arma el contenido —"Aldosivi 6 - 1 Claypole ·
 * Fecha 4 · Primera B 2026"— y un nombre de club largo lo pasa sin que haya
 * nada que arreglar. El sufijo ` · Periódico Delfos` que agrega el template
 * cuenta, porque es lo que se ve en el buscador.
 */
const LARGO_TITULO = 70

/** Lo que tiene que emitir toda página que se indexa. */
async function etiquetasDe(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const meta = (selector: string) =>
      document.querySelector(selector)?.getAttribute('content')?.trim() ?? null

    return {
      titulo: document.title.trim(),
      lang: document.documentElement.lang,
      descripcion: meta('meta[name="description"]'),
      canonica: document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
      robots: meta('meta[name="robots"]'),
      ogTitulo: meta('meta[property="og:title"]'),
      ogDescripcion: meta('meta[property="og:description"]'),
      ogImagen: meta('meta[property="og:image"]'),
      ogSitio: meta('meta[property="og:site_name"]'),
      ogLocale: meta('meta[property="og:locale"]'),
      ogTipo: meta('meta[property="og:type"]'),
      twitterCard: meta('meta[name="twitter:card"]'),
      titulos: document.querySelectorAll('title').length,
    }
  })
}

for (const ruta of RUTAS_FIJAS) {
  test(`${ruta} tiene la metadata que se indexa`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: 'load' })
    const e = await etiquetasDe(page)

    expect(e.titulo, 'sin <title> la página se lista con la URL').not.toBe('')
    expect(e.titulos, 'dos <title> y el buscador elige uno').toBe(1)
    expect(e.titulo.length, `el título mide ${e.titulo.length}: "${e.titulo}"`).toBeLessThanOrEqual(
      LARGO_TITULO,
    )

    // Sin description Google inventa una con el primer texto que encuentra,
    // que en este sitio es el menú de navegación.
    expect(e.descripcion, 'sin meta description').toBeTruthy()

    expect(e.lang, 'la regla no negociable 9: lang="es-AR"').toBe('es-AR')

    // La canonical evita que `?pagina=1`, `?ver=tabla` y el dominio con y sin
    // www se indexen como páginas distintas.
    expect(e.canonica, 'sin canonical').toBeTruthy()
    expect(e.canonica, 'la canonical tiene que ser absoluta').toMatch(/^https?:\/\//)
    expect(e.canonica, 'una canonical con querystring no es canonical').not.toContain('?')

    // La tarjeta de redes completa. Charlie comparte cada nota a mano en tres
    // redes: si falta la imagen, sale el rectángulo gris con el dominio.
    expect(e.ogTitulo, 'sin og:title').toBeTruthy()
    expect(e.ogDescripcion, 'sin og:description').toBeTruthy()
    expect(e.ogImagen, 'sin og:image se comparte como un rectángulo gris').toBeTruthy()
    expect(e.ogImagen, 'og:image tiene que ser una URL absoluta').toMatch(/^https?:\/\//)
    expect(e.ogTipo, 'sin og:type').toBeTruthy()

    // Los dos que se perdían cuando una página definía su propio `openGraph`.
    expect(e.ogSitio, 'sin og:site_name: lo pisa el openGraph de la página').toBe(
      'Periódico Delfos',
    )
    expect(e.ogLocale, 'sin og:locale: lo pisa el openGraph de la página').toBe('es_AR')

    expect(e.twitterCard, 'sin twitter:card X muestra el link pelado').toBeTruthy()
  })

  test(`${ruta} apunta la canonical a sí misma`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: 'load' })
    const { canonica } = await etiquetasDe(page)

    // Se compara el camino y no la URL entera: la canonical se arma con
    // `NEXT_PUBLIC_SITE_URL`, que no es el host contra el que corre la suite.
    // Una canonical que apunta a otra página es peor que no tenerla: le dice
    // al buscador que esta página no existe.
    const camino = new URL(canonica as string).pathname.replace(/\/$/, '')
    expect(camino).toBe(ruta.replace(/\/$/, ''))
  })
}

/**
 * Las páginas con datos de verdad, tomadas del sitemap.
 *
 * No están escritas a mano a propósito: los slugs dependen de lo que haya
 * cargado en la base, y un test que nombra `fecha-4-aldosivi-claypole-2026` se
 * pone en rojo el día que ese partido se borre. Si la base está vacía el
 * sitemap trae sólo las fijas y el test se saltea.
 */
test('las páginas de contenido comparten con imagen', async ({ page, request }) => {
  // Son cuatro o cinco navegaciones en un solo test: con los 30 segundos de
  // omisión alcanza contra `next start`, y no contra el dev server, que
  // compila cada ruta la primera vez que se la pide.
  test.setTimeout(90_000)

  const xml = await (await request.get('/sitemap.xml')).text()
  const caminos = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => new URL(url as string).pathname)
    .filter((camino) => /^\/(nota|partido|jugadora|temporada|plantel)\//.test(camino))

  test.skip(caminos.length === 0, 'La base no tiene contenido cargado todavía.')

  // Una de cada tipo alcanza: lo que se verifica es que la página arme la
  // tarjeta, no el contenido de cada fila de la base.
  const tipos = new Map<string, string>()
  for (const camino of caminos) {
    const tipo = camino.split('/')[1] as string
    if (!tipos.has(tipo)) tipos.set(tipo, camino)
  }

  for (const camino of tipos.values()) {
    await page.goto(camino, { waitUntil: 'load' })
    const e = await etiquetasDe(page)

    expect(e.titulo, `${camino} sin título`).not.toBe('')
    expect(e.descripcion, `${camino} sin meta description`).toBeTruthy()
    expect(e.canonica, `${camino} sin canonical`).toBeTruthy()
    expect(e.ogImagen, `${camino} sin og:image`).toBeTruthy()
    expect(e.ogSitio, `${camino} sin og:site_name`).toBe('Periódico Delfos')
    expect(e.ogLocale, `${camino} sin og:locale`).toBe('es_AR')
    // `?? ''` porque una página que se indexa no emite la etiqueta: el valor
    // es null y el matcher falla por eso, no por el contenido.
    expect(e.robots ?? '', `${camino} no se tiene que indexar`).not.toContain('noindex')
  }
})

/**
 * Lo que NO tiene que entrar al índice.
 *
 * `/demo` es tan importante como `/admin`: son las páginas con marcadores y
 * goles inventados, y que se indexen sería publicar datos deportivos falsos
 * con el dominio del medio.
 */
for (const ruta of ['/buscar', '/demo/portada', '/demo/nota', '/demo/partido']) {
  test(`${ruta} está fuera del índice`, async ({ page }) => {
    await page.goto(ruta, { waitUntil: 'load' })
    const { robots } = await etiquetasDe(page)

    expect(robots, `${ruta} se indexa`).toContain('noindex')
  })
}

test('robots.txt tapa el panel, las demos y la API', async ({ request }) => {
  const respuesta = await request.get('/robots.txt')
  expect(respuesta.status()).toBe(200)

  const texto = await respuesta.text()
  for (const prohibido of ['/admin', '/demo', '/api/']) {
    expect(texto, `robots.txt no prohíbe ${prohibido}`).toContain(`Disallow: ${prohibido}`)
  }
  expect(texto, 'robots.txt sin línea Sitemap').toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/)
})

test('el sitemap no lista nada que esté prohibido ni repetido', async ({ request }) => {
  const respuesta = await request.get('/sitemap.xml')
  expect(respuesta.status()).toBe(200)

  const xml = await respuesta.text()
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url as string)

  expect(urls.length, 'el sitemap está vacío').toBeGreaterThan(0)

  for (const url of urls) {
    expect(url, 'una URL relativa en el sitemap no la sigue ningún crawler').toMatch(
      /^https?:\/\//,
    )
    // Listar en el sitemap lo que robots.txt prohíbe es la contradicción que
    // hace que Search Console marque el archivo entero como sospechoso.
    expect(url, `${url} está prohibido en robots.txt`).not.toMatch(/\/(admin|demo|api)\//)
    expect(url, `${url} no se indexa`).not.toContain('/buscar')
  }

  // Un mismo destino dos veces reparte la autoridad entre las dos entradas.
  expect(new Set(urls).size, 'hay URLs repetidas en el sitemap').toBe(urls.length)

  // Todas del mismo origen: una URL con otro host es una canonical cruzada sin
  // querer, y suele ser un `NEXT_PUBLIC_SITE_URL` a medio cargar.
  expect(new Set(urls.map((url) => new URL(url).origin)).size).toBe(1)
})

test('el RSS se sirve y es del sitio', async ({ request }) => {
  const respuesta = await request.get('/rss.xml')
  expect(respuesta.status()).toBe(200)
  expect(respuesta.headers()['content-type'], 'el RSS no se sirve como XML').toContain('xml')

  const xml = await respuesta.text()
  expect(xml).toContain('<rss')
  expect(xml, 'el feed no dice de qué sitio es').toContain('Periódico Delfos')
})
