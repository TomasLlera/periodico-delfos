import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BorrarNotaPorApi } from '@/components/admin/BorrarNotaPorApi'
import { FormularioNota } from '@/components/admin/FormularioNota'
import { firmaDe } from '@/lib/nota'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { getNotaPorId, getNotasParaEnlazar } from '@/lib/supabase/queries/notas'
import { getPartidosParaEditor } from '@/lib/supabase/queries/partidos'
import { getTemporadas } from '@/lib/supabase/queries/temporadas'
import type { NotaConRelaciones } from '@/types'

/**
 * Editar una nota que ya existe, publicada o no.
 *
 * La identidad acá es el id y no el slug: el slug es la URL pública y no se
 * recalcula al renombrar (regla no negociable 8), así que no sirve como
 * identificador estable dentro del panel.
 *
 * `notFound()` cubre dos casos que desde afuera son el mismo: que la nota no
 * exista, y que exista pero RLS no la deje ver. Distinguirlos le confirmaría a
 * un extraño qué ids hay en la base.
 *
 * **Borrar vive acá y no en el listado**, como en el resto del panel —equipos,
 * temporadas, partidos, sponsors—: el botón que destruye algo está en la
 * pantalla de esa cosa, nunca a un toque de distancia en una lista donde el
 * dedo puede errarle a la fila.
 */
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const nota = await getNotaPorId((await params).id)
  return { title: nota ? nota.titulo : 'Nota' }
}

export default async function EditarNota({ params }: Params) {
  const { id } = await params
  const [nota, temporadas, partidos, enlazables, yo] = await Promise.all([
    getNotaPorId(id),
    getTemporadas(),
    getPartidosParaEditor(),
    getNotasParaEnlazar(),
    getAutorDeLaSesion(),
  ])

  if (!nota) notFound()

  // La nota de otro, abierta por un redactor. RLS la deja **leer** si está
  // publicada —publicado es público— pero no la deja guardar, así que sin esto
  // el editor se abre entero y el error aparece recién al apretar Guardar.
  // `notFound()` por lo mismo que arriba: es el estado que no confirma nada.
  if (yo && yo.rol !== 'editor' && nota.autor_id !== firmaDe(yo)) notFound()

  return (
    <main className="mx-auto max-w-[900px] px-4 py-8">
      <h1 className="titular mb-6 text-[1.6rem]">Editar nota</h1>
      {/*
        El autor de la nota, no el de la sesión: editar no reasigna la firma
        (ver `src/actions/notas.ts`), así que la vista previa tiene que seguir
        mostrando a quien la escribió aunque la esté corrigiendo otro.
      */}
      <FormularioNota nota={nota} temporadas={temporadas} partidos={partidos} enlazables={enlazables} autor={nota.autor} />

      <div className="mt-8 border-t border-border pt-4">
        {/*
          Borrar va por `DELETE /api/notas/<id>`, que devuelve 200 si borró y
          404 si esa nota no existe o no es tuya. Antes era un Server Action:
          200 en los dos casos, con el aviso adentro del cuerpo.
        */}
        <BorrarNotaPorApi
          id={id}
          que={`«${nota.titulo}»`}
          consecuencia={consecuenciaDeBorrar(nota)}
        />
      </div>
    </main>
  )
}

/**
 * Qué se lleva puesto el borrado, en palabras y según el estado.
 *
 * **No es el mismo riesgo en los dos casos y no se puede decir igual.** Borrar
 * la nota de prueba de ayer —un borrador que nunca salió— no rompe nada, y un
 * aviso dramático ahí entrena a ignorar el aviso. Borrar una nota publicada sí
 * rompe algo: su URL, que puede estar linkeada desde Facebook, indexada en
 * Google o redirigida desde WordPress (regla no negociable 8). Eso hay que
 * decirlo con el slug a la vista, porque es la dirección que va a dar 404.
 */
function consecuenciaDeBorrar(nota: NotaConRelaciones): string {
  if (nota.estado === 'publicada') {
    return `Está publicada: /nota/${nota.slug} va a dar 404 para cualquiera que tenga el link, y Google ya la puede tener indexada. No hay vuelta atrás.`
  }

  if (nota.estado === 'programada') {
    return 'Todavía no salió, así que no se rompe ninguna URL. Lo que se cancela es la publicación que tenía agendada.'
  }

  // Borrador y archivada: ninguna de las dos está hoy en el sitio, porque las
  // rutas públicas filtran por `estado = 'publicada'`.
  return 'No está en el sitio, así que no se rompe ninguna URL. No hay vuelta atrás.'
}
