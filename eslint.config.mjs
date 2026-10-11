import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * ESLint 9 (flat config) con las reglas de Next, que todavía no lo son.
 *
 * `eslint-config-next@15` exporta configs al viejo estilo `.eslintrc`
 * —`module.exports = { extends: [...] }`— y no arrays de flat config. Hacerles
 * spread adentro de `defineConfig([...])` no falla con un mensaje sobre eso:
 * falla antes, al importar, porque el paquete tampoco declara `exports` y Node
 * exige la extensión `.js` en un import ESM. Agregar sólo la extensión destapa
 * el error siguiente, no deja el config andando.
 *
 * `FlatCompat` es el puente oficial: traduce un config eslintrc a flat. Es lo
 * que genera `create-next-app` para esta versión, y es la razón por la que
 * `@eslint/eslintrc` ya figuraba en devDependencies sin que nada lo usara.
 *
 * Se va el día que `eslint-config-next` exporte flat config: ahí esto vuelve a
 * ser un spread.
 */
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const eslintConfig = defineConfig([
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // Los ignores que eslint-config-next trae por su cuenta y que no viajan al
  // pasar por FlatCompat.
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  {
    /**
     * Los hooks de este proyecto se llaman en español —`usarFormulario`,
     * `usarCola`— porque CLAUDE.md pide que TODO el código lo esté, nombres de
     * funciones incluidos. `rules-of-hooks` reconoce hooks por el prefijo `use`
     * y no se le puede enseñar un segundo prefijo: no tiene opción para eso.
     *
     * Así que la regla se apaga en los dos archivos que SON hooks, y sigue
     * encendida en todo el resto —que es donde de verdad protege: un hook
     * adentro de un `if` en un componente—. Renombrarlos a `useFormulario`
     * arreglaría el lint rompiendo una regla del proyecto, que es peor negocio.
     */
    files: ['src/components/admin/usar*.ts', 'src/components/admin/usar*.tsx'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },
])

export default eslintConfig
