'use client'

import { guardarTemporada } from '@/actions/temporadas'
import {
  ANIO_MINIMO,
  avisoDeActiva,
  entradaDesdeTemporada,
  esquemaTemporada,
  nombreDeTemporada,
  slugDeTemporada,
} from '@/lib/entidades/temporada'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoNumero } from '@/components/admin/CampoNumero'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { Casilla } from '@/components/admin/Casilla'
import { usarFormulario } from '@/components/admin/usarFormulario'
import type { Temporada } from '@/types'

/**
 * El alta y la edición de una temporada.
 *
 * Es la primera fila que hay que cargar en una base vacía: el plantel, el
 * fixture, la tabla y las goleadoras cuelgan de ella.
 *
 * **El nombre y el slug se arman solos con la división y el año** mientras la
 * temporada no existe, porque "Primera B" + 2026 da las dos cosas y escribirlas
 * a mano sólo agrega la oportunidad de que no coincidan. Los dos campos quedan
 * editables: una temporada con un nombre propio —"Clausura 2026"— se escribe
 * encima.
 */

interface Props {
  temporada: Temporada | null
  /** La que está activa hoy. Para avisar cuál se apaga. */
  activaDeHoy: Pick<Temporada, 'id' | 'nombre'> | null
  /** El año en curso, calculado en el servidor para no depender del reloj del navegador. */
  anioDeHoy: number
}

export function FormularioTemporada({ temporada, activaDeHoy, anioDeHoy }: Props) {
  const esNueva = temporada === null

  const f = usarFormulario({
    // `new Date(anio, 0, 1)` y no `new Date()`: el valor inicial se calcula
    // también en el servidor, y ahí el reloj es UTC.
    inicial: entradaDesdeTemporada(temporada, new Date(anioDeHoy, 0, 1)),
    esquema: esquemaTemporada,
    guardar: (datos) => guardarTemporada(datos, temporada?.id ?? null),
    volverA: '/admin/temporadas',
  })

  const aviso = avisoDeActiva(f.entrada, activaDeHoy, temporada?.id ?? null)

  /** División y año mandan: de los dos salen el nombre y el slug. */
  function recalcular(division: string, anio: number | null) {
    const anioUsable = anio ?? f.entrada.anio

    f.cambiarVarios({
      division,
      anio: anio ?? f.entrada.anio,
      ...(esNueva
        ? {
            nombre: nombreDeTemporada(division, anioUsable),
            slug: slugDeTemporada(division, anioUsable),
          }
        : {}),
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <CampoTexto
          id="division"
          etiqueta="División"
          valor={f.entrada.division}
          onCambio={(v) => recalcular(v, f.entrada.anio)}
          error={f.errores.division}
          ayuda="«Primera B», «Primera C»."
        />

        <CampoNumero
          id="anio"
          etiqueta="Año"
          valor={f.entrada.anio}
          onCambio={(v) => recalcular(f.entrada.division, v)}
          min={ANIO_MINIMO}
          max={anioDeHoy + 1}
          error={f.errores.anio}
        />
      </div>

      <CampoTexto
        id="nombre"
        etiqueta="Nombre"
        valor={f.entrada.nombre}
        onCambio={(v) => f.cambiar('nombre', v)}
        error={f.errores.nombre}
        ayuda="Se arma con la división y el año. Escribilo encima si el campeonato tiene otro nombre."
      />

      <CampoTexto
        id="zona"
        etiqueta="Zona"
        valor={f.entrada.zona ?? ''}
        onCambio={(v) => f.cambiar('zona', v || null)}
        ayuda="Opcional. «Zona B»."
      />

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={f.entrada.slug}
        onCambio={(v) => f.cambiar('slug', v)}
        error={f.errores.slug}
        ayuda={
          esNueva
            ? 'Se arma solo. Es la URL de /temporada y de /plantel.'
            : 'Es la URL pública de la temporada y del plantel: cambiarla rompe los links.'
        }
      />

      <Casilla
        id="activa"
        etiqueta="Es la temporada en curso"
        valor={f.entrada.activa}
        onCambio={(v) => f.cambiar('activa', v)}
        ayuda="La portada, el próximo partido y la tabla miran esta temporada. Hay una sola."
      />

      {aviso && <Aviso tono="atencion">{aviso}</Aviso>}

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/temporadas"
        etiqueta={esNueva ? 'Crear la temporada' : 'Guardar'}
      />
    </div>
  )
}
