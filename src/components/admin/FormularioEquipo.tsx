'use client'

import { guardarEquipo } from '@/actions/equipos'
import { avisoDeAldosivi, entradaDesdeEquipo, esquemaEquipo, slugDeEquipo } from '@/lib/entidades/equipo'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { Casilla } from '@/components/admin/Casilla'
import { usarFormulario } from '@/components/admin/usarFormulario'
import type { Equipo } from '@/types'

/**
 * El alta y la edición de un equipo: el propio y los diez rivales.
 *
 * Es el formulario más chico de los cuatro y el que más lejos llega: el
 * `nombre_corto` y el escudo que se cargan acá aparecen en la planilla, en el
 * fixture, en la barra de la portada y en el copy que sale a las redes.
 *
 * **El slug se calcula del nombre corto mientras el equipo no existe.** Después
 * queda quieto, como el de las notas y por lo mismo: es la URL que ya está en
 * la calle en `/partido/fecha-4-aldosivi-claypole-2026`, y cambiarla rompe el
 * link compartido. El campo sigue siendo editable a mano, que es la única
 * forma prevista de tocarlo.
 */

interface Props {
  equipo: Equipo | null
  /** El que tiene la marca hoy. Para avisar a quién se la saca. */
  aldosiviDeHoy: Pick<Equipo, 'id' | 'nombre_corto'> | null
}

export function FormularioEquipo({ equipo, aldosiviDeHoy }: Props) {
  const esNuevo = equipo === null

  const f = usarFormulario({
    inicial: entradaDesdeEquipo(equipo),
    esquema: esquemaEquipo,
    guardar: (datos) => guardarEquipo(datos, equipo?.id ?? null),
    volverA: '/admin/equipos',
  })

  const aviso = avisoDeAldosivi(f.entrada, aldosiviDeHoy, equipo?.id ?? null)

  function cambiarNombreCorto(nombre_corto: string) {
    f.cambiarVarios({
      nombre_corto,
      slug: esNuevo ? slugDeEquipo(nombre_corto) : f.entrada.slug,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <CampoTexto
        id="nombre"
        etiqueta="Nombre completo"
        valor={f.entrada.nombre}
        onCambio={(v) => f.cambiar('nombre', v)}
        error={f.errores.nombre}
        ayuda="Como está inscripto: «Club Social y Deportivo Claypole»."
      />

      <CampoTexto
        id="nombre_corto"
        etiqueta="Nombre corto"
        valor={f.entrada.nombre_corto}
        onCambio={cambiarNombreCorto}
        error={f.errores.nombre_corto}
        ayuda="El que se ve en todas partes: en el marcador, en el fixture y en la planilla."
      />

      <CampoTexto
        id="apodo"
        etiqueta="Apodo"
        valor={f.entrada.apodo ?? ''}
        onCambio={(v) => f.cambiar('apodo', v || null)}
        ayuda="Opcional. «Tiburonas», «El Tambero»."
      />

      <CampoTexto
        id="slug"
        etiqueta="Slug"
        valor={f.entrada.slug}
        onCambio={(v) => f.cambiar('slug', v)}
        error={f.errores.slug}
        ayuda={
          esNuevo
            ? 'Se arma solo con el nombre corto. Podés corregirlo antes de guardar.'
            : 'Entra en la URL de cada partido de este equipo: cambiarlo rompe los links.'
        }
      />

      <CampoTexto
        id="ciudad"
        etiqueta="Ciudad"
        valor={f.entrada.ciudad ?? ''}
        onCambio={(v) => f.cambiar('ciudad', v || null)}
        ayuda="Opcional."
      />

      {/* El escudo entra como URL y no como archivo, al revés que la foto de
          una jugadora. Son diez escudos que se cargan una vez y que casi
          siempre ya están publicados en algún lado; montar la subida al bucket
          para eso sería más pantalla de la que se usa. */}
      <CampoTexto
        id="escudo_url"
        etiqueta="URL del escudo"
        valor={f.entrada.escudo_url ?? ''}
        onCambio={(v) => f.cambiar('escudo_url', v || null)}
        ayuda="Opcional. Sin escudo se dibujan las iniciales, que es mejor que un hueco gris."
      />

      <Casilla
        id="es_aldosivi"
        etiqueta="Es el equipo propio"
        valor={f.entrada.es_aldosivi}
        onCambio={(v) => f.cambiar('es_aldosivi', v)}
        ayuda="Aldosivi. Es el que filtran las goleadoras, las estadísticas y la columna izquierda de la planilla. Hay uno solo."
      />

      {aviso && <Aviso tono="atencion">{aviso}</Aviso>}

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/equipos"
        etiqueta={esNuevo ? 'Crear el equipo' : 'Guardar'}
      />
    </div>
  )
}
