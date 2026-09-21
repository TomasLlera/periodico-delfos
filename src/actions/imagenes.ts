'use server'

import { chequearImagen, rutaEnBucket } from '@/lib/imagen'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'

/**
 * Sube la portada de una nota al bucket `media`.
 *
 * **Con la sesión de Charlie, no con la service role.** El cliente de
 * `supabase/admin.ts` bypassea RLS y existe para procesos sin usuario —Inngest
 * y el script de migración—; usarlo acá convertiría al panel en una puerta que
 * escribe lo que quiera. Lo que habilita esta subida es la política
 * `media_escritura_autor` de `0010_storage_media.sql`, que pide `es_autor()`.
 *
 * Si esa migración todavía no se aplicó, esto falla con un error de política y
 * el mensaje lo dice: es el síntoma esperado, no un bug del editor.
 *
 * **Sube recién cuando Charlie guarda o publica**, nunca al elegir el archivo.
 * Mientras tanto la preview pinta con un `blob:` local. Así, abrir el editor,
 * probar tres fotos y cerrar sin guardar no deja nada en el bucket.
 */

export interface ResultadoSubida {
  /** La URL pública del bucket. Es lo que se guarda en `notas.imagen_portada`. */
  url?: string
  error?: string
}

export async function subirImagen(formData: FormData): Promise<ResultadoSubida> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const archivo = formData.get('archivo')
  if (!(archivo instanceof File)) return { error: 'No llegó ninguna imagen' }

  // El mismo chequeo que hace el navegador antes de mostrar la preview. Se
  // repite porque esto es una ruta HTTP y se puede llamar sin pasar por ahí.
  const chequeo = chequearImagen(archivo.type, archivo.size)
  if (!chequeo.ok) return { error: chequeo.motivo }

  const supabase = await createClient()
  const ruta = rutaEnBucket(archivo.type, crypto.randomUUID())

  const { error } = await supabase.storage.from('media').upload(ruta, archivo, {
    contentType: archivo.type,
    // Nunca pisar: la ruta lleva un uuid, así que si ya existe es que algo
    // anda muy mal y es mejor enterarse.
    upsert: false,
  })

  if (error) {
    return {
      error: error.message.includes('policy')
        ? 'El bucket no tiene permisos de escritura todavía: falta aplicar 0010_storage_media.sql'
        : 'No se pudo subir la imagen',
    }
  }

  const { data } = supabase.storage.from('media').getPublicUrl(ruta)

  return { url: data.publicUrl }
}
