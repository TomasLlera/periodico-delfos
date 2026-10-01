'use client'

import { useState } from 'react'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { LogoDeRed } from '@/components/layout/LogoDeRed'
import { NOMBRE_DE_RED } from '@/lib/logos-redes'
import { datosDePosteo } from '@/lib/tiptap/posteo'

/**
 * El panel para citar un posteo de Instagram o de X en el cuerpo de la nota.
 *
 * **Pide la cita a mano, y eso no es una limitación técnica sino el nodo.** El
 * embed oficial de las dos plataformas trae el texto solo, y también se lo
 * lleva solo el día que borran el posteo. Acá el texto queda escrito en la nota:
 * lo que se publica sobrevive a la cuenta. Por eso es obligatorio —ver
 * `atributosPosteo()`, que descarta el nodo sin cita— y por eso este panel no
 * tiene un botón de "traerlo automáticamente".
 *
 * **El handle se prellena cuando la URL lo trae.** X lo trae siempre; Instagram
 * casi nunca, porque `instagram.com/p/CÓDIGO/` no dice de quién es el posteo. Se
 * prellena sólo mientras nadie lo haya tocado: pisar lo que alguien escribió
 * porque después corrigió el link es peor que no ayudar.
 *
 * Valida mientras se escribe y muestra qué red reconoció. Pegar un link y no
 * saber si agarró hasta publicar la nota es la forma más barata de publicar un
 * hueco.
 */
interface Props {
  onInsertar: (posteo: { url: string; usuario: string; texto: string }) => void
  onCerrar: () => void
}

export function InsertarPosteo({ onInsertar, onCerrar }: Props) {
  const [url, setUrl] = useState('')
  const [usuario, setUsuario] = useState('')
  const [texto, setTexto] = useState('')
  const [usuarioTocado, setUsuarioTocado] = useState(false)
  const [tocado, setTocado] = useState(false)

  const datos = datosDePosteo(url)
  const urlEscrita = url.trim() !== ''

  // El handle que vale: el que se escribió, o el que trajo la URL.
  const handle = (usuarioTocado ? usuario : (datos?.usuario ?? '')).replace(/^@+/, '')

  const errorUrl =
    tocado && urlEscrita && !datos
      ? 'No parece el link de un posteo de Instagram o de X.'
      : undefined
  const errorUsuario =
    tocado && handle.trim() === '' ? 'Hace falta para saber quién lo dijo.' : undefined
  const errorTexto =
    tocado && texto.trim() === ''
      ? 'Hace falta: es lo que queda en la nota si borran el posteo.'
      : undefined

  const listo = datos !== null && handle.trim() !== '' && texto.trim() !== ''

  return (
    <div className="mt-3 flex flex-col gap-3 border border-border-control bg-bg-elevated p-4">
      <CampoTexto
        id="posteo-url"
        etiqueta="Link del posteo"
        valor={url}
        onCambio={(valor) => {
          setUrl(valor)
          setTocado(true)
        }}
        error={errorUrl}
        ayuda="El que da el botón Compartir de Instagram o de X. Sirve igual uno viejo de twitter.com."
      />

      <CampoTexto
        id="posteo-usuario"
        etiqueta="De quién es"
        valor={handle}
        onCambio={(valor) => {
          setUsuario(valor)
          setUsuarioTocado(true)
          setTocado(true)
        }}
        error={errorUsuario}
        ayuda="El nombre de la cuenta, sin la arroba: la pone el sitio."
      />

      <CampoTexto
        id="posteo-texto"
        etiqueta="Qué dice el posteo"
        valor={texto}
        onCambio={(valor) => {
          setTexto(valor)
          setTocado(true)
        }}
        error={errorTexto}
        largo
        ayuda="Copiá el texto del posteo. Es lo que se va a leer en la nota, y lo único que queda si mañana lo borran."
      />

      {datos && (
        <p className="flex items-center gap-2 text-[0.85rem] text-text-muted">
          <LogoDeRed clave={datos.red} size={14} />
          Reconocido como un posteo de {NOMBRE_DE_RED[datos.red]}.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={!listo}
          onClick={() => {
            if (!datos) return
            // Se guarda la URL canónica que armó `datosDePosteo()` y no la que
            // se pegó: así el documento no tiene parámetros de seguimiento ni
            // dominios de celular, y es la misma que el renderer va a rearmar.
            onInsertar({ url: datos.url, usuario: handle.trim(), texto: texto.trim() })
          }}
          className="tactil bg-accent px-4 font-display text-[0.9rem] font-bold text-accent-contrast disabled:opacity-50"
        >
          Insertar
        </button>

        <button
          type="button"
          onClick={onCerrar}
          className="tactil px-4 font-display text-[0.9rem] font-bold underline underline-offset-4"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
