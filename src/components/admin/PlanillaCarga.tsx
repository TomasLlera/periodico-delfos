'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState, useTransition } from 'react'
import { borrarEvento, finalizarPartido } from '@/actions/eventos'
import { GrillaJugadoras } from '@/components/admin/GrillaJugadoras'
import { ListaEventos } from '@/components/admin/ListaEventos'
import { SelectorMinuto } from '@/components/admin/SelectorMinuto'
import { BotonesTipoEvento } from '@/components/admin/BotonesTipoEvento'
import { BotonLado } from '@/components/admin/BotonLado'
import { CargaRival } from '@/components/admin/CargaRival'
import { BarraCola } from '@/components/admin/BarraCola'
import { PieMarcador } from '@/components/admin/PieMarcador'
import { VentanaRecordatorio } from '@/components/admin/VentanaRecordatorio'
import { usarCola } from '@/components/admin/usarCola'
import { estadoDeLaCola, eventosVisibles } from '@/lib/cola'
import { chequearMarcador, enCancha, enElBanco, minutoSugerido } from '@/lib/planilla'
import type { PartidoCompleto, TipoEvento } from '@/types'

/**
 * La planilla de carga. El Step marcado con estrella del Build Order.
 *
 * **Es el motivo por el que existe el proyecto.** Hoy las crónicas del sitio
 * viejo traen la ficha, la formación y las incidencias escritas a mano adentro
 * del texto, setenta veces. Esta pantalla es lo que hace que eso deje de pasar.
 *
 * Diseñada para el pulgar, en la tribuna, con una mano: el blueprint § 7.6 pone
 * como objetivo **cargar un partido completo en menos de tres minutos**. Todo
 * lo demás se subordina a eso.
 *
 * El flujo son dos o tres toques por evento:
 *
 *   Gol → jugadora                      (se guarda solo)
 *   Amarilla → jugadora                 (se guarda solo)
 *   Cambio → quién sale → quién entra    (se guarda solo)
 *
 * **Se guarda al tocar la jugadora, sin botón de confirmar.** Un "Guardar" por
 * evento son treinta toques por partido, y es lo que separa los tres minutos de
 * los seis. Si algo sale mal, borrarlo de la lista es un toque.
 *
 * El minuto arranca en el del último evento cargado —ver `minutoSugerido()`—
 * porque entre dos eventos pasan pocos minutos.
 *
 * **Nada se guarda contra el servidor primero.** Cada evento va a la cola de
 * IndexedDB —`usarCola`— y desde ahí sube. Es lo que pide el blueprint § 7.6 y
 * lo que hace que esto sirva en una cancha de ascenso: la tribuna del Minella
 * no tiene señal, y un gol cargado sin datos ya no se pierde, espera en el
 * teléfono y sube solo cuando vuelve.
 *
 * Por eso lo que se dibuja **no** es `partido.eventos` sino `eventosVisibles()`:
 * lo guardado más lo pendiente. Si el gol que se acaba de tocar no apareciera
 * en la lista, la reacción natural sería cargarlo otra vez, y la cola habría
 * empeorado el problema que vino a resolver. Las cuentas —el marcador, quién
 * está en cancha— usan la misma lista, así que una roja cargada sin señal saca
 * a la jugadora de la grilla igual que con señal.
 */

interface Props {
  partido: PartidoCompleto
  /**
   * La fecha que hay que cargar en la tabla de posiciones, o `null` si ya está
   * cargada o el partido no tiene número de fecha.
   *
   * Lo calcula la página, que es la que puede consultar la base. Se pasa como
   * número y no como booleano porque el atajo de la ventana va apuntado a esa
   * fecha.
   */
  fechaSinTabla: number | null
}

/** Lo que el rival necesita: sólo un nombre escrito a mano. */
const SIN_JUGADORA = ''

