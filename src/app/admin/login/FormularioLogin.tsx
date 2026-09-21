'use client'

import { useActionState } from 'react'
import { KeyRound, Mail } from 'lucide-react'
import { entrar, type EstadoSesion } from '@/actions/sesion'

/**
 * Las dos formas de entrar, en un solo formulario.
 *
 * El mail se escribe una vez y los dos botones lo comparten: el que se apreta
 * viaja en el `FormData` y la acción decide con eso. Tener dos formularios
 * separados obligaría a escribir el mail dos veces, que desde el celular es
 * exactamente la fricción que el magic link viene a evitar.
 *
 * `useActionState` deja el resultado del intento —error o aviso— sin montar
 * estado propio ni un `useEffect`, y `pendiente` apaga los botones mientras
 * tanto para que no se manden dos links por doble toque.
 */

const ESTADO_INICIAL: EstadoSesion = {}

export function FormularioLogin({ volver }: { volver: string }) {
  const [estado, accion, pendiente] = useActionState(entrar, ESTADO_INICIAL)

  return (
    <form action={accion} className="flex flex-col gap-4">
      <input type="hidden" name="volver" value={volver} />

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="meta text-gris">
          Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="tactil border border-linea-fuerte bg-tarjeta px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-verde-600"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="meta text-gris">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="tactil border border-linea-fuerte bg-tarjeta px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-verde-600"
        />
        <p className="text-[0.8rem] text-gris">
          Si preferís no escribirla, dejala vacía y pedí el link por mail.
        </p>
      </div>

      {estado.error && (
        <p role="alert" className="border-l-2 border-roja bg-papel-alt px-3 py-2 text-[0.9rem]">
          {estado.error}
        </p>
      )}

      {estado.aviso && (
        <p role="status" className="border-l-2 border-verde-600 bg-papel-alt px-3 py-2 text-[0.9rem]">
          {estado.aviso}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          name="accion"
          value="contrasena"
          disabled={pendiente}
          className="tactil flex flex-1 items-center justify-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
        >
          <KeyRound size={16} aria-hidden="true" />
          Entrar
        </button>

        <button
          type="submit"
          name="accion"
          value="link"
          disabled={pendiente}
          className="tactil flex flex-1 items-center justify-center gap-2 border border-linea-fuerte px-5 font-display text-[0.9rem] font-bold hover:bg-papel-alt disabled:opacity-60"
        >
          <Mail size={16} aria-hidden="true" />
          Mandame un link
        </button>
      </div>
    </form>
  )
}
