'use client'

import { CampoTexto } from '@/components/admin/CampoTexto'
import type { EntradaNota } from '@/lib/nota'

/**
 * Título, slug y bajada: lo de arriba de la nota.
 *
 * Salió de `FormularioNota` cuando el borrador local lo pasó de las 300 líneas
 * que fija CLAUDE.md. La regla del slug —se arma solo mientras la nota no
 * existe— la aplica el formulario en `onTitulo`; acá sólo cambia la ayuda.
 */

interface Props {
  entrada: EntradaNota
  esNueva: boolean
  errores: Record<string, string>
  onTitulo: (titulo: string) => void
  onCambio: (campo: 'slug' | 'bajada', valor: string) => void
}

export function CamposEncabezado({ entrada, esNueva, errores, onTitulo, onCambio }: Props) {
  return (
    <>
      <CampoTexto
        id="titulo"
        etiqueta="Título"
        valor={entrada.titulo}
        onCambio={onTitulo}
        error={errores.titulo}
        ayuda="Sin el sufijo «Fecha N – Aldosivi…»: eso sale solo de los datos del partido."
      />

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={entrada.slug}
        onCambio={(v) => onCambio('slug', v)}
        error={errores.slug}
        ayuda={
          esNueva
            ? 'Se arma solo con el título. Podés corregirlo antes de guardar.'
            : 'Es la URL pública y ya está en la calle: cambiarla rompe los links compartidos.'
        }
      />

      <CampoTexto
        id="bajada"
        etiqueta="Bajada"
        valor={entrada.bajada}
        onCambio={(v) => onCambio('bajada', v)}
        error={errores.bajada}
        largo
        ayuda="Obligatoria. Es lo que se lee abajo del título y lo que viaja a las redes."
      />
    </>
  )
}
