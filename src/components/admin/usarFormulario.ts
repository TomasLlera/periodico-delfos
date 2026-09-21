'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { z } from 'zod'
import type { ResultadoEntidad } from '@/lib/entidades/campos'

/**
 * El estado que comparten los formularios del CRUD de entidades.
 *
 * Los cuatro —equipo, temporada, jugadora y partido— hacen exactamente lo
 * mismo: guardan la entrada en un `useState`, la pasan por Zod al enviar,
 * dejan los errores al lado de cada campo y llaman a un Server Action adentro
 * de un `useTransition`. Escrito cuatro veces, el cuarto sale distinto: el que
 * se olvida de limpiar los errores al guardar bien, o el que no deshabilita el
 * botón y manda dos inserts con doble click.
 *
 * `FormularioNota` **no** usa esto y no es un olvido: su estado incluye un
 * árbol de TipTap, una imagen sin subir y una vista previa modal, y lo que
 * tiene en común con estos cuatro es menos de lo que parece.
 *
 * Es un hook y no un componente, así que cada formulario sigue dibujando sus
 * campos como quiera: lo compartido es el estado, no la pantalla.
 */

interface Opciones<T> {
  inicial: T
  esquema: z.ZodType<T, unknown>
  /** El Server Action. Recibe la entrada ya validada del lado del cliente. */
  guardar: (datos: T) => Promise<ResultadoEntidad>
  /** A dónde se va cuando se guardó bien. El listado de la entidad. */
  volverA: string
}

export interface Formulario<T> {
  entrada: T
  cambiar: <C extends keyof T>(campo: C, valor: T[C]) => void
  /** Reemplaza varios campos de una: el slug que se recalcula con el nombre. */
  cambiarVarios: (parcial: Partial<T>) => void
  errores: Record<string, string>
  aviso: string | null
  mostrarAviso: (texto: string | null) => void
  ocupado: boolean
  enviar: () => void
}

export function usarFormulario<T extends object>({
  inicial,
  esquema,
  guardar,
  volverA,
}: Opciones<T>): Formulario<T> {
  const router = useRouter()
  const [entrada, setEntrada] = useState<T>(inicial)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  const [ocupado, empezar] = useTransition()

  function cambiar<C extends keyof T>(campo: C, valor: T[C]) {
    setEntrada((previa) => ({ ...previa, [campo]: valor }))
  }

  function cambiarVarios(parcial: Partial<T>) {
    setEntrada((previa) => ({ ...previa, ...parcial }))
  }

  function enviar() {
    const parseo = esquema.safeParse(entrada)

    if (!parseo.success) {
      // El primer error de cada campo y no todos: dos mensajes abajo del mismo
      // input se leen como un solo párrafo confuso.
      const encontrados: Record<string, string> = {}
      for (const issue of parseo.error.issues) {
        const campo = String(issue.path[0] ?? 'general')
        encontrados[campo] ??= issue.message
      }
      setErrores(encontrados)
      setAviso('Revisá lo que está marcado en rojo.')
      return
    }

    setErrores({})
    setAviso(null)

    empezar(async () => {
      const r = await guardar(parseo.data)

      if (r.error) {
        setAviso([r.error, ...(r.motivos ?? [])].join(' · '))
        return
      }

      // `refresh()` antes de navegar: el listado al que se vuelve es
      // `force-dynamic` pero el Router Cache del cliente igual le serviría la
      // versión de antes de guardar, y el dato recién cargado no aparecería.
      router.refresh()
      router.push(volverA)
    })
  }

  return {
    entrada,
    cambiar,
    cambiarVarios,
    errores,
    aviso,
    mostrarAviso: setAviso,
    ocupado,
    enviar,
  }
}
