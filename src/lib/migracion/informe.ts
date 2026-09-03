/**
 * El informe de la corrida.
 *
 * Es la salida más importante del script mientras no haya Supabase: dice qué
 * se migraría, qué queda a mano y por qué. Se arma como Markdown y no como
 * texto de consola porque son ~70 notas con listas de pendientes: en la
 * terminal se pierde para arriba, en un archivo se abre y se va tachando.
 *
 * Puro a propósito: recibe el resultado de `transformarVolcado()` y devuelve un
 * string. El script lo escribe a disco y además imprime el resumen corto.
 */

import { MAPA_CATEGORIAS } from '@/lib/migracion/categorias'
import type { ResultadoMigracion } from '@/lib/migracion/transformar'
import type { NotaMigrada, Redireccion, TipoAdvertencia } from '@/lib/migracion/tipos'

function conAdvertencia(notas: readonly NotaMigrada[], tipo: TipoAdvertencia): NotaMigrada[] {
  return notas.filter((nota) => nota.advertencias.some((a) => a.tipo === tipo))
}

function detalle(nota: NotaMigrada, tipo: TipoAdvertencia): string {
  return nota.advertencias.find((a) => a.tipo === tipo)?.detalle ?? ''
}

function seccion(titulo: string, cuerpo: string[]): string {
  return cuerpo.length === 0 ? '' : `## ${titulo}\n\n${cuerpo.join('\n')}\n`
}

function tabla(encabezados: readonly string[], filas: readonly (readonly string[])[]): string[] {
  if (filas.length === 0) return []
  return [
    `| ${encabezados.join(' | ')} |`,
    `|${encabezados.map(() => '---').join('|')}|`,
    ...filas.map((fila) => `| ${fila.join(' | ')} |`),
  ]
}

export interface DatosInforme {
  resultado: ResultadoMigracion
  redirecciones: readonly Redireccion[]
  /** `true` cuando la corrida no escribió nada. */
  enSeco: boolean
  origen: string
}

