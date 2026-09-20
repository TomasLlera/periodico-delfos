'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Save, Send } from 'lucide-react'
import { guardarNota, publicarNota } from '@/actions/notas'
import { documentoVacio, esquemaNota, slugDesdeTitulo, type EntradaNota } from '@/lib/nota'
import { EditorCuerpo } from '@/components/admin/EditorCuerpo'
import { CampoTexto } from '@/components/admin/CampoTexto'
import type { NotaConRelaciones, Temporada } from '@/types'

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
}

const CATEGORIAS = [
  ['cronica', 'Crónica'],
  ['analisis', 'Análisis'],
  ['temporada', 'Temporada'],
  ['plantel', 'Plantel'],
  ['institucional', 'Institucional'],
] as const

function entradaInicial(nota: NotaConRelaciones | null): EntradaNota {
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

  const { titulo, slug, bajada, cuerpo, imagen_portada, imagen_alt, imagen_credito } = nota
  const { categoria, temporada_id, partido_id, destacada, auto_post, redes } = nota

  return {
    titulo,
    slug,
    bajada,
    cuerpo,
    imagen_portada,
    imagen_alt,
    imagen_credito,
    categoria,
    temporada_id,
    partido_id,
    destacada,
    auto_post,
    redes,
  }
}

export function FormularioNota({ nota, temporadas }: Props) {
  const router = useRouter()
  const [entrada, setEntrada] = useState<EntradaNota>(() => entradaInicial(nota))
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, empezar] = useTransition()

  const esNueva = nota === null

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
    const parseo = esquemaNota.safeParse(entrada)
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
      const r = await guardarNota(entrada, nota?.id ?? null)
      if (r.error) {
        setAviso(r.error)
        return
      }
      setAviso('Guardado')
      // Al crear, la URL pasa a ser la de la nota: recargar el editor no
      // vuelve a crear una segunda.
      if (esNueva && r.id) router.replace(`/admin/notas/${r.id}`)
      else router.refresh()
    })
  }

  function alPublicar() {
    if (!validar()) return

    empezar(async () => {
      const r = await publicarNota(entrada, nota?.id ?? null)
      if (r.error) {
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
        <EditorCuerpo valor={entrada.cuerpo} onCambio={(d) => cambiar('cuerpo', d)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="categoria" className="meta text-gris">
            Categoría
          </label>
          <select
            id="categoria"
            value={entrada.categoria}
            onChange={(e) => cambiar('categoria', e.target.value as EntradaNota['categoria'])}
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
          >
            {CATEGORIAS.map(([valor, nombre]) => (
              <option key={valor} value={valor}>
                {nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="temporada" className="meta text-gris">
            Temporada
          </label>
          <select
            id="temporada"
            value={entrada.temporada_id ?? ''}
            onChange={(e) => cambiar('temporada_id', e.target.value || null)}
            className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
          >
            <option value="">Ninguna</option>
            {temporadas.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CampoTexto
        id="imagen_portada"
        etiqueta="Imagen de portada"
        valor={entrada.imagen_portada ?? ''}
        onCambio={(v) => cambiar('imagen_portada', v || null)}
        error={errores.imagen_portada}
        ayuda="Por ahora, la URL pública del bucket. La subida desde el editor entra con la vista previa."
      />

      <CampoTexto
        id="imagen_alt"
        etiqueta="Texto alternativo"
        valor={entrada.imagen_alt}
        onCambio={(v) => cambiar('imagen_alt', v)}
        error={errores.imagen_alt}
        ayuda="Obligatorio si hay imagen. Describí lo que se ve, para quien no la ve."
      />

      <div className="flex flex-wrap gap-5">
        <Casilla
          id="destacada"
          etiqueta="Destacada en la portada"
          valor={entrada.destacada}
          onCambio={(v) => cambiar('destacada', v)}
        />
        <Casilla
          id="auto_post"
          etiqueta="Postear a las redes al publicar"
          valor={entrada.auto_post}
          onCambio={(v) => cambiar('auto_post', v)}
        />
      </div>

      {aviso && (
        <p role="status" className="border-l-2 border-verde-600 bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-linea bg-papel py-3">
        <button
          type="button"
          onClick={alGuardar}
          disabled={guardando}
          className="tactil flex items-center gap-2 border border-linea-fuerte px-5 font-display text-[0.9rem] font-bold hover:bg-papel-alt disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          Guardar borrador
        </button>

        <button
          type="button"
          onClick={alPublicar}
          disabled={guardando}
          className="tactil flex items-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
        >
          <Send size={16} aria-hidden="true" />
          Publicar
        </button>
      </div>
    </div>
  )
}

function Casilla({
  id,
  etiqueta,
  valor,
  onCambio,
}: {
  id: string
  etiqueta: string
  valor: boolean
  onCambio: (v: boolean) => void
}) {
  return (
    <label htmlFor={id} className="tactil flex items-center gap-2 text-[0.9rem]">
      <input
        id={id}
        type="checkbox"
        checked={valor}
        onChange={(e) => onCambio(e.target.checked)}
        className="size-4 accent-verde-900"
      />
      {etiqueta}
    </label>
  )
}