export function PlanillaCarga({ partido, fechaSinTabla }: Props) {
  const router = useRouter()
  const [guardando, empezar] = useTransition()

  const [tipo, setTipo] = useState<TipoEvento | null>(null)
  const [minuto, setMinuto] = useState(() => minutoSugerido(partido.eventos))
  const [adicionado, setAdicionado] = useState(0)
  const [esRival, setEsRival] = useState(false)
  const [nombreRival, setNombreRival] = useState(SIN_JUGADORA)
  const [sale, setSale] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [borrando, setBorrando] = useState<string | null>(null)
  const [recordarTabla, setRecordarTabla] = useState(false)

  // `useCallback` porque el hook la tiene en una dependencia: sin esto, cada
  // render rearmaría el efecto que escucha "volvió la conexión".
  const alSubirAlgo = useCallback(() => router.refresh(), [router])
  const cola = usarCola(partido.id, alSubirAlgo)

  const aldosivi = partido.equipo_local.es_aldosivi ? partido.equipo_local : partido.equipo_visitante
  const rival = partido.equipo_local.es_aldosivi ? partido.equipo_visitante : partido.equipo_local

  // Lo guardado más lo que espera en el teléfono. **Todo** lo que sigue mira
  // esta lista y no `partido.eventos`: la lista, el marcador y quién está en
  // cancha tienen que contar igual con señal y sin señal.
  const eventos = eventosVisibles(partido.eventos, cola.pendientes, partido.formaciones)
  const pendiente = new Set(cola.pendientes.map((p) => p.id))

  const cancha = enCancha(partido.formaciones, eventos, aldosivi.id)
  const banco = enElBanco(partido.formaciones, eventos, aldosivi.id)
  const marcador = chequearMarcador(partido, eventos)
  const estadoCola = estadoDeLaCola(cola.pendientes, cola.hayConexion)

  function limpiar() {
    setTipo(null)
    setSale(null)
    setEsRival(false)
    setNombreRival(SIN_JUGADORA)
    setAdicionado(0)
  }

  function guardar(jugadoraId: string | null) {
    if (!tipo) return

    empezar(async () => {
      // El id lo pone la pantalla y no la base: es lo que hace que reintentar
      // el mismo evento dos veces no cargue el gol dos veces.
      await cola.encolar({
        id: crypto.randomUUID(),
        partido_id: partido.id,
        tipo,
        minuto,
        adicionado,
        equipo_id: esRival ? rival.id : aldosivi.id,
        jugadora_id: esRival ? null : jugadoraId,
        jugadora_nombre: esRival ? nombreRival.trim() || 'Sin identificar' : null,
        jugadora_sale_id: tipo === 'cambio' ? sale : null,
      })

      // No hay caso de error: encolar escribe en el teléfono y después
      // intenta subir. Lo que no subió queda en la cola y la barra lo dice.
      setAviso(null)
      limpiar()
    })
  }

  /** En un cambio, el primer toque elige quién sale y el segundo quién entra. */
  function alElegirJugadora(id: string) {
    if (tipo === 'cambio' && !sale) {
      setSale(id)
      return
    }
    guardar(id)
  }

  /**
   * Borrar distingue los dos casos.
   *
   * Un evento que todavía está en la cola no existe en la base: pedirle que lo
   * borre daría un error raro. Se saca de la cola, que además es lo único que
   * se puede hacer sin señal, y borrar un gol mal cargado tiene que funcionar
   * igual con el partido en juego.
   */
  function alBorrar(id: string) {
    setBorrando(id)

    empezar(async () => {
      if (pendiente.has(id)) {
        await cola.descartar(id)
        setBorrando(null)
        return
      }

      const r = await borrarEvento(id, partido.id)
      setBorrando(null)
      if (r.error) setAviso(r.error)
      else router.refresh()
    })
  }

  function alFinalizar() {
    empezar(async () => {
      const r = await finalizarPartido(partido.id, marcador.cargado)
      if (r.error) {
        setAviso(r.error)
        return
      }

      // El resultado ya está escrito y todo lo demás se movió solo. Lo único
      // que queda a mano es la tabla, y es el paso que se olvida justamente
      // porque nada más lo pide.
      if (fechaSinTabla !== null) setRecordarTabla(true)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="meta mb-2 text-gris">Cargado hasta ahora</h2>
        <ListaEventos
          eventos={eventos}
          equipoLocalId={partido.equipo_local_id}
          nombreLocal={partido.equipo_local.nombre_corto ?? partido.equipo_local.nombre}
          nombreVisitante={partido.equipo_visitante.nombre_corto ?? partido.equipo_visitante.nombre}
          onBorrar={alBorrar}
          borrando={borrando}
        />
      </section>

      <BarraCola
        estado={estadoCola}
        hayConexion={cola.hayConexion}
        onReintentar={() => void cola.subir()}
      />

      {/* El error propio de la pantalla —borrar, finalizar— y el que contestó
          el servidor al intentar subir un evento de la cola. Se muestran en el
          mismo lugar porque para quien carga son la misma cosa: algo salió mal
          y dice qué. */}
      {(aviso ?? cola.ultimoError) && (
        <p role="alert" className="border-l-2 border-roja bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso ?? cola.ultimoError}
        </p>
      )}

      <section className="flex flex-col gap-4 border-t border-linea pt-4">
        <BotonesTipoEvento
          elegido={tipo}
          onElegir={(t) => {
            setTipo(t)
            setSale(null)
            setAviso(null)
          }}
        />

        {tipo && (
          <div className="flex flex-col gap-4">
            <SelectorMinuto
              minuto={minuto}
              adicionado={adicionado}
              onMinuto={setMinuto}
              onAdicionado={setAdicionado}
            />

            {/* El cambio es siempre nuestro: para el rival no tenemos plantel
                cargado, así que un cambio suyo no se puede representar. */}
            {tipo !== 'cambio' && (
              <div className="flex gap-2">
                <BotonLado activo={!esRival} onClick={() => setEsRival(false)}>
                  {aldosivi.nombre_corto ?? aldosivi.nombre}
                </BotonLado>
                <BotonLado activo={esRival} onClick={() => setEsRival(true)}>
                  {rival.nombre_corto ?? rival.nombre}
                </BotonLado>
              </div>
            )}

            {esRival ? (
              <CargaRival
                nombre={nombreRival}
                onNombre={setNombreRival}
                onCargar={() => guardar(null)}
                ocupado={guardando}
              />
            ) : (
              <div className="flex flex-col gap-2">
                <p className="meta text-gris">
                  {tipo === 'cambio' && !sale
                    ? 'Quién sale'
                    : tipo === 'cambio'
                      ? 'Quién entra'
                      : 'Quién'}
                </p>
                <GrillaJugadoras
                  jugadoras={tipo === 'cambio' && sale ? banco : cancha}
                  elegida={sale}
                  onElegir={alElegirJugadora}
                  vacio={
                    tipo === 'cambio' && sale
                      ? 'No hay nadie en el banco.'
                      : 'No hay formación cargada para este partido.'
                  }
                />
              </div>
            )}
          </div>
        )}
      </section>

      {recordarTabla && fechaSinTabla !== null && (
        <VentanaRecordatorio
          temporadaId={partido.temporada_id}
          fecha={fechaSinTabla}
          onCerrar={() => setRecordarTabla(false)}
        />
      )}

      <PieMarcador
        marcador={marcador}
        ocupado={guardando}
        onFinalizar={alFinalizar}
        pendientes={cola.pendientes.length}
      />

    </div>
  )
}
