/**
 * Qué número usó cada jugadora en los partidos de un campeonato.
 *
 * Es un pedido de Carlos y es, además, lo único que se puede contestar desde
 * que la `0020` movió el dorsal de `plantel` a `formaciones`: el número dejó de
 * ser un dato de la temporada —uno solo, cargado a mano— y pasó a ser el de
 * cada partido. La contrapartida es que "el dorsal de Cortadi" ya no existe
 * como dato: existe "el 10 en cinco partidos y el 16 en uno", que es lo que de
 * verdad pasó.
 *
 * Lógica pura: sin JSX y sin base, como `plantel.ts` y `partido.ts`. La query
 * vive en `lib/supabase/queries/dorsales.ts`.
 */

/** Una fila de `formaciones` de la temporada, con lo mínimo que hace falta. */
export interface UsoCrudo {
  jugadora_id: string
  nombre: string
  apellido: string
  slug: string
  dorsal: number | null
}

/** Un número y cuántos partidos lo llevó. */
export interface UsoDeDorsal {
  dorsal: number
  veces: number
}

export interface DorsalesDeJugadora {
  jugadora_id: string
  nombre: string
  apellido: string
  slug: string
  /** De más usado a menos. El primero es el número con el que se la reconoce. */
  usos: UsoDeDorsal[]
  /** En cuántos partidos del campeonato entró en la planilla. */
  partidos: number
  /** Partidos en los que estuvo convocada y no quedó registrado el número. */
  sinDorsal: number
}

/**
 * Agrupa las filas crudas por jugadora.
 *
 * **Las convocatorias sin número se cuentan aparte y no se inventan.** Las
 * cinco planillas que había antes de la `0020` se cargaron sin dorsales, y la
 * migración numeró del 1 al 11 sólo los partidos donde no había ninguno
 * cargado; lo que quede sin número de acá en adelante es un dato que falta, y
 * la página lo tiene que decir en lugar de disimularlo.
 */
export function dorsalesPorJugadora(filas: readonly UsoCrudo[]): DorsalesDeJugadora[] {
  const porJugadora = new Map<string, DorsalesDeJugadora & { conteo: Map<number, number> }>()

  for (const fila of filas) {
    let entrada = porJugadora.get(fila.jugadora_id)

    if (!entrada) {
      entrada = {
        jugadora_id: fila.jugadora_id,
        nombre: fila.nombre,
        apellido: fila.apellido,
        slug: fila.slug,
        usos: [],
        partidos: 0,
        sinDorsal: 0,
        conteo: new Map(),
      }
      porJugadora.set(fila.jugadora_id, entrada)
    }

    entrada.partidos += 1

    if (fila.dorsal === null) {
      entrada.sinDorsal += 1
      continue
    }

    entrada.conteo.set(fila.dorsal, (entrada.conteo.get(fila.dorsal) ?? 0) + 1)
  }

  const filasArmadas = [...porJugadora.values()].map(({ conteo, ...jugadora }) => ({
    ...jugadora,
    usos: ordenarUsos(conteo),
  }))

  return filasArmadas.sort(compararPorDorsalPrincipal)
}

/**
 * De más usado a menos, y a igual cantidad el número más bajo primero.
 *
 * El desempate no es un detalle: sin él, dos números usados una vez cada uno
 * salen en el orden en que Postgres devolvió las filas, que cambia entre
 * consultas. Una página que se reordena sola entre dos visitas se lee como que
 * el dato cambió.
 */
function ordenarUsos(conteo: ReadonlyMap<number, number>): UsoDeDorsal[] {
  return [...conteo.entries()]
    .map(([dorsal, veces]) => ({ dorsal, veces }))
    .sort((a, b) => b.veces - a.veces || a.dorsal - b.dorsal)
}

/**
 * El orden de la tabla: por el número con el que se la reconoce.
 *
 * **No es alfabético**, por lo mismo que `ordenarPlantel()`: una lista de
 * dorsales se lee del 1 para arriba. Las que nunca tuvieron número van al
 * final —no al principio, que es donde las dejaría un `null` ordenado como
 * número— y ahí sí entre ellas por apellido.
 */
function compararPorDorsalPrincipal(a: DorsalesDeJugadora, b: DorsalesDeJugadora): number {
  const da = a.usos[0]?.dorsal ?? Number.MAX_SAFE_INTEGER
  const db = b.usos[0]?.dorsal ?? Number.MAX_SAFE_INTEGER
  return da - db || a.apellido.localeCompare(b.apellido, 'es')
}

/**
 * Cuántos números distintos se usaron en todo el campeonato.
 *
 * Es el dato del encabezado: dice de un vistazo si el equipo tuvo numeración
 * fija o si cambió de partido en partido.
 */
export function dorsalesDistintos(filas: readonly DorsalesDeJugadora[]): number {
  const numeros = new Set<number>()
  for (const fila of filas) {
    for (const uso of fila.usos) numeros.add(uso.dorsal)
  }
  return numeros.size
}

/**
 * "10 en 5 partidos · 16 en 1" — el renglón de una jugadora, como texto.
 *
 * Vive acá y no en el componente porque es lo que se testea y porque el `alt`
 * de nada y el `aria-label` de la fila necesitan la misma frase que se ve.
 */
export function resumenDeUsos(usos: readonly UsoDeDorsal[]): string {
  if (usos.length === 0) return 'Sin dorsal registrado'

  return usos
    .map((uso) => `${uso.dorsal} en ${uso.veces} ${uso.veces === 1 ? 'partido' : 'partidos'}`)
    .join(' · ')
}
