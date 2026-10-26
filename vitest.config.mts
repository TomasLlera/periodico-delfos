import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Vitest no lee los `paths` del tsconfig.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // El tsconfig de Next tiene `"jsx": "preserve"`. Para los tests da igual,
  // pero la cobertura instrumenta también los .tsx que ningún test importa, y
  // con el JSX sin transformar no los puede leer: los saca del reporte sin
  // avisar y el porcentaje sale inflado (49 % en vez de 27 %).
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      // Todo `src/`, también lo que no tiene ningún test: un archivo sin tests
      // es el 0 % más importante del reporte, no algo para dejar afuera.
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/app/demo/**', 'src/lib/supabase/types.ts'],
      reporter: ['text-summary', 'html', 'json-summary'],
      /**
       * Pisos, no metas. Están apenas abajo de lo medido el 26/10/2026 para
       * que la cobertura sólo pueda subir: un PR que agrega código sin tests
       * la baja y el CI lo frena. Cuando suba, se suben (ver
       * REPORTE_COBERTURA.md).
       *
       * La lógica pura tiene su propio piso, más alto: es la parte que está
       * bien testeada y la que no tiene excusa para dejar de estarlo.
       */
      thresholds: {
        lines: 27,
        statements: 27,
        functions: 27,
        branches: 25,
        'src/lib/{entidades,social,migracion}/**': { lines: 80, branches: 75 },
      },
    },
  },
})
