'use client'

import { useState } from 'react'
import { subirImagen } from '@/actions/imagenes'
import { borrarSponsor, guardarSponsor } from '@/actions/sponsors'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { BotonBorrar } from '@/components/admin/BotonBorrar'
import { CampoFoto } from '@/components/admin/CampoFoto'
import { CampoNumero } from '@/components/admin/CampoNumero'
import { CampoSelect } from '@/components/admin/CampoSelect'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { Casilla } from '@/components/admin/Casilla'
import { usarFormulario } from '@/components/admin/usarFormulario'
import { esquemaSponsor, type EntradaSponsor } from '@/lib/entidades/sponsor'
import { ETIQUETA_UBICACION, hoyEnArgentina } from '@/lib/sponsors'
import type { Sponsor, UbicacionSponsor } from '@/types'

/**
 * El formulario de un espacio de publicidad.
 *
 * **La imagen se sube recién al guardar**, igual que la portada de una nota:
 * mientras tanto la preview pinta con un `blob:` local. Así, abrir el
 * formulario, probar tres banners y cerrar sin guardar no deja nada tirado en
 * el bucket.
 *
 * El `blob:` ocupa el lugar de `imagen_url` mientras no haya subida, que es lo
 * que deja pasar la validación del cliente; el valor que llega al Server Action
 * es siempre la URL del bucket, nunca el `blob:`.
 *
 * **La fecha de fin puede quedar vacía** y es el caso normal de un sponsor con
 * contrato abierto. Lo que no puede es ser anterior al inicio: eso lo rebota el
 * esquema con el error al lado del campo, y también la base con un CHECK.
 */
interface Props {
  sponsor: Sponsor | null
}

const UBICACIONES_SELECT = (
  Object.keys(ETIQUETA_UBICACION) as UbicacionSponsor[]
).map((valor) => ({ valor, nombre: ETIQUETA_UBICACION[valor] }))

function entradaDesde(sponsor: Sponsor | null): EntradaSponsor {
  return {
    nombre: sponsor?.nombre ?? '',
    imagen_url: sponsor?.imagen_url ?? '',
    alt: sponsor?.alt ?? '',
    link: sponsor?.link ?? null,
    ubicacion: sponsor?.ubicacion ?? 'portada_arriba',
    desde: sponsor?.desde ?? hoyEnArgentina(),
    hasta: sponsor?.hasta ?? null,
    orden: sponsor?.orden ?? 0,
    activo: sponsor?.activo ?? true,
  }
}

