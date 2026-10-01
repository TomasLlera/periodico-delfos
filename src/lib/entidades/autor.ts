import { z } from 'zod'
import { textoOpcional, textoRequerido } from '@/lib/entidades/campos'

/**
 * El perfil de quien firma las notas.
 *
 * Es lo que sale en la línea de autoría y en la caja del pie de cada nota, así
 * que hasta ahora se cargaba a mano en la base: la fila de `autores` existe
 * desde la migración 0001 con `bio`, `foto_url`, `instagram` y `x_handle`, pero
 * no había ninguna pantalla que los escribiera. Lo pidió Charlie.
 *
 * **El slug no se edita.** Es la URL por la que ya puede estar indexada la
 * página del autor; cambiarlo rompe links desde afuera sin avisar. Si alguna
 * vez hace falta, va con su redirección, como las de WordPress.
 *
 * **Los handles se guardan pelados, sin arroba y sin URL.** Un `@` adelante o
 * un `https://instagram.com/` entero llegan igual desde un copiar y pegar, y
 * después alguien arma el link concatenando y queda
 * `instagram.com/@https://instagram.com/delfos`. Se limpian acá, una vez.
 */
export const esquemaAutor = z.object({
  nombre: textoRequerido('El nombre'),
  bio: textoOpcional,
  foto_url: textoOpcional,
  instagram: textoOpcional,
  x_handle: textoOpcional,
})

export type EntradaAutor = z.infer<typeof esquemaAutor>

/**
 * Deja un handle en su forma mínima: sin arroba, sin URL y sin barra final.
 *
 * Devuelve `null` para lo que quede vacío, que es lo que espera una columna
 * `text` nullable: un string vacío en la base es un dato que después hay que
 * distinguir de "no cargado" en cada lectura.
 */
export function handleLimpio(valor: string | null | undefined): string | null {
  if (!valor) return null

  const sinUrl = valor
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^(www\.)?(instagram\.com|x\.com|twitter\.com)\//i, '')

  const limpio = sinUrl.replace(/^@+/, '').replace(/\/+$/, '').trim()

  return limpio === '' ? null : limpio
}
