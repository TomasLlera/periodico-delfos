/**
 * La lógica del formulario de nota, sin React y sin Supabase.
 *
 * Vive separada por la misma razón que `partido.ts` o `plantel.ts`: son las
 * reglas que deciden si una nota se puede guardar y si se puede publicar, y
 * conviene poder probarlas con vitest sin montar un editor ni una base.
 *
 * **La base valida lo mismo por su cuenta** —`bajada_no_vacia`,
 * `titulo_no_vacio`, `alt_requerido`, `publicada_tiene_fecha` en
 * `0005_notas.sql`—. Esto no la reemplaza: la duplica a propósito, para que el
 * error llegue como un mensaje en español al lado del campo y no como un 400
 * de Postgres. Si alguna vez las dos se contradicen, manda la base.
 */

import { z } from 'zod'
import type { Categoria, DocumentoTipTap, Red } from '@/types'

// ============================================
// Slug
// ============================================

/**
 * El slug sale del título, como en WordPress, porque las URLs viejas se armaron
 * así y la migración depende de que el criterio sea el mismo.
 *
 * Se calcula una sola vez, al crear: **renombrar una nota publicada no le
 * cambia la URL**. Cambiarla rompería el link compartido en redes y la
 * redirección 301 que ya apunta ahí (regla no negociable 8). Por eso el campo
 * queda editable a mano en el formulario, pero no se recalcula solo.
 */
export function slugDesdeTitulo(titulo: string): string {
  return titulo
    .normalize('NFD')
    // Saca los diacríticos que `NFD` acaba de separar: "crónica" → "cronica".
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // La ñ sobrevive a `NFD` como "n" + tilde, así que ya quedó en "n". Lo que
    // queda por barrer es todo lo que no sea letra, número o espacio.
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/[\s-]+/g, '-')
}

// ============================================
// Validación del formulario
// ============================================

const CATEGORIAS = ['cronica', 'analisis', 'temporada', 'plantel', 'institucional'] as const
const REDES = ['facebook', 'instagram', 'x'] as const

const textoRequerido = (campo: string) =>
  z
    .string()
    .trim()
    .min(1, `${campo} no puede quedar vacío`)

/** Un campo de texto opcional: la cadena vacía del formulario entra como `null`. */
const textoOpcional = z
  .string()
  .trim()
  .transform((v) => (v === '' ? null : v))
  .nullable()

const esquemaDocumento: z.ZodType<DocumentoTipTap> = z.object({
  type: z.literal('doc'),
  content: z.array(z.record(z.string(), z.unknown())).optional(),
}) as z.ZodType<DocumentoTipTap>

/**
 * Lo que el formulario manda al Server Action.
 *
 * `imagen_alt` se valida contra `imagen_portada` y no por su cuenta: una nota
 * sin imagen no necesita alt, y una con imagen no se guarda sin él. Es la
 * regla no negociable 4, del lado del formulario.
 */
export const esquemaNota = z
  .object({
    titulo: textoRequerido('El título'),
    slug: textoRequerido('El slug'),
    bajada: textoRequerido('La bajada'),
    cuerpo: esquemaDocumento,
    imagen_portada: textoOpcional,
    imagen_alt: z.string().trim(),
    imagen_credito: textoOpcional,
    categoria: z.enum(CATEGORIAS),
    temporada_id: z.uuid().nullable(),
    partido_id: z.uuid().nullable(),
    destacada: z.boolean(),
    auto_post: z.boolean(),
    redes: z.array(z.enum(REDES)),
  })
  .refine((n) => !n.imagen_portada || n.imagen_alt.length > 0, {
    path: ['imagen_alt'],
    message: 'Si hay imagen, el texto alternativo es obligatorio',
  })

export type EntradaNota = z.infer<typeof esquemaNota>

// ============================================
// Publicar
// ============================================

/** Un documento recién abierto: un párrafo vacío, que es lo que devuelve TipTap. */
export function documentoVacio(): DocumentoTipTap {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

/**
 * `true` si el cuerpo no tiene una sola letra.
 *
 * TipTap nunca devuelve un documento sin nodos: devuelve un párrafo vacío, y a
 * veces varios. Contar nodos daría "tiene contenido" con la nota en blanco, así
 * que lo que se mide es el texto.
 */
export function cuerpoVacio(cuerpo: DocumentoTipTap): boolean {
  return textoDelCuerpo(cuerpo).trim().length === 0
}

function textoDelCuerpo(nodo: { text?: string; content?: unknown[] }): string {
  const propio = typeof nodo.text === 'string' ? nodo.text : ''
  const hijos = Array.isArray(nodo.content) ? nodo.content : []

  return (
    propio +
    hijos
      .map((h) => (h && typeof h === 'object' ? textoDelCuerpo(h as { text?: string }) : ''))
      .join(' ')
  )
}

export interface ChequeoPublicacion {
  puede: boolean
  motivos: string[]
}

/**
 * Qué le falta a una nota para poder publicarse.
 *
 * Es más exigente que guardar, y a propósito: un borrador a medio escribir
 * tiene que poder guardarse —es el punto de un borrador—, pero lo que sale al
 * sitio no puede tener el cuerpo en blanco ni una imagen sin alt.
 *
 * Devuelve **todos** los motivos y no el primero: si faltan tres cosas, que
 * Charlie las vea de una y no de a una por intento.
 */
export function chequearPublicacion(nota: EntradaNota): ChequeoPublicacion {
  const motivos: string[] = []

  if (nota.titulo.trim() === '') motivos.push('Falta el título')
  if (nota.bajada.trim() === '') motivos.push('Falta la bajada')
  if (cuerpoVacio(nota.cuerpo)) motivos.push('El cuerpo está vacío')
  if (nota.imagen_portada && nota.imagen_alt.trim() === '') {
    motivos.push('La imagen de portada no tiene texto alternativo')
  }

  return { puede: motivos.length === 0, motivos }
}

/**
 * Las redes a las que se va a postear, ya filtradas por `auto_post`.
 *
 * El posteo en sí es idempotente por `social_posts (nota_id, platform)` (regla
 * no negociable 5); esto es sólo la lista que el Server Action le pasa a
 * Inngest.
 */
export function redesAPostear(nota: Pick<EntradaNota, 'auto_post' | 'redes'>): Red[] {
  return nota.auto_post ? nota.redes : []
}
