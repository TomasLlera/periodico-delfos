'use client'

import { guardarPartido } from '@/actions/partidos'
import {
  avisosDePartido,
  entradaDesdePartido,
  esquemaPartido,
  FECHA_MAXIMA,
  GOLES_MAXIMOS,
  slugDePartido,
  type EntradaPartido,
} from '@/lib/entidades/partido'
import { ETIQUETA_ESTADO } from '@/lib/partido'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoNumero } from '@/components/admin/CampoNumero'
import { CampoSelect } from '@/components/admin/CampoSelect'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { usarFormulario } from '@/components/admin/usarFormulario'
import type { EstadoPartido, Equipo, PartidoConEquipos, Temporada } from '@/types'

/**
 * La ficha de un partido: crear y editar con el mismo componente.
 *
 * **Lo que se carga acá es lo que se sabe antes de que empiece** —cuándo,
 * contra quién, en qué cancha, quién arbitra— más el resultado si ya terminó.
 * Los goles uno por uno, las tarjetas y los cambios son la planilla, que es
 * otra pantalla: es la regla no negociable 2 aplicada al panel.
 *
 * El marcador de acá es una **declaración**. La planilla lo compara con los
 * goles cargados y avisa si no coinciden, sin corregir ninguno de los dos:
 * cuál está bien lo sabe quien vio el partido, no el sistema.
 *
 * La fecha y la hora se escriben en hora de Mar del Plata, siempre. El huso
 * está fijo en `campos.ts` y no sale del reloj del navegador, porque el valor
 * inicial de este formulario se calcula también en el servidor.
 */

const ESTADOS: readonly EstadoPartido[] = [
  'programado',
  'en_curso',
  'finalizado',
  'suspendido',
  'postergado',
]

interface Props {
  partido: PartidoConEquipos | null
  temporadas: readonly Temporada[]
  equipos: readonly Equipo[]
  /** Ya convertida a hora de Mar del Plata por el servidor. */
  fechaHoraInicial: string
  temporadaActivaId: string | null
}

