/**
 * El filtro del listado del panel. Puro: lo que llega son los `searchParams`,
 * que son entrada de usuario.
 *
 * **Por qué existe.** El listado mostraba las setenta notas de la migración de
 * WordPress una abajo de la otra, agrupadas sólo por estado. Encontrar una
 * crónica de 2024 era scrollear hasta encontrarla, y eso empeora con cada nota
 * nueva: el archivo de un diario no deja de crecer.
 *
 * **Filtra en memoria y no en la base, y es a propósito.** `getNotasDelAdmin()`
 * ya trae todo —son setenta filas sin el cuerpo— así que filtrar acá no cuesta
 * una consulta más. Es la misma decisión que ya tomó `EnlazarNota` para el
 * selector de notas a anclar. El día que el listado se pagine, este módulo se
 * convierte en los `.eq()` de la query y los tests no cambian.
 *
 * **El estado del filtro vive en la URL** y no en un `useState`, por una razón
 * concreta del trabajo real: se filtra para encontrar una nota, se entra a
 * editarla y se vuelve. Con el filtro en memoria, volver lo pierde y hay que
 * tipearlo de nuevo cada vez. En la URL sobrevive al ir y venir, al recargar y
 * al botón de atrás, y de paso el formulario anda sin JavaScript —lo mismo que
 * hace `/buscar`.
 */

import { CATEGORIAS } from '@/lib/nota'
import type { Categoria, EstadoNota, NotaResumen } from '@/types'

/** Los estados, en el orden en que se trabaja una nota. */
export const ESTADOS: readonly EstadoNota[] = ['borrador', 'programada', 'publicada', 'archivada']

/** Lo que el usuario escribió, ya saneado. `null` es "todas". */
export interface Filtro {
  /** Parte del título. Vacío es "no filtrar por texto". */
  texto: string
  estado: EstadoNota | null
  categoria: Categoria | null
  anio: number | null
}

/** Lo que llega de `searchParams`: cada clave puede venir repetida. */
export type ParametrosFiltro = Record<string, string | string[] | undefined>

/** Más que esto no es una búsqueda, es un pegado accidental. */
const LARGO_MAXIMO = 100

/**
 * El año más viejo que se acepta.
 *
 * Es el mismo piso que `chequearFechaDeArchivo()` le pone a una nota: una nota
 * fechada antes del 2000 no existe, así que tampoco existe ese año en el
 * filtro.
 */
const ANIO_MINIMO = 2000

function primero(valor: string | string[] | undefined): string {
  return (Array.isArray(valor) ? valor[0] : valor) ?? ''
}

/**
 * Pasa los `searchParams` a un filtro.
 *
 * **Lo que no reconoce lo descarta.** `?estado=cualquiera` no es un error que
 * haya que mostrar: es una URL mal pegada, y la respuesta correcta es el
 * listado sin filtrar. Mostrar "estado inválido" sería pedirle al que escribe
 * que debuguee una query string.
 */
export function leerFiltro(parametros: ParametrosFiltro): Filtro {
  // Los espacios de más vienen de pegar texto, igual que en `/buscar`.
  const texto = primero(parametros.texto).trim().replace(/\s+/g, ' ').slice(0, LARGO_MAXIMO)

  const estado = primero(parametros.estado)
  const categoria = primero(parametros.categoria)
  const anio = Number.parseInt(primero(parametros.anio), 10)

  return {
    texto,
    estado: (ESTADOS as readonly string[]).includes(estado) ? (estado as EstadoNota) : null,
    categoria: (CATEGORIAS as readonly string[]).includes(categoria)
      ? (categoria as Categoria)
      : null,
    anio: Number.isInteger(anio) && anio >= ANIO_MINIMO ? anio : null,
  }
}

/** Si hay algo filtrando, para decidir si mostrar el "limpiar" y el conteo. */
export function hayFiltro(filtro: Filtro): boolean {
  return (
    filtro.texto !== '' ||
    filtro.estado !== null ||
    filtro.categoria !== null ||
    filtro.anio !== null
  )
}

/**
 * De qué año es una nota, para el filtro y para agrupar.
 *
 * **Es la misma fecha que muestra la fila** —`FilaNota`— y eso no es un detalle:
 * filtrar por 2024 y que aparezca una nota que en pantalla dice 2025 se lee
 * como un error del panel. La programada vale por cuándo sale; el borrador, que
 * no tiene ninguna de las dos, por cuándo se empezó a escribir.
 */
export function anioDeNota(
  nota: Pick<NotaResumen, 'estado' | 'publicada_en' | 'publicar_en' | 'created_at'>,
): number {
  const iso =
    nota.estado === 'programada' && nota.publicar_en
      ? nota.publicar_en
      : (nota.publicada_en ?? nota.created_at)

  return new Date(iso).getFullYear()
}

/**
 * Los años que hay para elegir, del más nuevo al más viejo.
 *
 * Se arman desde las notas y no desde un rango fijo: un `<select>` con 2000 a
 * 2026 tendría veintisiete opciones de las que veinte no devuelven nada.
 */
export function aniosDeNotas(notas: readonly NotaResumen[]): number[] {
  return [...new Set(notas.map(anioDeNota))].sort((a, b) => b - a)
}

/**
 * Aplica el filtro.
 *
 * **No reordena.** El orden lo decide `getNotasDelAdmin()` —borradores primero,
 * después por fecha de publicación— y filtrar no es una excusa para cambiarlo.
 *
 * El texto se compara sin tildes y sin distinguir mayúsculas, porque se busca
 * de memoria y a medio tipear: "moron" tiene que encontrar "Morón". Es lo que
 * `buscarNotas()` ya hace del lado de Postgres con `unaccent`, y lo que el
 * selector de `EnlazarNota` todavía no hace —el día que se unifiquen, esta
 * función es la que vale.
 */
export function filtrarNotas(notas: readonly NotaResumen[], filtro: Filtro): NotaResumen[] {
  const termino = normalizar(filtro.texto)

  return notas.filter((nota) => {
    if (filtro.estado !== null && nota.estado !== filtro.estado) return false
    if (filtro.categoria !== null && nota.categoria !== filtro.categoria) return false
    if (filtro.anio !== null && anioDeNota(nota) !== filtro.anio) return false
    if (termino !== '' && !normalizar(nota.titulo).includes(termino)) return false
    return true
  })
}

/**
 * Minúsculas y sin tildes.
 *
 * `normalize('NFD')` separa la vocal de su tilde y el rango de `̀`
 * a `ͯ` —los diacríticos combinables de Unicode— es lo que se borra. Sirve
 * para la ñ también: queda como `n`, que es como se la tipea cuando se busca
 * rápido.
 */
function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}
