import { createClient } from '@supabase/supabase-js'
import { expect, test } from '@playwright/test'
import { EMAIL, HAY_CREDENCIALES, PASSWORD, SIN_CREDENCIALES } from './credenciales'

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

// ============================================
// Las rutas de /api
// ============================================

/**
 * Los códigos que da el servidor, no el HTML.
 *
 * **Es el motivo por el que existen las rutas de `/api`.** El panel entra por
 * un Server Action, que responde 200 tanto si entrás como si no y pone el
 * error adentro del cuerpo: desde acá, desde Postman o desde la pestaña
 * Network, los dos casos son indistinguibles. Estos tests afirman sobre el
 * número, que es lo único que los separa.
 *
 * El `request` de Playwright trae un contexto nuevo por test, así que las
 * cookies de uno no se filtran al siguiente: es lo que permite comprobar que
 * un login fallido **no** deja sesión.
 */

/** El nombre que le pone `@supabase/ssr` a la cookie de sesión. */
const COOKIE_DE_SESION = /^sb-.*-auth-token/

function cuerpoDeNota(slug: string) {
  return {
    titulo: 'Nota de prueba de la API',
    slug,
    bajada: 'Creada por la suite de estados HTTP. Si la ves publicada, algo falló.',
    cuerpo: { type: 'doc', content: [] },
    imagen_portada: null,
    imagen_alt: '',
    imagen_credito: null,
    categoria: 'cronica',
    temporada_id: null,
    partido_id: null,
    destacada: false,
    auto_post: false,
    redes: [],
    publicada_en: null,
  }
}

/**
 * Borra la nota de prueba con el usuario de prueba.
 *
 * Va por `supabase-js` y no por la API porque **no hay ruta de borrado**, que
 * es deliberado: esta tanda agrega lectura y creación. Lo que la suite crea,
 * la suite lo limpia.
 */
async function borrarNotaDePrueba(slug: string): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { auth: { persistSession: false } },
  )

  await supabase.auth.signInWithPassword({ email: EMAIL ?? '', password: PASSWORD ?? '' })
  await supabase.from('notas').delete().eq('slug', slug)
}

test.describe('GET /api/notas', () => {
  test('una búsqueda con resultados es 200 y devuelve una lista', async ({ request }) => {
    const respuesta = await request.get('/api/notas?q=tiburonas')

    expect(respuesta.status()).toBe(200)
    expect(Array.isArray(await respuesta.json())).toBe(true)
  })

  /**
   * **El caso que esta suite existe para fijar.** No hay coincidencias, y eso
   * es una respuesta exitosa: el recurso existe y la consulta fue válida.
   * Contestar 404 sería decir que la búsqueda no existe.
   */
  test('una búsqueda sin coincidencias es 200 con [], y no 404', async ({ request }) => {
    const respuesta = await request.get('/api/notas?q=zzzzzzzzzzzz')

    expect(respuesta.status()).toBe(200)
    expect(await respuesta.json()).toEqual([])
  })

  test('una búsqueda más corta que el mínimo es 400', async ({ request }) => {
    const respuesta = await request.get('/api/notas?q=a')

    expect(respuesta.status()).toBe(400)
    expect((await respuesta.json()).error.codigo).toBe('datos_invalidos')
  })
})

test.describe('GET /api/notas/[slug]', () => {
  test('una nota que no existe es 404, con el formato de error fijo', async ({ request }) => {
    const respuesta = await request.get('/api/notas/esta-nota-no-existe-en-la-base')

    expect(respuesta.status()).toBe(404)
    expect(await respuesta.json()).toMatchObject({
      error: { codigo: 'no_encontrada' },
    })
  })
})

test.describe('POST /api/auth/login', () => {
  test('sin campos es 400 y no 401', async ({ request }) => {
    const respuesta = await request.post('/api/auth/login', { data: {} })

    expect(respuesta.status()).toBe(400)
    expect((await respuesta.json()).error.codigo).toBe('datos_invalidos')
  })

  /**
   * **El test que el Server Action no podía tener.** Credenciales equivocadas
   * dan 401, no queda cookie de sesión, y el panel sigue cerrado: las tres
   * cosas juntas son lo que significa "no entró".
   */
  test('con la contraseña equivocada es 401, no deja cookie y el panel sigue cerrado', async ({
    request,
  }) => {
    const respuesta = await request.post('/api/auth/login', {
      data: { email: 'nadie-con-este-mail@periodicodelfos.com', password: 'no-es-la-contrasena' },
    })

    expect(respuesta.status()).toBe(401)
    expect((await respuesta.json()).error.codigo).toBe('credenciales_invalidas')

    const { cookies } = await request.storageState()
    expect(cookies.filter((c) => COOKIE_DE_SESION.test(c.name))).toHaveLength(0)

    const panel = await request.get('/admin', { maxRedirects: 0 })
    expect(panel.status()).toBe(307)
    expect(panel.headers()['location']).toContain('/admin/login')
  })
})

test('POST /api/notas sin sesión es 401 y no crea nada', async ({ request }) => {
  const respuesta = await request.post('/api/notas', { data: cuerpoDeNota('no-se-crea-nunca') })

  expect(respuesta.status()).toBe(401)
  expect((await respuesta.json()).error.codigo).toBe('sin_sesion')
})

test.describe('las rutas de /api con el usuario de prueba', () => {
  test.skip(!HAY_CREDENCIALES, SIN_CREDENCIALES)

  test('el login correcto es 200 y deja la cookie de sesión', async ({ request }) => {
    const respuesta = await request.post('/api/auth/login', {
      data: { email: EMAIL, password: PASSWORD },
    })

    expect(respuesta.status()).toBe(200)

    const { cookies } = await request.storageState()
    expect(cookies.filter((c) => COOKIE_DE_SESION.test(c.name)).length).toBeGreaterThan(0)
  })

  /**
   * Crear, repetir y limpiar, en un solo test porque el 409 necesita que el
   * 201 haya pasado: separarlos los volvería dependientes del orden.
   */
  test('crear una nota es 201, y el mismo slug otra vez es 409', async ({ request }) => {
    const slug = `prueba-api-http-${Date.now()}`

    await request.post('/api/auth/login', { data: { email: EMAIL, password: PASSWORD } })

    try {
      const creada = await request.post('/api/notas', { data: cuerpoDeNota(slug) })

      expect(creada.status()).toBe(201)

      const nota = await creada.json()
      expect(nota.id).toBeTruthy()
      // La ruta no publica: si esto cambia, el auto-posteo saldría de un POST.
      expect(nota.estado).toBe('borrador')

      const repetida = await request.post('/api/notas', { data: cuerpoDeNota(slug) })

      expect(repetida.status()).toBe(409)
      expect((await repetida.json()).error.codigo).toBe('conflicto')
    } finally {
      // Pase lo que pase arriba, la nota de prueba no queda en la base.
      await borrarNotaDePrueba(slug)
    }
  })
})
