import type { MotivoNota, ResultadoNota } from '@/actions/notas'
import { ERRORES, type ErrorApi } from '@/lib/api/errores'

/**
 * Qué código HTTP le toca a cada forma de fallar al escribir una nota.
 *
 * **Vive en un solo lugar para las cuatro rutas** —crear, publicar, editar y
 * borrar— porque el mismo hecho tiene que dar el mismo número en todas. Que
 * "esa nota no existe" sea 404 al editar y 400 al borrar es la clase de
 * incoherencia que aparece cuando cada ruta decide por su cuenta.
 *
 * El `codigo` lo pone el Server Action, que es quien sabe qué pasó. Mirar el
 * texto del mensaje para adivinar el estado sería atarlo a una frase que
 * cualquiera puede corregir.
 */
const ESTADO_POR_MOTIVO: Record<MotivoNota, (r: ResultadoNota) => ErrorApi> = {
  sin_sesion: () => ERRORES.sinSesion(),
  datos_invalidos: (r) => ERRORES.datosInvalidos(frase(r, 'Los datos de la nota no son válidos.')),
  // 400 y no 422: la tabla de la clase 8 no usa 422, y "le falta la bajada" es
  // un dato que vino mal como cualquier otro.
  no_publicable: (r) => ERRORES.datosInvalidos(frase(r, 'La nota todavía no se puede publicar.')),
  fecha_invalida: (r) => ERRORES.datosInvalidos(frase(r, 'Esa fecha no se puede usar.')),
  slug_duplicado: () => ERRORES.conflicto('Ya existe una nota con ese slug.'),
  /**
   * **404 cubre dos hechos a propósito: no existe, y existe pero no es tuya.**
   * RLS no distingue —una política que rechaza devuelve cero filas, no un
   * error— y tampoco conviene distinguir: contestar 403 en el segundo caso le
   * confirmaría a cualquiera que esa nota existe y de quién es.
   */
  no_encontrada: (r) => ERRORES.noEncontrada(r.error ?? 'Esa nota no existe, o no es tuya.'),
  no_disponible: () => ERRORES.servicioNoDisponible(),
  falla: () => ERRORES.interno(),
}

function frase({ error, motivos }: ResultadoNota, porOmision: string): string {
  return [error ?? porOmision, ...(motivos ?? [])].join(' · ')
}

export function errorDeResultado(resultado: ResultadoNota): ErrorApi {
  return resultado.codigo
    ? ESTADO_POR_MOTIVO[resultado.codigo](resultado)
    : // Un resultado sin `codigo` y sin éxito no debería existir. Si aparece,
      // es un defecto del action y no una respuesta de diseño: 500 y al log.
      ERRORES.interno()
}
