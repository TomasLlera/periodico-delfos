'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Plus, Save, X } from 'lucide-react'
import { guardarTabla } from '@/actions/tabla'
import {
  huecosDeLaFecha,
  jugadosQueCorresponden,
  puntosQueCorresponden,
  type EntradaFilaTabla,
} from '@/lib/entidades/tabla'
import { diferenciaGol, etiquetaDiferencia } from '@/lib/temporada'
import { Aviso } from '@/components/admin/Aviso'
import { CampoNumero } from '@/components/admin/CampoNumero'
import { CampoSelect } from '@/components/admin/CampoSelect'
import type { Equipo } from '@/types'

/**
 * La carga de una fecha de la tabla de posiciones.
 *
 * Es la única pantalla del proyecto donde se escribe un dato deportivo a mano,
 * y la excepción está razonada en el blueprint § 4.4: el medio cubre a
 * Aldosivi y no al campeonato entero, así que la tabla no se puede calcular
 * desde `partidos` sin cargar los partidos de los otros diez equipos.
 *
 * **Los puntos y los jugados no se escriben: se calculan.** Se cargan ganados,
 * empatados y perdidos, que es lo que dice la tabla publicada, y las dos sumas
 * salen solas. Es lo que hacen los CHECK `puntos_cuadran` y `partidos_cuadran`
 * de `0004`, y hacerlo acá evita el viaje de ida y vuelta al servidor para
 * enterarse de que una resta no cerraba.
 */

/** Una fila mientras se edita: la entrada de la base más el orden en pantalla. */
type FilaEditable = Omit<EntradaFilaTabla, 'puntos' | 'jugados'>

interface Props {
  temporadaId: string
  fechaNumero: number
  equipos: readonly Equipo[]
  /** Lo que ya está cargado de esta fecha, si hay algo. */
  filasGuardadas: readonly EntradaFilaTabla[]
}

