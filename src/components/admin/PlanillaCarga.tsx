'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { agregarEvento, borrarEvento, finalizarPartido } from '@/actions/eventos'
import { GrillaJugadoras } from '@/components/admin/GrillaJugadoras'
import { ListaEventos } from '@/components/admin/ListaEventos'
import { SelectorMinuto } from '@/components/admin/SelectorMinuto'
import { BotonesTipoEvento } from '@/components/admin/BotonesTipoEvento'
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
 * **Se guarda al tocar la jugadora, sin botón de confirmar.** Un "Guardar" al
 * final de cada evento es un toque más por evento, o sea treinta toques por
 * partido, y es lo que separa los tres minutos de los seis. Si algo sale mal,
 * borrarlo de la lista es un toque.
 *
 * El minuto arranca en el del último evento cargado —ver `minutoSugerido()`—
 * porque entre dos eventos pasan pocos minutos.
 *
 * **Lo que falta y el blueprint pide:** la cola offline en IndexedDB. Sin ella,
 * un evento cargado sin señal se pierde y la pantalla lo avisa. Es el siguiente
 * paso, y es el que hace que esto sirva de verdad en una cancha de ascenso.
 */

interface Props {
  partido: PartidoCompleto
}

/** Lo que el rival necesita: sólo un nombre escrito a mano. */
const SIN_JUGADORA = ''

export function PlanillaCarga({ partido }: Props) {
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

  const aldosivi = partido.equipo_local.es_aldosivi ? partido.equipo_local : partido.equipo_visitante
  const rival = partido.equipo_local.es_aldosivi ? partido.equipo_visitante : partido.equipo_local

  const cancha = enCancha(partido.formaciones, partido.eventos, aldosivi.id)
  const banco = enElBanco(partido.formaciones, partido.eventos, aldosivi.id)
  const marcador = chequearMarcador(partido, partido.eventos)

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
      const r = await agregarEvento({
        partido_id: partido.id,
        tipo,
        minuto,
        adicionado,
        equipo_id: esRival ? rival.id : aldosivi.id,
        jugadora_id: esRival ? null : jugadoraId,
        jugadora_nombre: esRival ? nombreRival.trim() || 'Sin identificar' : null,
        jugadora_sale_id: tipo === 'cambio' ? sale : null,
      })

      if (r.error) {
        setAviso(r.error)
        return
      }

      setAviso(null)
      limpiar()
      router.refresh()
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

  function alBorrar(id: string) {
    setBorrando(id)
    empezar(async () => {
      const r = await borrarEvento(id, partido.id)
      setBorrando(null)
      if (r.error) setAviso(r.error)
      else router.refresh()
    })
  }

  function alFinalizar() {
    empezar(async () => {
      const r = await finalizarPartido(partido.id, marcador.cargado)
      if (r.error) setAviso(r.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="meta mb-2 text-gris">Cargado hasta ahora</h2>
        <ListaEventos
          eventos={partido.eventos}
          equipoLocalId={partido.equipo_local_id}
          nombreLocal={partido.equipo_local.nombre_corto ?? partido.equipo_local.nombre}
          nombreVisitante={partido.equipo_visitante.nombre_corto ?? partido.equipo_visitante.nombre}
          onBorrar={alBorrar}
          borrando={borrando}
        />
      </section>

      {aviso && (
        <p role="alert" className="border-l-2 border-roja bg-papel-alt px-3 py-2 text-[0.9rem]">
          {aviso}
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
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <label htmlFor="rival" className="meta text-gris">
                    Quién, del rival
                  </label>
                  <input
                    id="rival"
                    type="text"
                    value={nombreRival}
                    onChange={(e) => setNombreRival(e.target.value)}
                    placeholder="Apellido"
                    className="tactil border border-linea-fuerte bg-tarjeta px-3 font-display text-[0.95rem]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => guardar(null)}
                  disabled={guardando}
                  className="tactil bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white disabled:opacity-60"
                >
                  Cargar
                </button>
              </div>
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

      <section className="flex flex-wrap items-center gap-3 border-t border-linea pt-4">
        <p className="font-display text-[0.95rem]">
          Van <strong className="font-mono">{marcador.cargado.local}</strong> –{' '}
          <strong className="font-mono">{marcador.cargado.visitante}</strong>
          {marcador.declarado && !marcador.coincide && (
            <span className="ml-2 text-roja">
              (cargaste {marcador.declarado.local}–{marcador.declarado.visitante} al crear el
              partido: falta cargar algún gol)
            </span>
          )}
        </p>

        <button
          type="button"
          onClick={alFinalizar}
          disabled={guardando}
          className="tactil ml-auto bg-amarillo px-5 font-display text-[0.9rem] font-extrabold text-negro-cancha disabled:opacity-60"
        >
          Finalizar partido
        </button>
      </section>
    </div>
  )
}

function BotonLado({
  activo,
  onClick,
  children,
}: {
  activo: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`tactil flex-1 px-3 font-display text-[0.9rem] font-bold ${
        activo ? 'bg-verde-900 text-white' : 'border border-linea-fuerte hover:bg-papel-alt'
      }`}
    >
      {children}
    </button>
  )
}
