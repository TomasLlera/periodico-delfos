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

/**
 * El alta de una cuenta del panel.
 *
 * **Es otra pantalla que el perfil, y otro esquema.** El perfil lo edita cada
 * uno sobre su propia fila; el alta la hace un editor sobre una cuenta que
 * todavía no existe, y las dos cosas piden datos distintos: acá hace falta un
 * mail —al que va la invitación— y un rol, y no hace falta nada de lo que se
 * escribe después (bio, foto, handles). Quien entre los completa en su perfil.
 *
 * **El slug no se pide, se deriva del nombre.** Es la URL de la página del
 * autor y el criterio de slug del proyecto es uno solo (`slugificar()`): dejarlo
 * escribir acá habilita dos autores con el mismo slug, y la base lo rebota con
 * un 23505 que nadie entiende.
 *
 * Hasta ahora un autor nacía creando el usuario a mano en el panel de Supabase
 * Auth y después insertando la fila con SQL, que es lo que pidió Charlie que
 * dejara de ser así.
 */
export const esquemaAltaDeAutor = z.object({
  nombre: textoRequerido('El nombre'),
  /**
   * A dónde va la invitación. Se guarda en Auth y no en `autores`: la tabla no
   * tiene columna de mail y no conviene que la tenga, porque sería una copia
   * del dato que puede quedar vieja cuando alguien lo cambia desde Auth.
   */
  // `z.email()` y no `z.string().email()`: en Zod 4 el segundo está deprecado.
  // El `min(1)` va primero para que un campo vacío diga que falta y no que no
  // tiene forma de mail, que es lo que diría el validador de formato solo.
  mail: z
    .string()
    .trim()
    .min(1, 'El mail es obligatorio: es a donde va la invitación')
    .pipe(z.email('Ese mail no tiene forma de mail')),
  rol: z.enum(['editor', 'redactor']),
})

export type EntradaAltaDeAutor = z.infer<typeof esquemaAltaDeAutor>
