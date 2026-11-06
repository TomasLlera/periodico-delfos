import { expect, test } from '@playwright/test'

/**
 * Qué código HTTP devuelve cada ruta.
 *
 * **Es la suite que faltaba, y faltaba por una razón:** todo lo demás se mira
 * en pantalla, y en pantalla un 404 con status 200 se ve exactamente igual que
 * un 404 de verdad. El bug que esto cubre vivió en el repo sin que nadie lo
 * viera: un `src/app/loading.tsx` en la raíz creaba un límite de Suspense sobre
 * **todo** el sitio, Next empezaba a mandar la respuesta con el status ya
 * puesto en 200, y cuando la página llamaba `notFound()` el 404 ya no se podía
 * escribir. Resultado: `/nota/cualquier-cosa` devolvía 200 sirviendo la
 * pantalla de 404. Para un buscador eso es una página válida con contenido
 * vacío, y la indexa.
 *
 * Por eso los tests de acá **no miran el HTML**: miran el número. Es lo único
 * que distingue las dos cosas.
 *
 * Usa `request` y no `page`: no hace falta navegador para leer un status, y así
 * la suite corre en un segundo. Playwright no sigue redirecciones con
 * `maxRedirects: 0`, que es lo que deja ver el 307 del panel en vez del 200 del
 * login al que lleva.
 *
 * **Corre en un proyecto propio** (ver `playwright.config.ts`). Un status no
 * cambia con el ancho de la pantalla ni con el tema, así que correrlo en los
 * cuatro proyectos del sitio público sería el mismo resultado cuatro veces. Es
 * el mismo criterio que ya usa la auditoría de SEO.
 */

/**
 * Un recurso que no existe es 404.
 *
 * Son las cinco rutas públicas con parámetro, que son todas las que pueden
 * recibir un slug inventado. Cada una llama `notFound()` cuando la base no
 * tiene la fila.
 */
const INEXISTENTES = [
  '/nota/esta-nota-no-existe-en-la-base',
  '/partido/este-partido-no-existe',
  '/jugadora/esta-jugadora-no-existe',
  '/temporada/esta-temporada-no-existe',
  '/plantel/este-plantel-no-existe',
]

for (const ruta of INEXISTENTES) {
  test(`${ruta} devuelve 404 y no 200`, async ({ request }) => {
    const respuesta = await request.get(ruta)
    expect(respuesta.status()).toBe(404)
  })
}

test('una ruta que no existe en el router devuelve 404', async ({ request }) => {
  expect((await request.get('/ruta-que-no-existe-en-ningun-lado')).status()).toBe(404)
})

/**
 * Una página de paginación que se pasa del final también es 404.
 *
 * Tuvo dos bugs encadenados, y de distinto tipo. Primero devolvía 200 por el
 * `loading.tsx` de la raíz, igual que las de arriba. Al sacarlo pasó a devolver
 * **500**: PostgREST contesta `PGRST103` cuando el `.range()` arranca después
 * de la última fila, `exigir()` lo convertía en excepción, y el `notFound()`
 * de la página no se alcanzaba nunca. Ver `esRangoFueraDeAlcance()`.
 *
 * El 500 es el caso interesante: a diferencia del 200, se ve en los logs. Pero
 * decía "el sitio está roto" cuando lo que pasaba era que alguien pidió una
 * página que no existe.
 */
for (const ruta of ['/cronicas?pagina=9999', '/analisis?pagina=9999']) {
  test(`${ruta} devuelve 404 y no 500`, async ({ request }) => {
    const respuesta = await request.get(ruta)
    expect(respuesta.status()).toBe(404)
  })
}

/**
 * Lo que **no** tiene que cambiar.
 *
 * Una búsqueda sin resultados es una respuesta exitosa: encontró que no hay
 * nada. Contestarla con 404 sería incorrecto —el recurso `/buscar` existe— y
 * además sacaría la página del índice. Está acá escrito como test porque es
 * justo el que alguien "arreglaría" por error al leer los de arriba.
 */
test('una búsqueda sin resultados es 200, no 404', async ({ request }) => {
  const respuesta = await request.get('/buscar?q=zzzzzzzzzzzz')
  expect(respuesta.status()).toBe(200)
})

test('la primera página de un listado es 200', async ({ request }) => {
  expect((await request.get('/cronicas')).status()).toBe(200)
  expect((await request.get('/analisis')).status()).toBe(200)
})

test('la portada es 200', async ({ request }) => {
  expect((await request.get('/')).status()).toBe(200)
})

/**
 * El panel sin sesión redirige, no da 403 ni 404.
 *
 * Lo decide `src/middleware.ts`, y el 307 es el correcto: la respuesta a "no
 * estás autenticado" en una app con pantalla de login es mandarte al login,
 * guardándote de dónde venías en `?volver=`. Un 403 dejaría al navegador sin
 * nada que mostrar.
 */
test('el panel sin sesión redirige al login con el volver puesto', async ({ request }) => {
  const respuesta = await request.get('/admin', { maxRedirects: 0 })

  expect(respuesta.status()).toBe(307)

  const destino = respuesta.headers()['location']
  expect(destino).toContain('/admin/login')
  expect(destino).toContain('volver=%2Fadmin')
})

/**
 * El login es público: tiene que dar 200 sin sesión, o nadie puede entrar.
 *
 * Es el único `/admin/*` que el middleware deja pasar, y si alguna vez se
 * rompe ese `if` el panel queda inaccesible con un bucle de redirecciones.
 */
test('la pantalla de login es 200 sin sesión', async ({ request }) => {
  expect((await request.get('/admin/login')).status()).toBe(200)
})