export function EditorTabla({ temporadaId, fechaNumero, equipos, filasGuardadas }: Props) {
  const router = useRouter()
  const [filas, setFilas] = useState<FilaEditable[]>(() =>
    filasGuardadas.map((f) => ({
      temporada_id: f.temporada_id,
      fecha_numero: f.fecha_numero,
      equipo_id: f.equipo_id,
      posicion: f.posicion,
      ganados: f.ganados,
      empatados: f.empatados,
      perdidos: f.perdidos,
      goles_favor: f.goles_favor,
      goles_contra: f.goles_contra,
    })),
  )
  const [aviso, setAviso] = useState<string | null>(null)
  const [motivos, setMotivos] = useState<string[]>([])
  const [ocupado, empezar] = useTransition()

  const huecos = huecosDeLaFecha(filas, filas.length)

  function cambiar(indice: number, cambio: Partial<FilaEditable>) {
    setFilas((previas) => previas.map((f, i) => (i === indice ? { ...f, ...cambio } : f)))
  }

  function agregar() {
    setFilas((previas) => [
      ...previas,
      {
        temporada_id: temporadaId,
        fecha_numero: fechaNumero,
        equipo_id: '',
        posicion: previas.length + 1,
        ganados: 0,
        empatados: 0,
        perdidos: 0,
        goles_favor: 0,
        goles_contra: 0,
      },
    ])
  }

  function sacar(indice: number) {
    setFilas((previas) => previas.filter((_, i) => i !== indice))
  }

  function guardar() {
    empezar(async () => {
      // Los dos derivados se agregan recién al enviar: son los que el esquema
      // del servidor exige que cuadren.
      const completas: EntradaFilaTabla[] = filas.map((f) => ({
        ...f,
        fecha_numero: fechaNumero,
        puntos: puntosQueCorresponden(f),
        jugados: jugadosQueCorresponden(f),
      }))

      const r = await guardarTabla(temporadaId, fechaNumero, completas)

      if (r.error) {
        setAviso(r.error)
        setMotivos(r.motivos ?? [])
        return
      }

      setAviso('Tabla guardada')
      setMotivos([])
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {huecos.map((hueco) => (
        <Aviso key={hueco} tono="atencion">
          {hueco}
        </Aviso>
      ))}

      {filas.length === 0 && (
        <Aviso>
          Esta fecha todavía no tiene tabla. Se carga un equipo por fila, en el orden en que
          están publicados.
        </Aviso>
      )}

      <ul className="flex flex-col gap-4">
        {filas.map((fila, indice) => {
          const puntos = puntosQueCorresponden(fila)
          const jugados = jugadosQueCorresponden(fila)
          const diferencia = diferenciaGol(fila)

          return (
            <li key={indice} className="border border-linea bg-tarjeta p-3">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <div className="w-16">
                  <CampoNumero
                    id={`posicion-${indice}`}
                    etiqueta="Puesto"
                    valor={fila.posicion}
                    onCambio={(v) => cambiar(indice, { posicion: v ?? 1 })}
                    min={1}
                  />
                </div>

                <div className="min-w-[180px] flex-1">
                  <CampoSelect
                    id={`equipo-${indice}`}
                    etiqueta="Equipo"
                    valor={fila.equipo_id}
                    opciones={equipos.map((e) => ({ valor: e.id, nombre: e.nombre_corto }))}
                    onCambio={(v) => cambiar(indice, { equipo_id: v })}
                    vacio="Elegir"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => sacar(indice)}
                  className="tactil flex items-center gap-1 px-3 font-display text-[0.85rem] font-bold text-roja hover:underline"
                >
                  <X size={14} aria-hidden="true" />
                  Sacar
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                <CampoNumero
                  id={`ganados-${indice}`}
                  etiqueta="Ganados"
                  valor={fila.ganados}
                  onCambio={(v) => cambiar(indice, { ganados: v ?? 0 })}
                  min={0}
                />
                <CampoNumero
                  id={`empatados-${indice}`}
                  etiqueta="Empatados"
                  valor={fila.empatados}
                  onCambio={(v) => cambiar(indice, { empatados: v ?? 0 })}
                  min={0}
                />
                <CampoNumero
                  id={`perdidos-${indice}`}
                  etiqueta="Perdidos"
                  valor={fila.perdidos}
                  onCambio={(v) => cambiar(indice, { perdidos: v ?? 0 })}
                  min={0}
                />
                <CampoNumero
                  id={`gf-${indice}`}
                  etiqueta="Goles a favor"
                  valor={fila.goles_favor}
                  onCambio={(v) => cambiar(indice, { goles_favor: v ?? 0 })}
                  min={0}
                />
                <CampoNumero
                  id={`gc-${indice}`}
                  etiqueta="Goles en contra"
                  valor={fila.goles_contra}
                  onCambio={(v) => cambiar(indice, { goles_contra: v ?? 0 })}
                  min={0}
                />
              </div>

              {/* Lo que sale solo. Se muestra para poder cotejarlo contra la
                  tabla publicada: si los puntos no son los mismos, lo que está
                  mal es alguno de los tres resultados de arriba. */}
              <p className="meta mt-3 text-gris">
                {puntos} puntos · {jugados} jugados · {etiquetaDiferencia(diferencia)} de
                diferencia
              </p>
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={agregar}
        className="tactil flex items-center gap-2 self-start border border-linea-fuerte px-4 font-display text-[0.9rem] font-bold hover:bg-papel-alt"
      >
        <Plus size={16} aria-hidden="true" />
        Agregar un equipo
      </button>

      {aviso && (
        <div role="status" className="border-l-2 border-verde-600 bg-papel-alt px-3 py-2 text-[0.9rem]">
          <p>{aviso}</p>
          {motivos.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-roja">
              {motivos.map((motivo) => (
                <li key={motivo}>{motivo}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-linea bg-papel py-3">
        <button
          type="button"
          onClick={guardar}
          disabled={ocupado}
          className="tactil flex items-center gap-2 bg-verde-900 px-5 font-display text-[0.9rem] font-extrabold text-white hover:bg-verde-600 disabled:opacity-60"
        >
          <Save size={16} aria-hidden="true" />
          {ocupado ? 'Guardando…' : `Guardar la fecha ${fechaNumero}`}
        </button>

        {/* La fecha se reemplaza entera al guardar, así que conviene decirlo
            antes y no después: es una foto del campeonato, no un parche. */}
        <span className="text-[0.85rem] text-gris">
          Reemplaza lo que haya cargado en esta fecha.
        </span>
      </div>
    </div>
  )
}
