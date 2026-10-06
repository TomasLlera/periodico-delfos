import { z } from 'zod'
import { enteroRequerido, fechaOpcional, textoRequerido } from '@/lib/entidades/campos'

/**
 * Lo que se puede guardar de un sponsor.
 *
 * **El `alt` es obligatorio y no tiene excusa comercial.** Es la regla no
 * negociable 4 del proyecto y la base la sostiene con un CHECK: un banner sin
 * descripción es un agujero en la lectura para quien usa lector de pantalla, y
 * que sea un aviso pago no lo hace menos agujero. "Banner de Panadería San
 * Juan" alcanza.
 *
 * **El link se valida acá además de en el renderer.** Es el único campo donde
 * un anunciante puede meter texto que termina en un `href`, y un `javascript:`
 * pegado en el panel se publicaría en todas las páginas del sitio. Lista
 * blanca: sólo `http` y `https`.
 *
 * **`desde` y `hasta` son fechas sin hora**, que es como se vende un espacio:
 * "del 1 al 31". La hora la resolvió la base en el huso de Mar del Plata.
 */

/** Los tres huecos que existen. Tiene que coincidir con el enum de la 0016. */
export const UBICACIONES = ['portada_arriba', 'portada_entre_notas', 'nota_lateral'] as const

/**
 * Un link de anunciante, o `null`.
 *
 * Se apoya en el parser de `URL` y no en una expresión regular por lo mismo que
 * `hrefSeguro()` en el cuerpo de las notas: es el mismo parser que aplica el
 * navegador, así que normaliza mayúsculas (`JavaScript:`) y descarta
 * tabulaciones y saltos de línea intercalados, que son las dos formas clásicas
 * de esconder un esquema prohibido.
 */
export const linkDeSponsor = z
  .string()
  .trim()
  .transform((valor) => (valor === '' ? null : valor))
  .nullable()
  .refine(
    (valor) => {
      if (valor === null) return true
      try {
        const url = new URL(valor)
        return url.protocol === 'http:' || url.protocol === 'https:'
      } catch {
        return false
      }
    },
    { message: 'El link tiene que empezar con https:// y ser una dirección válida' },
  )

export const esquemaSponsor = z
  .object({
    nombre: textoRequerido('El nombre del sponsor'),
    imagen_url: textoRequerido('La imagen'),
    alt: textoRequerido('La descripción de la imagen'),
    link: linkDeSponsor,
    ubicacion: z.enum(UBICACIONES),
    desde: textoRequerido('La fecha de inicio'),
    hasta: fechaOpcional,
    /**
     * Entre varios sponsors del mismo hueco, el más chico va primero. El tope
     * es bajo a propósito: si alguien necesita el 500, lo que hace falta no es
     * un número más grande sino otro hueco.
     */
    orden: enteroRequerido('El orden', 0, 99),
    activo: z.boolean(),
  })
  // Una campaña que termina antes de empezar es un error de tipeo, y sin esto
  // el banner no aparece nunca y nadie sabe por qué. La base tiene el mismo
  // CHECK; acá el error llega como una frase al lado del campo.
  .refine((s) => s.hasta === null || s.hasta >= s.desde, {
    message: 'La fecha de fin no puede ser anterior a la de inicio',
    path: ['hasta'],
  })

export type EntradaSponsor = z.infer<typeof esquemaSponsor>
