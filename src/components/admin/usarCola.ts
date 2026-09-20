'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { agregarEvento, type EventoNuevo } from '@/actions/eventos'
import { borrarPendiente, guardarPendiente, leerPendientes } from '@/lib/cola-idb'
import { enOrdenDeCarga, pendienteNuevo, type EventoPendiente } from '@/lib/cola'

/**
 * La cola offline de la planilla, como estado de React.
 *
 * Lo que hace, en una línea: **el evento se guarda primero en el teléfono y
 * después se intenta subir**. Nunca al revés. Así, el corte de señal más
 * desprolijo —el que deja el request colgado y termina en timeout— no puede
 * perder un gol, porque el gol ya estaba escrito antes de intentar nada.
 *
 * Se reintenta en tres momentos, que cubren lo que pasa de verdad en una
 * cancha: al montar la pantalla —por si quedó algo de la fecha pasada—, cuando
 * el navegador avisa que volvió la conexión, y después de cada evento nuevo.
 * No hay temporizador: un `setInterval` reintentando cada cinco segundos con
 * el celular sin señal es batería, y la batería es lo que tiene que durar los
 * noventa minutos.
 */

interface Cola {
  /** Los de este partido, para dibujarlos como si ya estuvieran cargados. */
  pendientes: EventoPendiente[]
  hayConexion: boolean
  /**
   * Lo último que **contestó** el servidor cuando contestó que no.
   *
   * Es distinto de que no haya señal, y hay que distinguirlos: sin señal el
   * evento espera y sube solo, pero "falta decir quién" o "se cerró la sesión"
   * son respuestas, y reintentarlas mil veces no las arregla. Sin esto, la
   * cola se tragaba en silencio todos los errores de validación que la
   * pantalla mostraba antes.
   *
   * El evento igual **queda en la cola**: que el servidor lo haya rechazado no
   * es razón para perderlo. Lo que cambia es que ahora se ve por qué.
   */
  ultimoError: string | null
  /** Encola el evento y arranca la subida. Nunca falla ni tira. */
  encolar: (evento: EventoNuevo) => Promise<void>
  /** Reintenta todo lo que haya. La llaman el botón y los tres momentos. */
  subir: () => Promise<void>
  /**
   * Saca un evento de la cola sin subirlo.
   *
   * Es el "borrar" de un evento que todavía no llegó al servidor: pedirle a la
   * base que borre una fila que no existe daría un error raro, y con el partido
   * en juego borrar un gol mal cargado tiene que funcionar igual sin señal.
   */
  descartar: (id: string) => Promise<void>
}

export function usarCola(partidoId: string, alSubirAlgo: () => void): Cola {
  const [pendientes, setPendientes] = useState<EventoPendiente[]>([])
  const [hayConexion, setHayConexion] = useState(true)
  const [ultimoError, setUltimoError] = useState<string | null>(null)

  // Un candado: dos subidas a la vez mandarían el mismo evento dos veces. No
  // sería grave —el id lo vuelve idempotente— pero es tráfico al pedo justo
  // cuando la señal es mala.
  const subiendo = useRef(false)

  const refrescar = useCallback(async () => {
    const todos = await leerPendientes()
    setPendientes(todos.filter((p) => p.evento.partido_id === partidoId))
  }, [partidoId])

  const subir = useCallback(async () => {
    if (subiendo.current) return
    subiendo.current = true

    try {
      // Se leen todos, no sólo los de este partido: si quedó algo de la fecha
      // pasada sin subir, este es el momento de que suba.
      const cola = enOrdenDeCarga(await leerPendientes())
      let subioAlguno = false

      for (const pendiente of cola) {
        try {
          const r = await agregarEvento(pendiente.evento)

          // `yaEstaba` es un reintento que encontró el evento guardado: salió
          // bien, sólo que la vez anterior se perdió la respuesta.
          // Contestó que no: la red anduvo y el problema es el evento. Se
          // cuenta el intento y se muestra el motivo, en vez de reintentarlo
          // para siempre sin que nadie se entere.
          if (r.error) {
            setUltimoError(r.error)
            await guardarPendiente({ ...pendiente, intentos: pendiente.intentos + 1 })
            continue
          }

          await borrarPendiente(pendiente.id)
          setUltimoError(null)
          subioAlguno = true
        } catch {
          // El action tira cuando no hay red. Se cuenta el intento y se corta:
          // si este falló por falta de señal, los que siguen van a fallar
          // igual, y cada uno cuesta un timeout.
          await guardarPendiente({ ...pendiente, intentos: pendiente.intentos + 1 })
          break
        }
      }

      await refrescar()
      if (subioAlguno) alSubirAlgo()
    } finally {
      subiendo.current = false
    }
  }, [refrescar, alSubirAlgo])

  const encolar = useCallback(
    async (evento: EventoNuevo) => {
      // Primero al teléfono. Recién después se intenta el servidor.
      setUltimoError(null)
      await guardarPendiente(pendienteNuevo(evento, new Date()))
      await refrescar()
      await subir()
    },
    [refrescar, subir],
  )

  useEffect(() => {
    // `navigator.onLine` sólo se puede leer en el navegador, y este efecto
    // corre después de hidratar: leerlo durante el render daría distinto en el
    // servidor.
    setHayConexion(navigator.onLine)

    const alVolver = () => {
      setHayConexion(true)
      void subir()
    }
    const alCortarse = () => setHayConexion(false)

    window.addEventListener('online', alVolver)
    window.addEventListener('offline', alCortarse)

    // Al montar: lo que haya quedado de la sesión anterior.
    void subir()

    return () => {
      window.removeEventListener('online', alVolver)
      window.removeEventListener('offline', alCortarse)
    }
  }, [subir])

  const descartar = useCallback(
    async (id: string) => {
      await borrarPendiente(id)
      await refrescar()
    },
    [refrescar],
  )

  return { pendientes, hayConexion, ultimoError, encolar, subir, descartar }
}
