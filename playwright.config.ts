import { defineConfig, devices } from '@playwright/test'
import { HAY_CREDENCIALES } from './e2e/credenciales'

/**
 * Sin credenciales, los dos proyectos del panel **no se arman**.
 *
 * Es más robusto que dejarlos y que cada test se saltee solo: el setup y el
 * spec quedan fuera de la corrida entera, así no hay forma de que una carrera
 * entre el arranque del servidor y el login deje un rojo que no significa
 * nada. `credenciales.ts` no importa `@playwright/test`, que es lo que
 * permite leerlo desde acá.
 */
/**
 * Dónde queda la sesión del panel que guarda `admin.setup.ts`.
 *
 * Está escrita literal en los dos lados y no importada, porque **el config no
 * puede importar de un spec**: traer `admin.setup.ts` acá arrastra el `test`
 * de Playwright en el momento de leer la configuración y el arranque falla
 * entero. Es un archivo generado y en `.gitignore`; si alguna vez se mueve,
 * hay que tocar los dos.
 */
const SESION = 'e2e/.sesion-admin.json'

/**
 * La suite de navegador del Step 20.
 *
 * **Corre contra `next start`, no contra `next dev`.** El dev server compila
 * cada ruta al pedirla, así que la primera visita a cada página tarda segundos
 * y los tests se vuelven lentos y flakys por una razón que no es el código. Y
 * lo que hay que verificar es lo que se publica, que es el build.
 *
 * El puerto es el 3100 y no el 3000 a propósito: el 3000 lo suele tener
 * ocupado el `pnpm dev` de la sesión, y una suite que falla porque alguien
 * estaba trabajando no sirve.
 *
 * Las cuatro combinaciones —375 y 1280 px × tema claro y oscuro— no son
 * exceso: el proyecto tiene los dos temas medidos a AA y es mobile-first a
 * 375, y los tres bugs de scroll horizontal que ya encontró este barrido sólo
 * aparecían en una de las cuatro.
 */
/**
 * Contra qué servidor corre.
 *
 * Por omisión levanta `next start` en el 3100. Con `E2E_BASE_URL` apunta a uno
 * que ya esté andando y no levanta nada, que es lo que hace falta cuando está
 * abierto el `pnpm dev` de la sesión:
 *
 *     E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 *
 * **`next dev` y `next build` comparten el directorio `.next`.** Con el dev
 * server abierto, `next start` encuentra los artefactos de desarrollo y
 * responde 404 en todas las rutas. El síntoma es una suite que falla entera con
 * "Timed out waiting from config.webServer" y cuesta un rato entenderlo, así
 * que está escrito acá: o se apaga el dev y se vuelve a buildear, o se usa
 * `E2E_BASE_URL`.
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:3100'
const SERVIDOR_PROPIO = !process.env.E2E_BASE_URL

export default defineConfig({
  testDir: './e2e',
  // Los borradores de node que dieron origen a esto no son specs.
  testIgnore: '**/borradores/**',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: BASE,
    trace: 'on-first-retry',
  },

  /**
   * En la máquina donde se escribió esto no hay Chrome, sólo Edge.
   * `channel: 'msedge'` usa el Edge instalado; si en otra máquina no está,
   * `npx playwright install chromium` baja el navegador propio y hay que sacar
   * el `channel`.
   */
  projects: [
    /**
     * El login del panel, una vez, antes que todo lo demás.
     *
     * Es un proyecto y no un `beforeEach` porque hacer login antes de cada
     * test son veinte contra Supabase Auth por corrida, y tiene límite de
     * intentos. Sin `E2E_ADMIN_EMAIL` el setup se saltea solo y los tests del
     * panel también.
     */
    ...(HAY_CREDENCIALES ? [{ name: 'entrar', testMatch: /admin.setup.ts/ }] : []),

    /**
     * El panel. Un solo tamaño y un solo tema: lo que se prueba acá es que las
     * pantallas abran y que los formularios validen, y eso no cambia con el
     * viewport. Las cuatro combinaciones son para el sitio público, que es el
     * que se mira.
     */
    ...(HAY_CREDENCIALES
      ? [
          {
            name: 'panel',
            testMatch: /admin.spec.ts/,
            dependencies: ['entrar'],
            use: {
              ...devices['Desktop Edge'],
              channel: 'msedge' as const,
              viewport: { width: 1280, height: 900 },
              storageState: SESION,
            },
          },
        ]
      : []),

    /**
     * La auditoría de SEO, en un solo proyecto.
     *
     * Ninguna de las etiquetas que mira depende del ancho ni del tema, así que
     * correrla en los cuatro sería el mismo resultado cuatro veces. Es lo
     * contrario de la de accesibilidad, donde los cuatro son la razón de que
     * encuentre lo que encuentra.
     */
    /**
     * La auditoría de performance, en un celular y en un proyecto propio.
     *
     * A 375 px porque es donde se lee este sitio y donde el LCP duele, y
     * aparte de los demás porque estrangula la red a 4G: mezclarla con los
     * otros proyectos los haría lentos a todos.
     */
    {
      name: 'rendimiento',
      testMatch: /rendimiento.spec.ts/,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 375, height: 900 } },
    },

    {
      name: 'seo',
      testMatch: /seo.spec.ts/,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 900 } },
    },

    {
      name: 'escritorio-claro',
      testIgnore: /(admin|seo|rendimiento)\./,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'escritorio-oscuro',
      testIgnore: /(admin|seo|rendimiento)\./,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 900 }, colorScheme: 'dark' },
    },
    {
      name: 'celular-claro',
      testIgnore: /(admin|seo|rendimiento)\./,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 375, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'celular-oscuro',
      testIgnore: /(admin|seo|rendimiento)\./,
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 375, height: 900 }, colorScheme: 'dark' },
    },
  ],

  webServer: SERVIDOR_PROPIO
    ? {
        command: 'npx next start -p 3100',
        url: 'http://localhost:3100',
        reuseExistingServer: !process.env.CI,
        // `next start` necesita un build hecho. Se corre aparte a propósito:
        // que la suite compile el proyecto entero escondería cuánto tarda cada
        // cosa.
        timeout: 120_000,
      }
    : undefined,
})
