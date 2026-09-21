import { defineConfig, devices } from '@playwright/test'

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
    {
      name: 'escritorio-claro',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'escritorio-oscuro',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 1280, height: 900 }, colorScheme: 'dark' },
    },
    {
      name: 'celular-claro',
      use: { ...devices['Desktop Edge'], channel: 'msedge', viewport: { width: 375, height: 900 }, colorScheme: 'light' },
    },
    {
      name: 'celular-oscuro',
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
