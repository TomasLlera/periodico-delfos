const { chromium } = require('playwright')

const BASE = 'http://localhost:3100'
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
const ANCHOS = [375, 1280]
const TEMAS = ['light', 'dark']

// Los 404 de prefetch de Next a rutas que sin base no existen son ruido
// conocido: se filtran por URL y no por el texto del mensaje, que no la trae.
const RUIDO = /_rsc=|\/jugadora\/|\/partido\/|\/contacto|\/privacidad|favicon/

async function main() {
  const navegador = await chromium.launch({ channel: 'msedge' })
  const problemas = []

  for (const tema of TEMAS) {
    for (const ancho of ANCHOS) {
      const contexto = await navegador.newContext({
        viewport: { width: ancho, height: 900 },
        colorScheme: tema,
      })
      const pagina = await contexto.newPage()

      for (const ruta of RUTAS) {
        const errores = []
        pagina.removeAllListeners('console')
        pagina.on('console', (m) => {
          if (m.type() === 'error' && !RUIDO.test(m.text())) errores.push(m.text())
        })
        pagina.removeAllListeners('pageerror')
        pagina.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`))

        const respuesta = await pagina.goto(BASE + ruta, { waitUntil: 'networkidle' })
        const medida = await pagina.evaluate(() => ({
          doc: document.documentElement.scrollWidth,
          docCliente: document.documentElement.clientWidth,
          body: document.body.scrollWidth,
          h1: document.querySelectorAll('h1').length,
        }))

        const desborde =
          medida.doc > medida.docCliente || medida.body > medida.docCliente
        const etiqueta = `${ruta} @${ancho} ${tema}`

        if (respuesta.status() !== 200) {
          problemas.push(`${etiqueta}: HTTP ${respuesta.status()}`)
        }
        if (desborde) {
          problemas.push(
            `${etiqueta}: SCROLL doc=${medida.doc} body=${medida.body} viewport=${medida.docCliente}`,
          )
        }
        if (medida.h1 !== 1) {
          problemas.push(`${etiqueta}: ${medida.h1} h1`)
        }
        for (const e of errores) problemas.push(`${etiqueta}: consola — ${e}`)
      }

      await contexto.close()
    }
  }

  await navegador.close()

  const combinaciones = RUTAS.length * ANCHOS.length * TEMAS.length
  console.log(`\n${combinaciones} combinaciones medidas (${RUTAS.length} rutas x 375/1280 x claro/oscuro)\n`)
  if (problemas.length === 0) {
    console.log('sin problemas')
  } else {
    console.log(`${problemas.length} hallazgos:`)
    for (const p of problemas) console.log('  - ' + p)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
