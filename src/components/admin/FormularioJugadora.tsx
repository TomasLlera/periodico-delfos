'use client'

import { useEffect, useState } from 'react'
import { subirImagen } from '@/actions/imagenes'
import { guardarJugadora } from '@/actions/jugadoras'
import {
  entradaDesdeJugadora,
  esquemaJugadora,
  slugDeJugadora,
  POR_QUE_NO_SE_BORRA,
} from '@/lib/entidades/jugadora'
import { chequearImagen } from '@/lib/imagen'
import { NOMBRE_PUESTO } from '@/lib/plantel'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoFoto } from '@/components/admin/CampoFoto'
import { CampoSelect } from '@/components/admin/CampoSelect'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { Casilla } from '@/components/admin/Casilla'
import { usarFormulario } from '@/components/admin/usarFormulario'
import type { Jugadora, Posicion } from '@/types'

/**
 * La ficha de una jugadora.
 *
 * **El dorsal no está acá y es la decisión que hay que entender antes de usar
 * esta pantalla**: vive en `plantel`, porque cambia de una temporada a otra
 * (blueprint § 4.2). El número se pone en `/admin/plantel/[temporadaId]`, al
 * armar el plantel del año.
 *
 * La foto sigue el mismo camino que la portada de una nota: se elige, se
 * previsualiza con un `blob:` local y **se sube recién al guardar**. Lo que se
 * guarda en la base es siempre la URL del bucket (regla no negociable 6).
 */

const PUESTOS: readonly Posicion[] = [
  'arquera',
  'defensora',
  'mediocampista',
  'delantera',
  'dt',
  'ayudante',
]

export function FormularioJugadora({ jugadora }: { jugadora: Jugadora | null }) {
  const esNueva = jugadora === null

  const [archivo, setArchivo] = useState<File | null>(null)
  const [urlLocal, setUrlLocal] = useState<string | null>(null)

  const f = usarFormulario({
    inicial: entradaDesdeJugadora(jugadora),
    esquema: esquemaJugadora,
    guardar: async (datos) => {
      // La subida va adentro del guardado y no al elegir el archivo: así,
      // probar tres fotos y cerrar el formulario no deja tres huérfanas.
      if (!archivo) return guardarJugadora(datos, jugadora?.id ?? null)

      const formData = new FormData()
      formData.set('archivo', archivo)
      const subida = await subirImagen(formData)

      if (subida.error || !subida.url) {
        return { error: subida.error ?? 'No se pudo subir la foto' }
      }

      return guardarJugadora({ ...datos, foto_url: subida.url }, jugadora?.id ?? null)
    },
    volverA: '/admin/jugadoras',
  })

  // El `blob:` se libera al cambiar de archivo y al desmontar. Sin esto, cada
  // foto probada queda retenida hasta recargar la página.
  useEffect(() => {
    if (!archivo) {
      setUrlLocal(null)
      return
    }

    const url = URL.createObjectURL(archivo)
    setUrlLocal(url)
    return () => URL.revokeObjectURL(url)
  }, [archivo])

  function elegirArchivo(nuevo: File | null) {
    if (!nuevo) {
      setArchivo(null)
      f.cambiar('foto_url', null)
      return
    }

    const chequeo = chequearImagen(nuevo.type, nuevo.size)
    if (!chequeo.ok) {
      f.mostrarAviso(chequeo.motivo ?? 'Esa imagen no se puede usar')
      return
    }

    f.mostrarAviso(null)
    setArchivo(nuevo)
  }

  /** El slug sale del nombre completo, y sólo mientras la ficha no existe. */
  function recalcular(nombre: string, apellido: string) {
    f.cambiarVarios({
      nombre,
      apellido,
      slug: esNueva ? slugDeJugadora(nombre, apellido) : f.entrada.slug,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="nombre"
          etiqueta="Nombre"
          valor={f.entrada.nombre}
          onCambio={(v) => recalcular(v, f.entrada.apellido)}
          error={f.errores.nombre}
        />

        <CampoTexto
          id="apellido"
          etiqueta="Apellido"
          valor={f.entrada.apellido}
          onCambio={(v) => recalcular(f.entrada.nombre, v)}
          error={f.errores.apellido}
        />
      </div>

      <CampoSelect
        id="posicion"
        etiqueta="Puesto"
        valor={f.entrada.posicion}
        opciones={PUESTOS.map((p) => ({ valor: p, nombre: NOMBRE_PUESTO[p] }))}
        onCambio={(v) => f.cambiar('posicion', v as Posicion)}
        error={f.errores.posicion}
        ayuda="El natural. Si una temporada juega en otro puesto, se cambia en el plantel de ese año."
      />

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={f.entrada.slug}
        onCambio={(v) => f.cambiar('slug', v)}
        error={f.errores.slug}
        ayuda={
          esNueva
            ? 'Se arma solo con el nombre y el apellido.'
            : 'Es la URL de su ficha: cambiarla rompe los links compartidos.'
        }
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_nacimiento" className="meta text-gris">
            Fecha de nacimiento
          </label>
          <input
            id="fecha_nacimiento"
            type="date"
            value={f.entrada.fecha_nacimiento ?? ''}
            onChange={(e) => f.cambiar('fecha_nacimiento', e.target.value || null)}
            className="tactil w-full border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
          />
          <p className="text-[0.8rem] text-gris">Opcional. La ficha calcula la edad con esto.</p>
        </div>

        <CampoTexto
          id="lugar_origen"
          etiqueta="De dónde es"
          valor={f.entrada.lugar_origen ?? ''}
          onCambio={(v) => f.cambiar('lugar_origen', v || null)}
          ayuda="Opcional."
        />
      </div>

      <CampoTexto
        id="bio"
        etiqueta="Bio"
        valor={f.entrada.bio ?? ''}
        onCambio={(v) => f.cambiar('bio', v || null)}
        largo
        ayuda="Opcional. Un párrafo para su ficha."
      />

      <CampoFoto
        urlGuardada={f.entrada.foto_url}
        urlLocal={urlLocal}
        nombre={`${f.entrada.nombre} ${f.entrada.apellido}`.trim()}
        onArchivo={elegirArchivo}
      />

      <Casilla
        id="activa"
        etiqueta="Está en el club"
        valor={f.entrada.activa}
        onCambio={(v) => f.cambiar('activa', v)}
        ayuda="Al desmarcarla deja de ofrecerse para los planteles nuevos, y sigue en las planillas viejas."
      />

      {!f.entrada.activa && <Aviso tono="atencion">{POR_QUE_NO_SE_BORRA}</Aviso>}

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/jugadoras"
        etiqueta={esNueva ? 'Crear la ficha' : 'Guardar'}
      />
    </div>
  )
}
