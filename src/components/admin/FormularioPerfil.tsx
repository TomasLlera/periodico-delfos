'use client'

import { guardarPerfil } from '@/actions/autor'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { usarFormulario } from '@/components/admin/usarFormulario'
import { esquemaAutor, type EntradaAutor } from '@/lib/entidades/autor'
import type { Autor } from '@/types'

/**
 * El perfil de quien firma, editable desde el panel.
 *
 * Hasta ahora `autores` se cargaba a mano en la base: la tabla tiene `bio`,
 * `foto_url`, `instagram` y `x_handle` desde la migración 0001, pero ninguna
 * pantalla los escribía, así que la caja del pie de cada nota mostraba lo que
 * alguien hubiera puesto con SQL. Lo pidió Charlie.
 *
 * **La foto es una URL y no una subida.** `CampoImagen` sube al bucket de
 * imágenes de notas, que tiene su propia ruta, su `alt` obligatorio y su
 * revalidación; un avatar no encaja ahí y hacerle una segunda ruta de subida
 * por una imagen que se cambia una vez por año es desproporcionado. Queda
 * anotado como lo primero a mejorar si molesta.
 */
interface Props {
  autor: Autor
}

function entradaDesdeAutor(autor: Autor): EntradaAutor {
  return {
    nombre: autor.nombre,
    bio: autor.bio,
    foto_url: autor.foto_url,
    instagram: autor.instagram,
    x_handle: autor.x_handle,
  }
}

export function FormularioPerfil({ autor }: Props) {
  const f = usarFormulario({
    inicial: entradaDesdeAutor(autor),
    esquema: esquemaAutor,
    guardar: (datos) => guardarPerfil(datos),
    volverA: '/admin',
  })

  return (
    <div className="flex flex-col gap-5">
      <CampoTexto
        id="nombre"
        etiqueta="Nombre"
        valor={f.entrada.nombre}
        onCambio={(v) => f.cambiar('nombre', v)}
        error={f.errores.nombre}
        ayuda="Como firma cada nota: «Charlie Redondo»."
      />

      <CampoTexto
        id="bio"
        etiqueta="Bio"
        largo
        valor={f.entrada.bio ?? ''}
        onCambio={(v) => f.cambiar('bio', v || null)}
        error={f.errores.bio}
        ayuda="Dos o tres líneas. Se ve en la caja del pie de cada nota y en la página del autor."
      />

      <CampoTexto
        id="foto_url"
        etiqueta="Foto"
        valor={f.entrada.foto_url ?? ''}
        onCambio={(v) => f.cambiar('foto_url', v || null)}
        error={f.errores.foto_url}
        ayuda="La dirección de una imagen ya publicada, empezando con https://. Sin foto se muestran las iniciales."
      />

      <CampoTexto
        id="instagram"
        etiqueta="Instagram"
        valor={f.entrada.instagram ?? ''}
        onCambio={(v) => f.cambiar('instagram', v || null)}
        error={f.errores.instagram}
        ayuda="Sólo el usuario. Si pegás el link entero o con arroba, se limpia solo al guardar."
      />

      <CampoTexto
        id="x_handle"
        etiqueta="X"
        valor={f.entrada.x_handle ?? ''}
        onCambio={(v) => f.cambiar('x_handle', v || null)}
        error={f.errores.x_handle}
        ayuda="Igual que Instagram: sólo el usuario."
      />

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin"
        etiqueta="Guardar el perfil"
      />
    </div>
  )
}
