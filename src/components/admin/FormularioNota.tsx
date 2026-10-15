'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { guardarNota, programarNota, publicarNota, type ResultadoNota } from '@/actions/notas'
import { avisoSinRed, type Pendiente } from '@/lib/borrador'
import { entradaDesdeNota, erroresPorCampo, slugDesdeTitulo, type EntradaNota } from '@/lib/nota'
import { esSobrePublicada, notaDePrevisualizacion } from '@/lib/vista-previa'
import { AvisoBorrador } from '@/components/admin/AvisoBorrador'
import { AvisoReconexion } from '@/components/admin/AvisoReconexion'
import { BarraAcciones } from '@/components/admin/BarraAcciones'
import { CampoImagen } from '@/components/admin/CampoImagen'
import type { NotaEnlazable } from '@/components/admin/EnlazarNota'
import { CamposClasificacion } from '@/components/admin/CamposClasificacion'
import { CamposEncabezado } from '@/components/admin/CamposEncabezado'
import { EditorCuerpo } from '@/components/admin/EditorCuerpo'
import { usarBorrador } from '@/components/admin/usarBorrador'
import { usarImagenElegida } from '@/components/admin/usarImagenElegida'
import { VistaPrevia } from '@/components/admin/VistaPrevia'
import type { Autor, NotaConRelaciones, PartidoConEquipos, Temporada } from '@/types'

/**
 * El formulario de nota, crear y editar con el mismo componente.
 *
 * Todo el estado vive acá y no en campos sueltos de un `<form>` porque el
 * cuerpo es un árbol de TipTap y porque la vista previa necesita el estado
 * completo sin haber guardado nada. Por eso los Server Actions reciben un
 * objeto y no un `FormData`.
 *
 * **El slug se calcula del título sólo mientras la nota no existe.** Una vez
 * guardada, renombrarla no le toca la URL: cambiarla rompe el link que se
 * compartió y la redirección 301 que apunta ahí (regla no negociable 8). El
 * campo queda editable a mano, que es la única forma prevista de cambiarlo.
 *
 * **Lo escrito va primero al dispositivo y después al servidor** (ver
 * `usarBorrador`). Un corte de señal al guardar no pierde nada: el formulario
 * queda como estaba, avisa, y lo reanuda cuando vuelve la conexión.
 */

type Publicacion = Exclude<Pendiente, { tipo: 'guardar' }>

interface Props {
  /** La nota guardada, si se está editando. `null` al crear. */
  nota: NotaConRelaciones | null
  /**
   * El id de la nota. Al editar, el de la base; al crear, uno reservado por la
   * página al abrir el editor. Que la nota nueva ya tenga id es lo que vuelve
   * idempotente el primer guardado: ver `escribirNota()`.
   */
  id: string
  temporadas: readonly Temporada[]
  partidos: readonly PartidoConEquipos[]
  /** Las publicadas, para el botón de anclar del editor. */
  enlazables: readonly NotaEnlazable[]
  /** El de la sesión. La vista previa lo necesita para firmar la nota. */
  autor: Autor
}

