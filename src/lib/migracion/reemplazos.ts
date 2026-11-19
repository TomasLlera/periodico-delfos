/**
 * Las notas de WordPress que ya se reescribieron a mano en el panel.
 *
 * Entre septiembre y octubre de 2026 se cargaron seis notas desde el panel
 * nuevo. Tres de ellas cubren partidos que **también** tienen su crónica en
 * WordPress, con otro slug y otra redacción:
 *
 *     2026-04-11  Tiburonas 2-1 Defensores de Belgrano    (fecha N°1)
 *     2026-04-19  All Boys 6-1 Tiburonas                  (fecha N°2)
 *     2026-04-25  Tiburonas 1-4 Defensa y Justicia        (fecha N°3)
 *
 * El `upsert` de la migración es por slug, así que sin esta tabla no habría
 * conflicto: entrarían como notas nuevas y el sitio quedaría con dos crónicas
 * del mismo partido, cada una con su URL. La decisión fue **quedarse con la
 * escrita a mano**, que es la que ya está publicada y la que linkea el resto
 * del sitio.
 *
 * Que la nota vieja no se migre no significa que su URL se abandone: el
 * permalink de WordPress está indexado y es justo lo que la regla no negociable
 * 8 manda preservar. La 301 apunta a la nota nueva en vez de a un slug que no
 * va a existir nunca — eso lo hace `redireccionesDeNotas()` leyendo
 * `reemplazadaPor`, y es la razón por la que el dato viaja en la nota y no se
 * queda acá.
 *
 * El apareamiento se verificó por fecha de publicación exacta y resultado, no
 * por parecido de título. Las otras tres notas del panel (la ida de los
 * octavos, la novena posición y un borrador sin fecha) no tienen equivalente:
 * el sitio viejo dejó de publicar el 8 de agosto de 2026 y el nuevo arranca el
 * 27 de septiembre.
 *
 * Esto vive en el repo y no en `.migracion-wp/bajadas.json` a propósito. Es una
 * decisión editorial que hay que poder auditar y que no se puede perder:
 * `.migracion-wp/` está gitignoreado y la corrida en seco original se hizo en
 * otra máquina.
 */

/** Slug viejo de WordPress → slug de la nota del panel que lo reemplaza. */
export const REEMPLAZOS: Readonly<Record<string, string>> = {
  'tiburonas-2-1-defensores-de-belgrano-fecha-n1-aldosivi-femenino-en-la-primera-b':
    'las-tiburonas-vencieron-a-defensores-de-belgrano-en-su-debut-en-la-primera-b-2026',
  'all-boys-6-1-tiburonas-fecha-n2-aldosivi-en-la-primera-b-2026':
    'dura-derrota-para-las-tiburonas-6-a-1-frente-a-all-boys',
  'tiburonas-1-4-defensa-y-justicia-fecha-n3-aldosivi-femenino-en-la-primera-b-2026':
    'segunda-caida-consecutiva-de-las-tiburonas-perdieron-4-a-1-frente-a-defensa-y-justicia',
}

/**
 * El slug que reemplaza a una nota de WordPress, o `null` si se migra normal.
 *
 * Se normaliza la clave igual que un slug de WordPress —minúsculas, sin barras
 * ni espacios al borde— porque la tabla se escribe a mano y un slug copiado de
 * la barra de direcciones viene con la barra final.
 */
export function slugQueReemplaza(
  slug: string,
  reemplazos: Readonly<Record<string, string>> = REEMPLAZOS,
): string | null {
  const clave = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '')
  const destino = reemplazos[clave]?.trim()
  return destino === undefined || destino === '' ? null : destino
}