export function armarInforme({
  resultado,
  redirecciones,
  enSeco,
  origen,
}: DatosInforme): string {
  const { notas, imagenes, categoriasSinMapear, descartados } = resultado

  const sinBajada = conAdvertencia(notas, 'bajada-faltante')
  const sinAlt = conAdvertencia(notas, 'alt-faltante')
  const sinTemporada = conAdvertencia(notas, 'temporada-sin-detectar')
  const conDatosDeportivos = conAdvertencia(notas, 'datos-deportivos-en-el-cuerpo')
  const publicables = notas.filter((nota) => nota.estado === 'publicada')

  // Cada elemento de `partes` es un bloque entero con sus propios saltos: los
  // `''` sueltos se filtran al final para sacar las secciones vacías, y una
  // línea en blanco perdida deja un encabezado pegado a la tabla de arriba.
  const partes: string[] = [
    [
      `# Migración desde WordPress`,
      ``,
      `Origen: ${origen}`,
      ``,
      `Corrida: ${enSeco ? '**en seco** — no se escribió nada' : 'con escritura a Supabase'}`,
      ``,
      `## Resumen`,
      ``,
      ...tabla(
        ['Qué', 'Cuántas'],
        [
          ['Notas leídas', String(notas.length)],
          [
            'Listas para escribir (con bajada)',
            String(notas.filter((n) => n.listaParaEscribir).length),
          ],
          ['Quedarían publicadas', String(publicables.length)],
          ['Quedarían en borrador', String(notas.length - publicables.length)],
          ['Imágenes a subir al bucket `media`', String(imagenes.length)],
          ['Redirecciones 301', String(redirecciones.length)],
        ],
      ),
      ``,
    ].join('\n'),
  ]

  partes.push(
    seccion('Bajadas a escribir a mano', [
      `\`bajada\` es obligatoria y no se inventa: la base la exige no vacía`,
      `(constraint \`bajada_no_vacia\`) y el extracto automático de WordPress corta a`,
      `mitad de oración. **Estas ${sinBajada.length} notas no se escriben hasta que tengan una.**`,
      ``,
      `Completar \`bajadas.json\` y volver a correr.`,
      ``,
      ...tabla(
        ['Slug', 'Título', 'Por qué no sirve la de WordPress'],
        sinBajada.map((nota) => [
          nota.slug,
          nota.titulo,
          detalle(nota, 'bajada-faltante').replace(/^El extracto de WordPress no sirve \(|\)\..*$/g, ''),
        ]),
      ),
    ]),
  )

  partes.push(
    seccion('Imágenes sin texto alternativo', [
      `Regla no negociable 4: ninguna nota se publica con \`alt\` vacío. La imagen se`,
      `sube igual al bucket, pero no se guarda en la nota y la nota queda en`,
      `**borrador** hasta que el \`alt\` esté escrito.`,
      ``,
      `Completar \`alt.json\` (la clave es la ruta en el bucket) y volver a correr.`,
      ``,
      ...tabla(
        ['Slug', 'Rutas sin alt'],
        sinAlt.map((nota) => [nota.slug, `\`${detalle(nota, 'alt-faltante')}\``]),
      ),
    ]),
  )

  partes.push(
    seccion('Categorías', [
      `Mapeo aplicado, por slug de WordPress:`,
      ``,
      ...tabla(
        ['WordPress', '`categoria_t`'],
        Object.entries(MAPA_CATEGORIAS).map(([wp, nuestra]) => [`\`${wp}\``, `\`${nuestra}\``]),
      ),
      ``,
      categoriasSinMapear.length === 0
        ? `Todas las categorías del sitio viejo tienen equivalente.`
        : `**Sin equivalente** (cayeron en \`institucional\`): ${categoriasSinMapear
            .map((slug) => `\`${slug}\``)
            .join(', ')}`,
    ]),
  )

  partes.push(
    seccion('Títulos, fechas y temporadas', [
      `El sufijo \`: Fecha N°X – Aldosivi Femenino en la Primera B 2026\` se saca del`,
      `título y se guarda estructurado. La temporada se resuelve por slug contra la`,
      `tabla \`temporadas\` al escribir; **la fecha no tiene columna en \`notas\`** —es`,
      `de \`partidos\`— y va acá para vincular la nota con su partido cuando se carguen`,
      `a mano desde el admin.`,
      ``,
      ...tabla(
        ['Slug', 'Título nuevo', 'Temporada', 'Fecha', 'Etapa'],
        notas.map((nota) => [
          nota.slug,
          nota.titulo,
          nota.temporada?.slug ?? '—',
          nota.fechaNumero === null ? '—' : String(nota.fechaNumero),
          nota.etapa ?? '—',
        ]),
      ),
      ``,
      sinTemporada.length === 0
        ? ''
        : `Sin temporada detectable: ${sinTemporada.map((n) => `\`${n.slug}\``).join(', ')}`,
    ]),
  )

  partes.push(
    seccion('Datos deportivos escritos a mano en el cuerpo', [
      `Regla no negociable 1: ningún dato deportivo se escribe a mano dentro del texto.`,
      `La migración **no los toca** —parsear formaciones con regex es justo lo que el`,
      `blueprint descarta (sección 5: se cargan a mano desde el admin)— pero deja la`,
      `lista para que el trabajo tenga un largo conocido.`,
      ``,
      `${conDatosDeportivos.length} de ${notas.length} notas traen la ficha del partido tipeada.`,
      ``,
      ...tabla(
        ['Slug', 'Secciones'],
        conDatosDeportivos.map((nota) => [
          nota.slug,
          detalle(nota, 'datos-deportivos-en-el-cuerpo'),
        ]),
      ),
    ]),
  )

  partes.push(
    seccion('Nodos descartados al convertir a TipTap', [
      Object.keys(descartados).length === 0
        ? `Ninguno: todo el HTML entró en lo que el renderer sabe dibujar.`
        : `Lo que no tiene equivalente en \`render.tsx\` se descarta:`,
      ``,
      ...tabla(
        ['Nodo', 'Veces'],
        Object.entries(descartados).map(([tipo, cuantos]) => [`\`${tipo}\``, String(cuantos)]),
      ),
    ]),
  )

  return partes.filter((parte) => parte !== '').join('\n')
}

/** El resumen corto que va a la terminal. */
export function resumenDeConsola(resultado: ResultadoMigracion, rutaInforme: string): string[] {
  const { notas } = resultado
  const sinBajada = conAdvertencia(notas, 'bajada-faltante').length
  const sinAlt = conAdvertencia(notas, 'alt-faltante').length

  return [
    `notas leídas          ${notas.length}`,
    `listas para escribir  ${notas.filter((n) => n.listaParaEscribir).length}`,
    `sin bajada            ${sinBajada}`,
    `con alt pendiente     ${sinAlt}`,
    `imágenes              ${resultado.imagenes.length}`,
    `categorías sin mapear ${resultado.categoriasSinMapear.length}`,
    ``,
    `El detalle completo está en ${rutaInforme}`,
  ]
}
