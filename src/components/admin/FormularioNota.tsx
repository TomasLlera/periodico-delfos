'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { subirImagen } from '@/actions/imagenes'
import { guardarNota, publicarNota } from '@/actions/notas'
import { chequearImagen } from '@/lib/imagen'
import { entradaDesdeNota, esquemaNota, slugDesdeTitulo, type EntradaNota } from '@/lib/nota'
import { esSobrePublicada, notaDePrevisualizacion } from '@/lib/vista-previa'
import { BarraAcciones } from '@/components/admin/BarraAcciones'
import { CampoImagen } from '@/components/admin/CampoImagen'
import type { NotaEnlazable } from '@/components/admin/EnlazarNota'
import { CamposClasificacion } from '@/components/admin/CamposClasificacion'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { EditorCuerpo } from '@/components/admin/EditorCuerpo'
import { VistaPrevia } from '@/components/admin/VistaPrevia'
import type { Autor, NotaConRelaciones, PartidoConEquipos, Temporada } from '@/types'

/**
 * El formulario de nota, crear y editar con el mismo componente.
 *
 * Todo el estado vive acá y no en campos sueltos de un `<form>` porque el
 * cuerpo es un árbol de TipTap y porque la vista previa necesita el estado
 * completo sin haber guardado nada. Por eso los Server Actions reciben un
 * objeto y no un `FormData`.
 *
 * **El slug se calcula del título sólo mientras la nota no existe.** Una vez
 * guardada, renombrarla no le toca la URL: cambiarla rompe el link que se
 * compartió y la redirección 301 que apunta ahí (regla no negociable 8). El
 * campo queda editable a mano, que es la única forma prevista de cambiarlo.
 */

interface Props {
  /** La nota guardada, si se está editando. `null` al crear. */
  nota: NotaConRelaciones | null
  temporadas: readonly Temporada[]
  partidos: readonly PartidoConEquipos[]
  /** Las publicadas, para el botón de anclar del editor. */
  enlazables: readonly NotaEnlazable[]
  /** El de la sesión. La vista previa lo necesita para firmar la nota. */
  autor: Autor
}