export function FormularioNota({ nota, id, temporadas, partidos, enlazables, autor }: Props) {
  const router = useRouter()
  const guardada = useMemo(() => entradaDesdeNota(nota), [nota])
  const [entrada, setEntrada] = useState<EntradaNota>(guardada)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  const [guardando, empezar] = useTransition()
  const [previa, setPrevia] = useState(false)
  // TipTap lee `valor` sólo al crearse: para cargarle un borrador hay que
  // volver a montarlo, y esto es la `key` que lo fuerza.
  const [montaje, setMontaje] = useState(0)

  const esNueva = nota === null

  function cambiar<C extends keyof EntradaNota>(campo: C, valor: EntradaNota[C]) {
    setEntrada((previa) => ({ ...previa, [campo]: valor }))
  }

  const imagen = usarImagenElegida({
    onUrl: (url) => cambiar('imagen_portada', url),
    onAviso: setAviso,
  })

  const borrador = usarBorrador({
    idInicial: id,
    nueva: esNueva,
    entrada,
    archivo: imagen.archivo,
    guardada,
    alRecuperar: (b) => {
      setEntrada(b.entrada)
      setMontaje((m) => m + 1)
      imagen.setArchivo(b.archivo)
      setAviso(null)
    },
    // Guardar un borrador no lo ve nadie: se reintenta solo. Publicar y
    // programar esperan a que alguien apriete el botón de `AvisoReconexion`.
    alVolverLaRed: (pendiente) => {
      if (pendiente.tipo === 'guardar') alGuardar()
      else setAviso(null)
    },
  })

  /**
   * La entrada como se va a ver, con la imagen elegida en el lugar de la
   * guardada. Es lo que validan Zod y la vista previa: así el alt se exige
   * desde que se elige la foto y no recién después de subirla.
   */
  const entradaEfectiva: EntradaNota = {
    ...entrada,
    imagen_portada: imagen.urlLocal ?? entrada.imagen_portada,
  }

  function cambiarTitulo(titulo: string) {
    setEntrada((previa) => ({
      ...previa,
      titulo,
      // Sólo mientras no exista: después la URL ya está en la calle.
      slug: esNueva ? slugDesdeTitulo(titulo) : previa.slug,
    }))
  }

  /** Corre Zod y deja los errores al lado de cada campo. `true` si pasa. */
  function validar(): boolean {
    const encontrados = erroresPorCampo(entradaEfectiva)
    setErrores(encontrados)
    return Object.keys(encontrados).length === 0
  }

  /**
   * Manda al servidor, con el borrador a salvo antes de intentarlo.
   *
   * `null` si no hubo respuesta o si la foto no subió; el aviso ya quedó
   * puesto. **Los actions tiran cuando no hay red** —`Failed to fetch`— y antes
   * eso subía hasta la pantalla de error de Next y se llevaba la nota con él.
   */
  async function enviar(
    pendiente: Pendiente,
    accion: (lista: EntradaNota) => Promise<ResultadoNota>,
  ): Promise<ResultadoNota | null> {
    const respaldado = await borrador.respaldar()

    try {
      const lista = await imagen.subir(entrada)
      if (!lista) return null

      const r = await accion(lista)
      borrador.setPendiente(null)
      if (!r.error) await borrador.olvidar()
      return r
    } catch {
      borrador.setPendiente(pendiente)
      setPrevia(false)
      setAviso(avisoSinRed(pendiente, respaldado))
      return null
    }
  }

  function alGuardar() {
    if (!validar()) return

    empezar(async () => {
      const r = await enviar({ tipo: 'guardar' }, (lista) => guardarNota(lista, borrador.id))
      if (!r) return
      if (r.error) {
        setAviso(r.error)
        return
      }
      setAviso('Guardado')
      // Al crear, la URL pasa a ser la de la nota: recargar el editor no
      // vuelve a crear una segunda.
      if (esNueva) router.replace(`/admin/notas/${borrador.id}`)
      else router.refresh()
    })
  }

  /**
   * Abrir la vista previa es el paso obligado antes de publicar.
   *
   * No hay botón que publique derecho: publicar dispara el auto-posteo a las
   * redes, que no tiene vuelta atrás, y mirar cómo quedó cuesta un click. La
   * validación corre antes de abrirla — no tiene sentido previsualizar una nota
   * a la que le falta la bajada.
   *
   * Es una garantía de interfaz y no del servidor: `publicarNota` no tiene
   * forma de saber si alguien miró la preview, y con un solo autor no vale la
   * pena inventar un token firmado para demostrarlo. Lo que el servidor sí
   * vuelve a chequear es que la nota esté completa.
   */
  function abrirPrevia() {
    if (validar()) setPrevia(true)
  }

  /**
   * Publicar o programar. Con `publicadaEn` es una nota de archivo: sale ya,
   * pero fechada entonces y sin postearse a las redes. Ver `publicarNota()`.
   *
   * Programar comparte el camino —subir la imagen primero, mandar al servidor
   * después— porque una nota programada va a salir sin que nadie la mire de
   * nuevo: lo que falla acá, falla de madrugada.
   */
  function alPublicar(p: Publicacion) {
    empezar(async () => {
      const r = await enviar(p, (lista) =>
        p.tipo === 'publicar'
          ? publicarNota(lista, borrador.id, p.publicadaEn)
          : programarNota(lista, borrador.id, p.publicarEn),
      )
      if (!r || r.error) setPrevia(false)
      if (!r) return
      if (r.error) {
        setAviso([r.error, ...(r.motivos ?? [])].join(' · '))
        return
      }
      router.push('/admin')
    })
  }

  const pendiente = borrador.pendiente

  return (
    <div className="flex flex-col gap-5">
      {borrador.oferta && (
        <AvisoBorrador
          borrador={borrador.oferta}
          actualizadaEn={nota?.updated_at ?? null}
          onRecuperar={borrador.recuperar}
          onDescartar={() => void borrador.descartar()}
        />
      )}

      <CamposEncabezado
        entrada={entrada}
        esNueva={esNueva}
        errores={errores}
        onTitulo={cambiarTitulo}
        onCambio={cambiar}
      />

      <div className="flex flex-col gap-1">
        <span className="meta text-text-muted">Cuerpo</span>
        <EditorCuerpo
          key={montaje}
          valor={entrada.cuerpo}
          onCambio={(d) => cambiar('cuerpo', d)}
          notas={enlazables}
          idActual={nota?.id ?? null}
          partidos={partidos}
        />
      </div>

      <CamposClasificacion
        entrada={entrada}
        temporadas={temporadas}
        partidos={partidos}
        onCambio={cambiar}
      />

      <CampoImagen
        urlGuardada={entrada.imagen_portada}
        urlLocal={imagen.urlLocal}
        alt={entrada.imagen_alt}
        credito={entrada.imagen_credito}
        errorAlt={errores.imagen_alt}
        onArchivo={(archivo) => {
          if (!imagen.elegir(archivo)) return
          if (!archivo) cambiar('imagen_portada', null)
        }}
        onAlt={(v) => cambiar('imagen_alt', v)}
        onCredito={(v) => cambiar('imagen_credito', v)}
      />

      {pendiente && pendiente.tipo !== 'guardar' && borrador.hayConexion && (
        <AvisoReconexion pendiente={pendiente} ocupado={guardando} onReanudar={() => alPublicar(pendiente)} />
      )}

      <BarraAcciones
        aviso={aviso}
        ocupado={guardando}
        onGuardar={alGuardar}
        onVistaPrevia={abrirPrevia}
      />

      {previa && (
        <VistaPrevia
          nota={notaDePrevisualizacion({
            entrada: entradaEfectiva,
            autor,
            temporada: temporadas.find((t) => t.id === entrada.temporada_id) ?? null,
            partido: nota?.partido ?? null,
            existente: nota,
          })}
          sobrePublicada={esSobrePublicada(nota)}
          onVolver={() => setPrevia(false)}
          onPublicar={() => alPublicar({ tipo: 'publicar', publicadaEn: null })}
          onArchivar={(publicadaEn) => alPublicar({ tipo: 'publicar', publicadaEn })}
          onProgramar={(publicarEn) => alPublicar({ tipo: 'programar', publicarEn })}
          publicando={guardando}
        />
      )}
    </div>
  )
}
