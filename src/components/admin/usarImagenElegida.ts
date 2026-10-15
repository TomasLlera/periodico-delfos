'use client'

import { useEffect, useState } from 'react'
import { subirImagen } from '@/actions/imagenes'
import { chequearImagen } from '@/lib/imagen'
import type { EntradaNota } from '@/lib/nota'

/**
 * La foto de portada elegida y todavía sin subir.
 *
 * Va separada de la entrada a propósito: en `imagen_portada` sólo puede vivir
 * una URL del bucket, porque es lo que se guarda en la base, y un `blob:` no lo
 * ve nadie más que este navegador (regla no negociable 6).
 *
 * Salió de `FormularioNota` cuando el borrador local lo pasó de las 300 líneas
 * que fija CLAUDE.md.
 */

interface Opciones {
  /** Cuando la foto ya subió: la URL del bucket pasa a la entrada. */
  onUrl: (url: string) => void
  onAviso: (aviso: string | null) => void
}

export function usarImagenElegida({ onUrl, onAviso }: Opciones) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [urlLocal, setUrlLocal] = useState<string | null>(null)

  // El `blob:` se libera al cambiar de archivo y al desmontar. Sin esto, cada
  // foto probada queda retenida hasta que se recarga la página.
  useEffect(() => {
    if (!archivo) {
      setUrlLocal(null)
      return
    }

    const url = URL.createObjectURL(archivo)
    setUrlLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  /** `false` si la foto no sirve; el aviso ya quedó puesto. `null` la saca. */
  function elegir(nuevo: File | null): boolean {
    if (!nuevo) {
      setArchivo(null)
      return true
    }

    const chequeo = chequearImagen(nuevo.type, nuevo.size)
    if (!chequeo.ok) {
      onAviso(chequeo.motivo ?? 'Esa imagen no se puede usar')
      return false
    }

    onAviso(null)
    setArchivo(nuevo)
    return true
  }

  /**
   * Sube la foto pendiente, si hay, y devuelve la entrada lista para la base.
   * `null` si la subida falló: quien llama corta ahí y no guarda a medias.
   *
   * **Una vez subida, deja de estar pendiente.** Si después falla el guardado
   * —un corte de señal, un slug repetido—, el reintento usa la URL que ya está
   * en el bucket en vez de volver a subir el archivo y dejar el primero
   * huérfano. Tira si no hay red: lo ataja `enviar()` del formulario.
   */
  async function subir(entrada: EntradaNota): Promise<EntradaNota | null> {
    if (!archivo) return entrada

    const formData = new FormData()
    formData.set('archivo', archivo)
    const r = await subirImagen(formData)

    if (r.error || !r.url) {
      onAviso(r.error ?? 'No se pudo subir la imagen')
      return null
    }

    const url = r.url
    onUrl(url)
    setArchivo(null)
    return { ...entrada, imagen_portada: url }
  }

  return { archivo, urlLocal, setArchivo, elegir, subir }
}