export function FormularioNota({ nota, temporadas, partidos, enlazables, autor }: Props) {
  const router = useRouter()
  const [entrada, setEntrada] = useState<EntradaNota>(() => entradaDesdeNota(nota))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, empezar] = useTransition()

  // La imagen elegida y todavía sin subir. Va separada de `entrada` a
  // propósito: en `entrada.imagen_portada` sólo puede vivir una URL del bucket,
  // porque es lo que se guarda en la base, y un `blob:` no lo ve nadie más que
  // este navegador (regla no negociable 6).
  const [archivo, setArchivo] = useState<File | null>(null)
  const [urlLocal, setUrlLocal] = useState<string | null>(null)
  const [previa, setPrevia] = useState(false)

  const esNueva = nota === null

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

  /**
   * La entrada como se va a ver, con la imagen elegida en el lugar de la
   * guardada. Es lo que validan Zod y la vista previa: así el alt se exige
   * desde que se elige la foto y no recién después de subirla.
   */
  const entradaEfectiva: EntradaNota = {
    ...entrada,
    imagen_portada: urlLocal ?? entrada.imagen_portada,
  }

  function elegirArchivo(nuevo: File | null) {
    if (!nuevo) {
      setArchivo(null)
      cambiar('imagen_portada', null)
      return
    }

    const chequeo = chequearImagen(nuevo.type, nuevo.size)
    if (!chequeo.ok) {
      setAviso(chequeo.motivo ?? 'Esa imagen no se puede usar')
      return
    }

    setAviso(null)
    setArchivo(nuevo)
  }

  /**
   * Sube la imagen pendiente, si hay, y devuelve la entrada lista para la base.
   * `null` si la subida falló: el llamador corta ahí y no guarda a medias.
   */
  async function conImagenSubida(): Promise<EntradaNota | null> {
    if (!archivo) return entrada

    const formData = new FormData()
    formData.set('archivo', archivo)
    const r = await subirImagen(formData)

    if (r.error || !r.url) {
      setAviso(r.error ?? 'No se pudo subir la imagen')
      return null
    }

    return { ...entrada, imagen_portada: r.url }
  }

  function cambiar<C extends keyof EntradaNota>(campo: C, valor: EntradaNota[C]) {
    setEntrada((previa) => ({ ...previa, [campo]: valor }))
  }

  function cambiarTitulo(titulo: string) {
    setEntrada((previa) => ({
      ...previa,
      titulo,
      // Sólo mientras no exista: después la URL ya está en la calle.
      slug: esNueva ? slugDesdeTitulo(titulo) : previa.slug,
    }))
  }

  /** Corre Zod y deja los errores al lado de cada campo. `true` si pasa. */
  function validar(): boolean {
    const parseo = esquemaNota.safeParse(entradaEfectiva)
    if (parseo.success) {
      setErrores({})
      return true
    }

    const encontrados: Record<string, string> = {}
    for (const issue of parseo.error.issues) {
      const campo = String(issue.path[0] ?? 'general')
      encontrados[campo] ??= issue.message
    }
    setErrores(encontrados)
    return false
  }

  function alGuardar() {
    if (!validar()) return

    empezar(async () => {
      const lista = await conImagenSubida()
      if (!lista) return

      const r = await guardarNota(lista, nota?.id ?? null)
      if (r.error) {
        setAviso(r.error)
        return
      }
      setAviso('Guardado')
      setArchivo(null)
      // Al crear, la URL pasa a ser la de la nota: recargar el editor no
      // vuelve a crear una segunda.
      if (esNueva && r.id) router.replace(`/admin/notas/${r.id}`)
      else router.refresh()
    })
  }

  /**
   * Abrir la vista previa es el paso obligado antes de publicar.
   *
   * No hay botón que publique derecho: publicar dispara el auto-posteo a las
   * redes, que no tiene vuelta atrás, y mirar cómo quedó cuesta un click. La
   * validación corre antes de abrirla — no tiene sentido previsualizar una nota
   * a la que le falta la bajada.
   *
   * Es una garantía de interfaz y no del servidor: `publicarNota` no tiene
   * forma de saber si alguien miró la preview, y con un solo autor no vale la
   * pena inventar un token firmado para demostrarlo. Lo que el servidor sí
   * vuelve a chequear es que la nota esté completa.
   */
  function abrirPrevia() {
    if (validar()) setPrevia(true)
  }

  function alPublicar() {
    empezar(async () => {
      const lista = await conImagenSubida()
      if (!lista) {
        setPrevia(false)
        return
      }

      const r = await publicarNota(lista, nota?.id ?? null)
      if (r.error) {
        setPrevia(false)
        setAviso([r.error, ...(r.motivos ?? [])].join(' · '))
        return
      }
      router.push('/admin')
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <CampoTexto
        id="titulo"
        etiqueta="Título"
        valor={entrada.titulo}
        onCambio={cambiarTitulo}
        error={errores.titulo}
        ayuda="Sin el sufijo «Fecha N – Aldosivi…»: eso sale solo de los datos del partido."
      />

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={entrada.slug}
        onCambio={(v) => cambiar('slug', v)}
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
        onCambio={(v) => cambiar('bajada', v)}
        error={errores.bajada}
        largo
        ayuda="Obligatoria. Es lo que se lee abajo del título y lo que viaja a las redes."
      />

      <div className="flex flex-col gap-1">
        <span className="meta text-gris">Cuerpo</span>
        <EditorCuerpo
          valor={entrada.cuerpo}
          onCambio={(d) => cambiar('cuerpo', d)}
          notas={enlazables}
          idActual={nota?.id ?? null}
          partidos={partidos}
        />
      </div>

      <CamposClasificacion
        entrada={entrada}
        temporadas={temporadas}
        partidos={partidos}
        onCambio={cambiar}
      />

      <CampoImagen
        urlGuardada={entrada.imagen_portada}
        urlLocal={urlLocal}
        alt={entrada.imagen_alt}
        credito={entrada.imagen_credito}
        errorAlt={errores.imagen_alt}
        onArchivo={elegirArchivo}
        onAlt={(v) => cambiar('imagen_alt', v)}
        onCredito={(v) => cambiar('imagen_credito', v)}
      />

      <BarraAcciones
        aviso={aviso}
        ocupado={guardando}
        onGuardar={alGuardar}
        onVistaPrevia={abrirPrevia}
      />

      {previa && (
        <VistaPrevia
          nota={notaDePrevisualizacion({
            entrada: entradaEfectiva,
            autor,
            temporada: temporadas.find((t) => t.id === entrada.temporada_id) ?? null,
            partido: nota?.partido ?? null,
            existente: nota,
          })}
          sobrePublicada={esSobrePublicada(nota)}
          onVolver={() => setPrevia(false)}
          onPublicar={alPublicar}
          publicando={guardando}
        />
      )}
    </div>
  )
}

