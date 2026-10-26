/**
 * Convierte el `error` que Supabase devuelve en una excepción.
 *
 * supabase-js **no tira**: una base caída, un timeout o una columna que no
 * existe vuelven como `{ data: null, error }`. Las queries leían sólo `data`,
 * así que todas esas fallas se veían como "no hay nada": la portada vacía, la
 * nota "no encontrada" y con `noindex`. Y lo peor, con ISR: la regeneración
 * guardaba esa página vacía **encima de la buena** y la servía hasta la
 * siguiente.
 *
 * Tirando, Next hace lo correcto solo: si la regeneración falla, **sigue
 * sirviendo la última versión buena** y reintenta en la próxima visita. Con la
 * base caída, el lector no se entera.
 *
 * Devuelve la respuesta entera, no sólo `data`, para que cada query siga
 * desestructurando lo mismo que antes (`{ data }`, `{ data, count }`).
 *
 * `consulta` es el nombre de la función: es lo único que dice dónde falló
 * cuando el error llega a los logs de Vercel.
 */

interface ErrorDeSupabase {
  message: string
  code?: string
}

interface Respuesta {
  error: ErrorDeSupabase | null
}

export function exigir<R extends Respuesta>(respuesta: R, consulta: string): R {
  if (respuesta.error) {
    const { message, code } = respuesta.error
    throw new Error(`Supabase falló en ${consulta}${code ? ` (${code})` : ''}: ${message}`)
  }
  return respuesta
}