export function FormularioPartido({
  partido,
  temporadas,
  equipos,
  fechaHoraInicial,
  temporadaActivaId,
}: Props) {
  const esNuevo = partido === null

  const f = usarFormulario({
    inicial: entradaDesdePartido(partido, {
      temporadaId: temporadaActivaId,
      fechaHoraLocal: fechaHoraInicial,
    }),
    esquema: esquemaPartido,
    guardar: (datos) => guardarPartido(datos, partido?.id ?? null),
    volverA: '/admin/partidos',
  })

  const opcionesEquipo = equipos.map((e) => ({ valor: e.id, nombre: e.nombre_corto }))
  const avisos = avisosDePartido(f.entrada, equipos)

  /**
   * El slug se rearma con cada cambio que lo compone, y **sólo mientras el
   * partido no existe**: después es la URL de `/partido/[slug]`, que ya está
   * compartida y redirigida.
   */
  function conSlug(parcial: Partial<EntradaPartido>): Partial<EntradaPartido> {
    if (!esNuevo) return parcial

    const proxima = { ...f.entrada, ...parcial }
    const local = equipos.find((e) => e.id === proxima.equipo_local_id)
    const visitante = equipos.find((e) => e.id === proxima.equipo_visitante_id)
    const temporada = temporadas.find((t) => t.id === proxima.temporada_id)

    if (!local || !visitante || !temporada) return parcial

    return {
      ...parcial,
      slug: slugDePartido({
        fechaNumero: proxima.fecha_numero,
        localCorto: local.nombre_corto,
        visitanteCorto: visitante.nombre_corto,
        anio: temporada.anio,
        fechaHoraLocal: proxima.fecha_hora_local,
      }),
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <CampoSelect
        id="temporada_id"
        etiqueta="Temporada"
        valor={f.entrada.temporada_id}
        opciones={temporadas.map((t) => ({ valor: t.id, nombre: t.nombre }))}
        onCambio={(v) => f.cambiarVarios(conSlug({ temporada_id: v }))}
        vacio={temporadas.length === 0 ? 'No hay temporadas cargadas' : 'Elegir'}
        error={f.errores.temporada_id}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoNumero
          id="fecha_numero"
          etiqueta="Fecha del campeonato"
          valor={f.entrada.fecha_numero}
          onCambio={(v) => f.cambiarVarios(conSlug({ fecha_numero: v }))}
          min={1}
          max={FECHA_MAXIMA}
          error={f.errores.fecha_numero}
          ayuda="Vacío para un amistoso o una final."
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="fecha_hora_local" className="meta text-gris">
            Día y hora
          </label>
          <input
            id="fecha_hora_local"
            type="datetime-local"
            value={f.entrada.fecha_hora_local}
            onChange={(e) => f.cambiarVarios(conSlug({ fecha_hora_local: e.target.value }))}
            aria-invalid={f.errores.fecha_hora_local ? true : undefined}
            className={
              'tactil w-full border bg-tarjeta px-3 font-display text-[0.95rem] ' +
              (f.errores.fecha_hora_local ? 'border-roja' : 'border-linea-fuerte')
            }
          />
          {f.errores.fecha_hora_local ? (
            <p className="text-[0.85rem] text-roja">{f.errores.fecha_hora_local}</p>
          ) : (
            <p className="text-[0.8rem] text-gris">Hora de Mar del Plata.</p>
          )}
        </div>
      </div>

      {/* Local y visitante son la condición de verdad, no el orden en que se
          muestran: la planilla pone a Aldosivi siempre a la izquierda juegue
          donde juegue, y de acá saca si fue de local. */}
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoSelect
          id="equipo_local_id"
          etiqueta="Local"
          valor={f.entrada.equipo_local_id}
          opciones={opcionesEquipo}
          onCambio={(v) => f.cambiarVarios(conSlug({ equipo_local_id: v }))}
          vacio={equipos.length === 0 ? 'No hay equipos cargados' : 'Elegir'}
          error={f.errores.equipo_local_id}
        />

        <CampoSelect
          id="equipo_visitante_id"
          etiqueta="Visitante"
          valor={f.entrada.equipo_visitante_id}
          opciones={opcionesEquipo}
          onCambio={(v) => f.cambiarVarios(conSlug({ equipo_visitante_id: v }))}
          vacio={equipos.length === 0 ? 'No hay equipos cargados' : 'Elegir'}
          error={f.errores.equipo_visitante_id}
        />
      </div>

      <CampoSelect
        id="estado"
        etiqueta="Estado"
        valor={f.entrada.estado}
        opciones={ESTADOS.map((e) => ({ valor: e, nombre: ETIQUETA_ESTADO[e] }))}
        onCambio={(v) => f.cambiar('estado', v as EstadoPartido)}
        error={f.errores.estado}
        ayuda="Un partido finalizado necesita el resultado cargado."
      />

      <fieldset className="grid gap-5 border border-linea bg-tarjeta p-4 sm:grid-cols-2">
        <legend className="meta px-1 text-gris">Resultado</legend>

        <CampoNumero
          id="goles_local"
          etiqueta="Goles del local"
          valor={f.entrada.goles_local}
          onCambio={(v) => f.cambiar('goles_local', v)}
          min={0}
          max={GOLES_MAXIMOS}
          error={f.errores.goles_local}
        />

        <CampoNumero
          id="goles_visitante"
          etiqueta="Goles del visitante"
          valor={f.entrada.goles_visitante}
          onCambio={(v) => f.cambiar('goles_visitante', v)}
          min={0}
          max={GOLES_MAXIMOS}
          error={f.errores.goles_visitante}
        />

        <p className="text-[0.8rem] text-gris sm:col-span-2">
          Lo que se escribe acá es el resultado declarado. La planilla lo compara con los goles
          cargados uno por uno y avisa si no coinciden.
        </p>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="cancha"
          etiqueta="Cancha"
          valor={f.entrada.cancha ?? ''}
          onCambio={(v) => f.cambiar('cancha', v || null)}
          ayuda="Opcional."
        />

        <CampoTexto
          id="arbitra"
          etiqueta="Árbitra"
          valor={f.entrada.arbitra ?? ''}
          onCambio={(v) => f.cambiar('arbitra', v || null)}
          ayuda="Opcional."
        />
      </div>

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={f.entrada.slug}
        onCambio={(v) => f.cambiar('slug', v)}
        error={f.errores.slug}
        ayuda={
          esNuevo
            ? 'Se arma solo con la fecha, los equipos y el año.'
            : 'Es la URL pública del partido: cambiarla rompe los links compartidos.'
        }
      />

      <CampoTexto
        id="observaciones"
        etiqueta="Observaciones"
        valor={f.entrada.observaciones ?? ''}
        onCambio={(v) => f.cambiar('observaciones', v || null)}
        largo
        ayuda="Opcional. Para lo que no es un dato: «se suspendió por lluvia a los 20 minutos»."
      />

      {avisos.map((aviso) => (
        <Aviso key={aviso} tono="atencion">
          {aviso}
        </Aviso>
      ))}

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/partidos"
        etiqueta={esNuevo ? 'Crear el partido' : 'Guardar'}
      />
    </div>
  )
}
