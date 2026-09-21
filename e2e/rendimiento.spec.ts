import { expect, test } from '@playwright/test'

/**
 * La auditoría de performance del Step 20: LCP por debajo de 2,5 s en 4G.
 *
 * El número sale del blueprint y no de acá: 2500 ms es el umbral "bueno" de
 * Core Web Vitals, el mismo que usa Google para rankear. **Lo que se mide es
 * el Largest Contentful Paint**, el momento en que aparece el elemento más
 * grande de la pantalla —en este sitio, el titular o la foto de portada—, que
 * es lo más parecido a "ya puedo leer" que sabe medir un navegador.
 *
 * ── Por qué esto no corre contra el dev server ──
 *
 * `next dev` compila cada ruta la primera vez que se la pide y no minifica
 * nada: da números tres o cuatro veces peores que el build, y un rojo que no
 * significa nada es peor que no tener el test. Si detecta el dev server, se
 * saltea y lo dice. Contra `next start`, que es el valor por omisión de la
 * suite, corre solo.
 *
 * ── Qué se estrangula, y qué no ──
 *
 * Se estrangula **la red**, con el perfil que Lighthouse llama "Slow 4G": 1,6
 * Mbps de bajada, 750 kbps de subida y 150 ms de ida y vuelta. Es el mismo
 * perfil con el que Google publica los números de Core Web Vitals, así que
 * comparar contra 2500 ms tiene sentido.
 *
 * **No se estrangula el procesador.** Lighthouse además lo frena 4×, para
 * simular un teléfono de gama media, y sería más realista para quien lee este
 * sitio desde la cancha. Se deja afuera a propósito: el encargo pide 4G y ese
 * factor depende de qué tan rápida sea la máquina que corre la suite, así que
 * el mismo código daría verde en una y rojo en otra. Medir el celular de
 * verdad es el ítem 4 de los pendientes y no lo reemplaza un emulador.
 */

/** El umbral de Core Web Vitals, en milisegundos. */
const LCP_MAXIMO = 2500

/** Slow 4G, el perfil de Lighthouse. Las unidades de CDP son bytes por segundo. */
const RED_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
}

/**
 * Las rutas que se miden.
 *
 * La portada y un listado, que son las dos que más se abren, y el detalle de
 * un partido, que es la página más pesada del sitio: trae la planilla entera,
 * la formación y la tabla.
 */
const RUTAS_FIJAS = ['/', '/cronicas']

/**
 * Mide el LCP de una ruta con la red estrangulada.
 *
 * El cache se apaga en cada medición: lo que importa es la primera visita, que
 * es la única que tiene alguien que llega desde Google o desde un link de
 * Instagram. Con cache los números son de otra cosa.
 */
interface Medicion {
  /** Milisegundos hasta el Largest Contentful Paint. */
  lcp: number
  /** Qué elemento fue, para saber qué optimizar si el número sube. */
  elemento: string
}

async function medirLCP(page: import('@playwright/test').Page, ruta: string): Promise<Medicion> {
  // Una carga de calentamiento, sin estrangular y sin medir.
  //
  // **La primera navegación de un navegador recién abierto cuesta un segundo y
  // medio más que las siguientes**, y no es la página: es el arranque del
  // proceso y la primera conexión. Medido el 21/09 contra el build: la ruta que
  // tocara correr primera daba 2100-2200 ms y las dos siguientes, 730. O sea
  // que el primer test medía Edge, no el sitio.
  //
  // Calentar es además lo más parecido a la verdad: quien entra al sitio ya
  // tiene el navegador abierto. Lo que sigue midiéndose en frío es la red —el
  // cache se apaga abajo—, que es lo que importa de una primera visita.
  await page.goto(ruta, { waitUntil: 'load' })
  await page.goto('about:blank')

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  await cdp.send('Network.emulateNetworkConditions', RED_4G)

  await page.goto(ruta, { waitUntil: 'load' })

  // `buffered: true` entrega las entradas que ya ocurrieron antes de que el
  // observer existiera, que son todas: el LCP pasa durante la carga.
  const medicion = await page.evaluate<Medicion>(
    () =>
      new Promise<Medicion>((resolve) => {
        new PerformanceObserver((lista) => {
          const entradas = lista.getEntries() as LargestContentfulPaint[]
          const ultima = entradas[entradas.length - 1]
          if (!ultima) return

          const nodo = ultima.element
          resolve({
            lcp: ultima.startTime,
            elemento: ultima.url || (nodo ? `<${nodo.tagName.toLowerCase()}> ${nodo.textContent?.trim().slice(0, 40) ?? ''}` : '?'),
          })
        }).observe({ type: 'largest-contentful-paint', buffered: true })

        // Una página sin ningún elemento que califique —no pasa en este sitio,
        // pero pasaría en una pantalla vacía— no emite nunca la entrada.
        setTimeout(() => resolve({ lcp: -1, elemento: 'ninguno' }), 15_000)
      }),
  )

  await cdp.detach()
  return medicion
}

/**
 * Se saltea entera contra el dev server, con el motivo escrito.
 *
 * El marcador es el cache-buster que `next dev` le cuelga a sus chunks
 * (`main-app.js?v=…`); el build los sirve con el hash en el nombre y sin
 * querystring.
 */
test.beforeEach(async ({ request }) => {
  const html = await (await request.get('/')).text()
  test.skip(
    html.includes('main-app.js?v='),
    'Contra `next dev` los números no significan nada: apagá el dev, `next build` y `next start`.',
  )
})

for (const ruta of RUTAS_FIJAS) {
  test(`${ruta} pinta en menos de ${LCP_MAXIMO} ms en 4G`, async ({ page }) => {
    // Con la red estrangulada una carga son varios segundos, y son tres.
    test.setTimeout(120_000)

    const { lcp, elemento } = await medirLCP(page, ruta)

    // El número va al log siempre y no sólo cuando falla: lo que interesa de
    // una medición es la tendencia entre corridas, y un verde mudo no la deja
    // ver acercarse al umbral.
    console.log(`  LCP ${ruta} → ${Math.round(lcp)} ms · ${elemento}`)

    expect(lcp, `${ruta} no emitió LCP`).toBeGreaterThan(0)
    expect(Math.round(lcp), `${ruta} tardó ${Math.round(lcp)} ms en pintar`).toBeLessThan(
      LCP_MAXIMO,
    )
  })
}

/**
 * La página más pesada que haya cargada, sacada del sitemap.
 *
 * No se nombra el slug a propósito: los datos de la base cambian y un test que
 * nombra un partido se pone en rojo el día que ese partido se borre.
 */
test(`el partido más reciente pinta en menos de ${LCP_MAXIMO} ms en 4G`, async ({
  page,
  request,
}) => {
  test.setTimeout(120_000)

  const xml = await (await request.get('/sitemap.xml')).text()
  const partido = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map(([, url]) => new URL(url as string).pathname)
    .find((camino) => camino.startsWith('/partido/'))

  test.skip(!partido, 'La base no tiene ningún partido cargado todavía.')

  const { lcp, elemento } = await medirLCP(page, partido as string)

  console.log(`  LCP ${partido} → ${Math.round(lcp)} ms · ${elemento}`)

  expect(lcp, `${partido} no emitió LCP`).toBeGreaterThan(0)
  expect(Math.round(lcp), `${partido} tardó ${Math.round(lcp)} ms en pintar`).toBeLessThan(
    LCP_MAXIMO,
  )
})
