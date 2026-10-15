'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { borrarBorrador, guardarBorrador, leerBorrador, leerBorradores } from '@/lib/borrador-idb'
import {
  hayAlgoSinGuardar,
  hayQueOfrecer,
  ultimoDeNotaNueva,
  type Borrador,
  type Pendiente,
} from '@/lib/borrador'
import type { EntradaNota } from '@/lib/nota'

/**
 * El borrador local del editor, como estado de React.
 *
 * Tres cosas, y en este orden de importancia:
 *
 * 1. **Mientras se escribe, todo va al dispositivo** cada un segundo de pausa,
 *    y otra vez justo antes de mandar al servidor. Si la señal se corta en el
 *    envío, lo escrito ya estaba a salvo antes de intentar nada.
 * 2. **Al abrir el editor, ofrece lo que haya quedado** sin confirmar: una
 *    pestaña cerrada sin señal, un teléfono que se quedó sin batería.
 * 3. **Al volver la conexión, avisa** con lo que quedó a medias. Qué se hace
 *    con eso lo decide el formulario: guardar se reintenta solo, publicar
 *    pregunta.
 *
 * Mientras hay una oferta sin contestar no se guarda nada: el borrador nuevo
 * pisaría al que se está ofreciendo, que puede ser el de una tarde entera.
 */

const PAUSA_MS = 1000

interface Opciones {
  /** El de la nota, o el que se le reservó a la nueva al abrir el editor. */
  idInicial: string
  nueva: boolean
  entrada: EntradaNota
  archivo: File | null
  /** Lo que tiene la base, para no guardar ni ofrecer lo que ya está ahí. */
  guardada: EntradaNota
  /** Al recuperar: el formulario carga el borrador en sus campos. */
  alRecuperar: (borrador: Borrador) => void
  /** Al volver la señal con algo pendiente. */
  alVolverLaRed: (pendiente: Pendiente) => void
}

export function usarBorrador({
  idInicial,
  nueva,
  entrada,
  archivo,
  guardada,
  alRecuperar,
  alVolverLaRed,
}: Opciones) {
  const [id, setId] = useState(idInicial)
  const [oferta, setOferta] = useState<Borrador | null>(null)
  const [pendiente, setPendiente] = useState<Pendiente | null>(null)
  const [hayConexion, setHayConexion] = useState(true)

  // La última versión de lo que hay que guardar, para leerla desde el
  // temporizador y desde `respaldar()` sin rearmar los efectos en cada tecla.
  const actual = useRef({ id, nueva, entrada, archivo, guardada })
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendienteActual = useRef(pendiente)
  const alVolver = useRef(alVolverLaRed)

  useEffect(() => {
    actual.current = { id, nueva, entrada, archivo, guardada }
    pendienteActual.current = pendiente
    alVolver.current = alVolverLaRed
  })

  /** Escribe el borrador ya. `true` si quedó en el dispositivo. */
  const respaldar = useCallback(async (): Promise<boolean> => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null

    const a = actual.current
    if (!hayAlgoSinGuardar(a.entrada, a.guardada, a.archivo)) return true

    return guardarBorrador({
      id: a.id,
      nueva: a.nueva,
      entrada: a.entrada,
      archivo: a.archivo,
      guardado: new Date().toISOString(),
    })
  }, [])

  /** El servidor confirmó: el borrador ya no hace falta. */
  const olvidar = useCallback(async () => {
    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = null
    setPendiente(null)
    await borrarBorrador(actual.current.id)
  }, [])

  // Al abrir: ¿quedó algo?
  useEffect(() => {
    let vigente = true

    void (async () => {
      const encontrado = nueva
        ? ultimoDeNotaNueva(await leerBorradores())
        : await leerBorrador(idInicial)

      if (!vigente || !encontrado) return

      // Si es idéntico a lo guardado, fue un guardado que salió bien y cuya
      // respuesta se perdió: se limpia sin preguntar.
      if (hayQueOfrecer(encontrado, actual.current.guardada)) setOferta(encontrado)
      else await borrarBorrador(encontrado.id)
    })()

    return () => {
      vigente = false
    }
  }, [idInicial, nueva])

  // Mientras se escribe.
  useEffect(() => {
    if (oferta) return
    if (!hayAlgoSinGuardar(entrada, guardada, archivo)) return

    if (temporizador.current) clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => void respaldar(), PAUSA_MS)

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current)
    }
  }, [entrada, archivo, guardada, oferta, respaldar])

  // La señal.
  useEffect(() => {
    // `navigator.onLine` sólo existe en el navegador, y este efecto corre
    // después de hidratar: leerlo en el render daría distinto en el servidor.
    setHayConexion(navigator.onLine)

    const volvio = () => {
      setHayConexion(true)
      if (pendienteActual.current) alVolver.current(pendienteActual.current)
    }
    const seCorto = () => setHayConexion(false)

    window.addEventListener('online', volvio)
    window.addEventListener('offline', seCorto)
    return () => {
      window.removeEventListener('online', volvio)
      window.removeEventListener('offline', seCorto)
    }
  }, [])

  function recuperar() {
    if (!oferta) return
    // El de una nota nueva trae su propio id, que es con el que quizás ya se
    // creó del lado del servidor: adoptarlo es lo que evita duplicarla.
    setId(oferta.id)
    alRecuperar(oferta)
    setOferta(null)
  }

  async function descartar() {
    if (!oferta) return
    await borrarBorrador(oferta.id)
    setOferta(null)
  }

  return {
    id,
    oferta,
    pendiente,
    hayConexion,
    setPendiente,
    respaldar,
    olvidar,
    recuperar,
    descartar,
  }
}
