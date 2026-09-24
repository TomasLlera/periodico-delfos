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
import { slugificar, textoOpcional, textoRequerido } from '@/lib/entidades/campos'
import type { Autor, DocumentoTipTap, Nota, Red } from '@/types'

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
  return slugificar(titulo)
}

// ============================================
// Validación del formulario
// ============================================

const CATEGORIAS = ['cronica', 'analisis', 'temporada', 'plantel', 'institucional'] as const
const REDES = ['facebook', 'instagram', 'x'] as const

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

/**
 * Quién firma una nota nueva escrita desde esta cuenta.
 *
 * Normalmente ella misma. Pero el panel exige fila en `autores` para entrar
 * —es lo que mira `es_autor()`— y eso convierte en autor a toda cuenta con
 * acceso, incluidas las que no escriben en el medio: la del operador técnico y
 * la de `scripts/usuario-e2e.ts`. Sus nombres no son firmas del diario, y una
 * nota de prueba que quede publicada no puede salir con el nombre de quien la
 * probó. Esas cuentas llevan `firma_como` apuntando al titular.
 *
 * Es **una sola indirección**, igual que en la base: si la cuenta apuntada a
 * su vez apunta a otra, no se sigue. Ver `0011_firma_autor.sql`.
 */
export function firmaDe(autor: Pick<Autor, 'id' | 'firma_como'>): string {
  return autor.firma_como ?? autor.id
}

/**
 * Lo que el formulario muestra al abrirse: los campos de la nota guardada, o
 * una nota en blanco lista para escribir.
 *
 * Vive acá y no en el componente porque es traducción de datos y no interfaz:
 * pasa de `NotaConRelaciones` —que trae autor, temporada y partido resueltos y
 * los campos que pone el servidor— a los trece campos que se editan. Que sea
 * puro deja probar que no se pierde ninguno.
 *
 * Los valores de una nota nueva no son neutros: la categoría arranca en
 * `cronica` porque es lo que más se escribe, y las tres redes vienen prendidas
 * porque el auto-posteo es el motivo por el que existe el pipeline. Apagar es
 * la excepción.
 */
export function entradaDesdeNota(nota: NotaParaEditar | null): EntradaNota {
  if (!nota) {
    return {
      titulo: '',
      slug: '',
      bajada: '',
      cuerpo: documentoVacio(),
      imagen_portada: null,
      imagen_alt: '',
      imagen_credito: null,
      categoria: 'cronica',
      temporada_id: null,
      partido_id: null,
      destacada: false,
      auto_post: true,
      redes: ['facebook', 'instagram', 'x'],
    }
  }

  return {
    titulo: nota.titulo,
    slug: nota.slug,
    bajada: nota.bajada,
    cuerpo: nota.cuerpo,
    imagen_portada: nota.imagen_portada,
    imagen_alt: nota.imagen_alt,
    imagen_credito: nota.imagen_credito,
    categoria: nota.categoria,
    temporada_id: nota.temporada_id,
    partido_id: nota.partido_id,
    destacada: nota.destacada,
    auto_post: nota.auto_post,
    redes: nota.redes,
  }
}

/** Los campos de una nota guardada que el editor sabe abrir. */
export type NotaParaEditar = Pick<
  Nota,
  | 'titulo'
  | 'slug'
  | 'bajada'
  | 'cuerpo'
  | 'imagen_portada'
  | 'imagen_alt'
  | 'imagen_credito'
  | 'categoria'
  | 'temporada_id'
  | 'partido_id'
  | 'destacada'
  | 'auto_post'
  | 'redes'
>
