const { chromium } = require('playwright')

const BASE = 'http://localhost:3100'
const FRANJA = `${BASE}/demo/fixture`

const check = (ok, que) => console.log(`${ok ? '  ok  ' : ' FALLA '} ${que}`)

async function main() {
  const navegador = await chromium.launch({ channel: 'msedge' })

  for (const ancho of [375, 1280]) {
    console.log(`\n=== ${ancho}px ===`)
    const ctx = await navegador.newContext({ viewport: { width: ancho, height: 900 } })
    const pagina = await ctx.newPage()

    await pagina.goto(FRANJA, { waitUntil: 'networkidle' })

    // El chip de la fecha 11, que es el que pidio el usuario.
    const chip = pagina.getByRole('link', { name: /Fecha 11|fecha 11/i }).first()
    const chips = await pagina.locator('ol a[href^="/demo/fixture/"]').count()
    check(chips === 12, `la franja dibuja las 12 fechas (dibujo ${chips})`)

    const href = await chip.getAttribute('href')
    check(!!href && href.startsWith('/demo/fixture/'), `el chip es un link de verdad (href=${href})`)

    await chip.click()
    await pagina.waitForSelector('dialog[open]', { timeout: 5000 })
    check(true, 'al apretarlo se abre la ventana')

    const urlConVentana = pagina.url()
    check(urlConVentana.includes('/demo/fixture/'), `la URL cambio a la del partido (${urlConVentana.replace(BASE, '')})`)

    const modal = await pagina.evaluate(() => {
      const d = document.querySelector('dialog')
      return { abierto: d?.open === true, etiqueta: d?.getAttribute('aria-labelledby') }
    })
    check(modal.abierto && modal.etiqueta === 'titulo-ventana', 'es modal y tiene nombre accesible')

    const hayPlanilla = await pagina.locator('dialog[open]').getByText(/Formaciones|Incidencias|planilla/i).first().isVisible().catch(() => false)
    check(hayPlanilla, 'adentro esta la planilla')

    const desborde = await pagina.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      cliente: document.documentElement.clientWidth,
      body: document.body.scrollWidth,
    }))
    check(
      desborde.doc <= desborde.cliente && desborde.body <= desborde.cliente,
      `sin scroll horizontal con la ventana abierta (doc=${desborde.doc} body=${desborde.body} viewport=${desborde.cliente})`,
    )

    // Escape la cierra y el foco vuelve al chip.
    await pagina.keyboard.press('Escape')
    await pagina.waitForSelector('dialog[open]', { state: 'detached', timeout: 5000 }).catch(() => {})
    const cerrada = (await pagina.locator('dialog[open]').count()) === 0
    check(cerrada, 'Escape la cierra')
    check(pagina.url() === FRANJA, `y vuelve a la franja (${pagina.url().replace(BASE, '')})`)

    const focoEnChip = await pagina.evaluate(
      () => document.activeElement?.getAttribute('href') ?? null,
    )
    check(!!focoEnChip && focoEnChip.startsWith('/demo/fixture/'), `el foco volvio al chip (${focoEnChip})`)

    // F5 en la URL del partido tiene que dar la pagina entera, no la ventana.
    await pagina.goto(`${FRANJA}/${href.split('/').pop()}`, { waitUntil: 'networkidle' })
    const sinVentana = (await pagina.locator('dialog[open]').count()) === 0
    const h1 = await pagina.locator('h1').count()
    check(sinVentana, 'entrar directo a esa URL muestra la pagina, no la ventana')
    check(h1 === 1, `y la pagina tiene un solo h1 (${h1})`)

    await ctx.close()
  }

  // Sin JavaScript el chip navega como cualquier link.
  console.log('\n=== sin JavaScript ===')
  const ctxSinJs = await navegador.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } })
  const sinJs = await ctxSinJs.newPage()
  await sinJs.goto(FRANJA)
  await sinJs.locator('ol a[href^="/demo/fixture/"]').first().click()
  await sinJs.waitForLoadState('load')
  check(sinJs.url() !== FRANJA, `el chip navega a la pagina entera (${sinJs.url().replace(BASE, '')})`)
  check((await sinJs.locator('dialog[open]').count()) === 0, 'y no hay ninguna ventana')
  await ctxSinJs.close()

  await navegador.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