export function FormularioSponsor({ sponsor }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null)
  const [urlLocal, setUrlLocal] = useState<string | null>(null)

  const f = usarFormulario({
    inicial: entradaDesde(sponsor),
    esquema: esquemaSponsor,
    guardar: async (datos) => {
      let imagen_url = datos.imagen_url

      if (archivo) {
        const cuerpo = new FormData()
        cuerpo.append('archivo', archivo)
        const subida = await subirImagen(cuerpo)
        if (subida.error || !subida.url) {
          return { error: subida.error ?? 'No se pudo subir la imagen' }
        }
        imagen_url = subida.url
      }

      return guardarSponsor({ ...datos, imagen_url }, sponsor?.id ?? null)
    },
    volverA: '/admin/sponsors',
  })

  function elegirArchivo(elegido: File | null) {
    setArchivo(elegido)
    const url = elegido ? URL.createObjectURL(elegido) : null
    setUrlLocal(url)
    // El `blob:` ocupa el lugar del campo para que la validación del cliente no
    // frene un alta donde la imagen todavía no se subió. Lo reemplaza la URL
    // del bucket antes de llegar al action.
    f.cambiar('imagen_url', url ?? '')
  }

  return (
    <div className="flex flex-col gap-5">
      <Aviso>
        El aviso se muestra rotulado como <strong>Publicidad</strong>, siempre.
        Es lo que separa un espacio pago del contenido del medio, y no se puede
        apagar.
      </Aviso>

      <CampoTexto
        id="nombre"
        etiqueta="Quién es"
        valor={f.entrada.nombre}
        onCambio={(v) => f.cambiar('nombre', v)}
        error={f.errores.nombre}
        ayuda="El nombre del anunciante. No se muestra: sirve para encontrarlo acá adentro."
      />

      <div className="flex flex-col gap-1">
        <span className="meta text-text-muted">La pieza</span>
        <CampoFoto
          urlGuardada={sponsor?.imagen_url ?? null}
          urlLocal={urlLocal}
          nombre={f.entrada.nombre || 'el sponsor'}
          onArchivo={elegirArchivo}
        />
        {f.errores.imagen_url && (
          <p className="text-[0.85rem] text-danger">{f.errores.imagen_url}</p>
        )}
      </div>

      <CampoTexto
        id="alt"
        etiqueta="Qué dice la pieza"
        valor={f.entrada.alt}
        onCambio={(v) => f.cambiar('alt', v)}
        error={f.errores.alt}
        ayuda="Lo que escucha quien usa lector de pantalla. Por ejemplo: «Banner de Panadería San Juan»."
      />

      <CampoTexto
        id="link"
        etiqueta="A dónde lleva"
        valor={f.entrada.link ?? ''}
        onCambio={(v) => f.cambiar('link', v || null)}
        error={f.errores.link}
        ayuda="Empezando con https://. Si se deja vacío, el aviso se muestra sin link."
      />

      <CampoSelect
        id="ubicacion"
        etiqueta="Dónde va"
        valor={f.entrada.ubicacion}
        opciones={UBICACIONES_SELECT}
        onCambio={(v) => f.cambiar('ubicacion', v as UbicacionSponsor)}
        error={f.errores.ubicacion}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoFecha
          id="desde"
          etiqueta="Desde"
          valor={f.entrada.desde}
          onCambio={(v) => f.cambiar('desde', v)}
          error={f.errores.desde}
          ayuda="El primer día que se muestra."
        />

        <CampoFecha
          id="hasta"
          etiqueta="Hasta"
          valor={f.entrada.hasta ?? ''}
          onCambio={(v) => f.cambiar('hasta', v || null)}
          error={f.errores.hasta}
          ayuda="El último día, inclusive. Vacío: sin fecha de fin."
        />
      </div>

      <CampoNumero
        id="orden"
        etiqueta="Orden"
        valor={f.entrada.orden}
        onCambio={(v) => f.cambiar('orden', v ?? 0)}
        min={0}
        max={99}
        error={f.errores.orden}
        ayuda="Si hay más de uno en el mismo lugar, el número más chico va primero."
      />

      <Casilla
        id="activo"
        etiqueta="Al aire"
        valor={f.entrada.activo}
        onCambio={(v) => f.cambiar('activo', v)}
        ayuda="Destildado, el aviso no se muestra aunque esté en fecha. Sirve para bajarlo un rato sin perder la campaña."
      />

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/sponsors"
        etiqueta={sponsor ? 'Guardar el sponsor' : 'Crear el sponsor'}
        borrar={
          sponsor && (
            <BotonBorrar
              que={`el sponsor ${sponsor.nombre}`}
              consecuencia="Para terminar una campaña no hace falta borrarla: alcanza con ponerle fecha de fin o destildar «Al aire», y así queda el registro de lo que se publicó."
              borrar={() => borrarSponsor(sponsor.id)}
              volverA="/admin/sponsors"
            />
          )
        }
      />
    </div>
  )
}

/**
 * Un `<input type="date">` con la misma estructura que `<CampoTexto />`.
 *
 * Vive acá y no en `components/admin/` porque es el único formulario que usa
 * fechas sin hora: el resto del panel trabaja con `datetime-local` —un partido
 * tiene hora— y mezclarlos en un componente con una bandera habría dejado un
 * campo que hace dos cosas para ahorrar quince líneas.
 */
function CampoFecha({
  id,
  etiqueta,
  valor,
  onCambio,
  error,
  ayuda,
}: {
  id: string
  etiqueta: string
  valor: string
  onCambio: (valor: string) => void
  error?: string
  ayuda?: string
}) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  const idError = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="meta text-text-muted">
        {etiqueta}
      </label>

      <input
        id={id}
        type="date"
        value={valor}
        onChange={(e) => onCambio(e.target.value)}
        aria-describedby={[idError, idAyuda].filter(Boolean).join(' ') || undefined}
        aria-invalid={error ? true : undefined}
        className={`tactil w-full border bg-bg-elevated px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-accent-text ${
          error ? 'border-danger' : 'border-border-control'
        }`}
      />

      {error && (
        <p id={idError} className="text-[0.85rem] text-danger">
          {error}
        </p>
      )}

      {ayuda && (
        <p id={idAyuda} className="text-[0.8rem] text-text-muted">
          {ayuda}
        </p>
      )}
    </div>
  )
}
