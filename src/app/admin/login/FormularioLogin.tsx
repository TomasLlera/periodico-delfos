'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Mail } from 'lucide-react'
import { enviarMagicLink } from '@/actions/sesion'
import { mensajeDelError } from '@/lib/api/errores'

/**
 * Las dos formas de entrar, en un solo formulario.
 *
 * El mail se escribe una vez y los dos botones lo comparten: el que se apreta
 * viaja en el `submitter` del evento y el manejador decide con eso. Tener dos
 * formularios separados obligaría a escribir el mail dos veces, que desde el
 * celular es exactamente la fricción que el magic link viene a evitar.
 *
 * **Entrar con contraseña va por `POST /api/auth/login` y no por un Server
 * Action, y ése es el cambio que importa.** Un Server Action responde 200
 * tanto si entrás como si no, y pone el error adentro del cuerpo: en la pestaña
 * Network, en Postman o en un test, un login fallido y uno exitoso eran
 * indistinguibles. Ahora el código lo da el servidor —400 si el pedido viene
 * mal armado, 401 si las credenciales no sirven, 429 si probaste demasiado
 * seguido, 503 si Auth no contesta— y se puede afirmar sobre él.
 *
 * **Lo que se paga por eso:** el envío pasa a depender de JavaScript. Antes el
 * `<form action={...}>` de React funcionaba sin JS; ahora no. Es aceptable acá
 * y no lo sería en el buscador del sitio: el panel ya es una aplicación de
 * cliente de punta a punta —el editor es TipTap— y sin JS no hay nada que
 * hacer una vez adentro.
 *
 * **El magic link sigue yendo por el Server Action.** No es un caso de
 * credenciales: manda un mail y contesta "te lo mandamos". No tiene un código
 * de estado interesante que mostrar, y moverlo sólo agregaría una ruta más.
 *
 * El mail conserva `required`, así que el navegador sigue frenando el envío
 * antes de que viaje nada. Para ver un 400 del servidor alcanza con poner el
 * mail y dejar la contraseña vacía.
 */

export function FormularioLogin({ volver }: { volver: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState(false)

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const datos = new FormData(evento.currentTarget)
    const apretado = (evento.nativeEvent as SubmitEvent).submitter
    const accion = apretado instanceof HTMLButtonElement ? apretado.value : 'contrasena'

    setError(null)
    setAviso(null)
    setPendiente(true)

    try {
      if (accion === 'link') {
        const resultado = await enviarMagicLink({}, datos)

        if (resultado.error) setError(resultado.error)
        if (resultado.aviso) setAviso(resultado.aviso)
        return
      }

      const respuesta = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: String(datos.get('email') ?? ''),
          password: String(datos.get('password') ?? ''),
        }),
      })

      if (respuesta.ok) {
        // `refresh()` además del salto: el layout del panel se dibuja en el
        // servidor y tiene que volver a leerse ya con la cookie de sesión
        // puesta, o la primera pantalla llega sin autor y rebota al login.
        router.replace(volver)
        router.refresh()
        return
      }

      setError(
        mensajeDelError(
          await respuesta.json().catch(() => null),
          'No pudimos entrar. Probá de nuevo.',
        ),
      )
    } catch {
      // Si se corta la red no hay código de estado: el fetch tira. Decirlo con
      // sus palabras evita que parezca que las credenciales estaban mal.
      setError('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.')
    } finally {
      setPendiente(false)
    }
  }

  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-4">
      <input type="hidden" name="volver" value={volver} />

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="meta text-text-muted">
          Mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="tactil border border-border-control bg-bg-elevated px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-accent-text"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="meta text-text-muted">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="tactil border border-border-control bg-bg-elevated px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-accent-text"
        />
        <p className="text-[0.8rem] text-text-muted">
          Si preferís no escribirla, dejala vacía y pedí el link por mail.
        </p>
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-danger bg-bg-muted px-3 py-2 text-[0.9rem]">
          {error}
        </p>
      )}

      {aviso && (
        <p role="status" className="border-l-2 border-accent-text bg-bg-muted px-3 py-2 text-[0.9rem]">
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          name="accion"
          value="contrasena"
          disabled={pendiente}
          className="tactil flex flex-1 items-center justify-center gap-2 bg-text px-5 font-display text-[0.9rem] font-extrabold text-bg hover:bg-text/85 disabled:opacity-60"
        >
          <KeyRound size={16} aria-hidden="true" />
          Entrar
        </button>

        <button
          type="submit"
          name="accion"
          value="link"
          disabled={pendiente}
          className="tactil flex flex-1 items-center justify-center gap-2 border border-border-control px-5 font-display text-[0.9rem] font-bold hover:bg-bg-muted disabled:opacity-60"
        >
          <Mail size={16} aria-hidden="true" />
          Mandame un link
        </button>
      </div>
    </form>
  )
}
