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

/**
 * El código con el que PostgREST contesta un `.range()` que arranca después de
 * la última fila: `PGRST103`, "Requested range not satisfiable".
 *
 * **Es la única falla de Supabase que no es una falla.** Pedir la página 9999
 * de un listado de seis no está roto: está vacío, y eso lo tiene que decidir la
 * página —`/cronicas` contesta 404— y no una excepción. Sin esto, `exigir()`
 * tiraba y `?pagina=9999` devolvía **500 en vez de 404**: el `notFound()` de la
 * página nunca se alcanzaba porque la query explotaba antes.
 *
 * No se puede distinguir de "la página existe pero está vacía" mirando `data`,
 * porque con este error `data` viene en `null` igual que con una base caída. Por
 * eso hay que mirar el `code`.
 *
 * **Y se volvió más fácil de provocar desde que se puede borrar una nota**: un
 * offset que era válido ayer queda fuera de rango cuando el listado se achica.
 */
export const RANGO_FUERA_DE_ALCANCE = 'PGRST103'

export function esRangoFueraDeAlcance(respuesta: Respuesta): boolean {
  return respuesta.error?.code === RANGO_FUERA_DE_ALCANCE
}
