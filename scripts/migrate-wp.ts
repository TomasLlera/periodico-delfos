/**
 * La migración desde WordPress.
 *
 *     pnpm tsx scripts/migrate-wp.ts               # en seco, no escribe nada
 *     pnpm tsx scripts/migrate-wp.ts --escribir    # sube al bucket y escribe en notas
 *     pnpm tsx scripts/migrate-wp.ts --ayuda
 *
 * Este archivo es **sólo I/O**: red, disco y Supabase. Toda la transformación
 * vive en `src/lib/migracion/`, que es TypeScript puro y tiene 92 tests que
 * corren sin credenciales y sin conexión. La separación no es estética:
 * `vitest.config.mts` sólo levanta `src/**` y, sobre todo, una migración que se
 * corre una vez en la vida no se puede depurar contra la API del sitio en
 * producción.
 *
 * Tres reglas de la casa que explican la forma del script:
 *
 * - **La API se consulta una vez.** Todo lo que devuelve queda en
 *   `.migracion-wp/crudo/` y a partir de ahí se itera sobre archivos locales.
 *   Volver a pegarle es un `--redescargar` explícito.
 * - **Correr en seco es lo normal.** Escribir es un flag, y es lo único que
 *   necesita credenciales de Supabase.
 * - **Nada se completa a ojo.** Lo que falta —bajadas, textos alternativos— sale
 *   en `informe.md` y en dos archivos para llenar a mano, y la nota espera.
 */

import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { armarInforme, resumenDeConsola } from '@/lib/migracion/informe'
import { categoriaDesdeWordPress } from '@/lib/migracion/categorias'
import { urlPublicaDeBucket } from '@/lib/migracion/imagenes'
import {
  REDIRECCIONES_FIJAS,
  redireccionesDeAutores,
  redireccionesDeCategorias,
  redireccionesDeNotas,
  unificarRedirecciones,
} from '@/lib/migracion/redirecciones'
import { transformarVolcado } from '@/lib/migracion/transformar'
import {
  esquemaAutorWP,
  esquemaCategoriaWP,
  esquemaMediaWP,
  esquemaPostWP,
} from '@/lib/migracion/tipos'
import type { ImagenMigrada, NotaMigrada, VolcadoWP } from '@/lib/migracion/tipos'

// ============================================
// Opciones
// ============================================

const AYUDA = `
Migración desde WordPress → Supabase.

  --origen <url>     Sitio de WordPress. Por omisión WP_MIGRATION_SOURCE o
                     https://periodicodelfos.com
  --salida <dir>     Dónde dejar todo. Por omisión .migracion-wp
  --autor <slug>     Slug en la tabla autores. Por omisión charlie-redondo
  --limite <n>       Sólo las primeras N notas, para probar
  --redescargar      Vuelve a pegarle a la REST API aunque haya copia local
  --sin-imagenes     No baja los binarios de las fotos
  --escribir         Sube al bucket y escribe en Supabase. Pide credenciales.
  --ayuda            Esto
`

interface Opciones {
  origen: string
  salida: string
  autorSlug: string
  limite: number | null
  redescargar: boolean
  sinImagenes: boolean
  escribir: boolean
}

function leerOpciones(argv: readonly string[]): Opciones {
  const valor = (nombre: string): string | undefined => {
    const indice = argv.indexOf(`--${nombre}`)
    return indice === -1 ? undefined : argv[indice + 1]
  }
  const bandera = (nombre: string): boolean => argv.includes(`--${nombre}`)

  const limite = valor('limite')

  return {
    origen: (valor('origen') ?? process.env.WP_MIGRATION_SOURCE ?? 'https://periodicodelfos.com')
      .trim()
      .replace(/\/+$/, ''),
    salida: path.resolve(process.cwd(), valor('salida') ?? '.migracion-wp'),
    autorSlug: valor('autor') ?? 'charlie-redondo',
    limite: limite === undefined ? null : Number(limite),
    redescargar: bandera('redescargar'),
    sinImagenes: bandera('sin-imagenes'),
    escribir: bandera('escribir'),
  }
}

// ============================================
// Consola
// ============================================

const paso = (texto: string): void => console.log(`\n▸ ${texto}`)
const detalle = (texto: string): void => console.log(`  ${texto}`)
const aviso = (texto: string): void => console.log(`  ⚠ ${texto}`)

// ============================================
// Disco
// ============================================

async function guardarJSON(archivo: string, datos: unknown): Promise<void> {
  await mkdir(path.dirname(archivo), { recursive: true })
  await writeFile(archivo, `${JSON.stringify(datos, null, 2)}\n`, 'utf8')
}

async function leerJSON(archivo: string): Promise<unknown | null> {
  if (!existsSync(archivo)) return null
  return JSON.parse(await readFile(archivo, 'utf8')) as unknown
}

/**
 * Carga `.env.local` a mano.
 *
 * `tsx` no es Next: nadie lee el `.env.local` por nosotros. Sólo hace falta
 * para `--escribir`, y no se usa `dotenv` para no sumar una dependencia por
 * doce líneas.
 */
async function cargarEnvLocal(): Promise<void> {
  const archivo = path.resolve(process.cwd(), '.env.local')
  if (!existsSync(archivo)) return

  for (const linea of (await readFile(archivo, 'utf8')).split('\n')) {
    const par = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i.exec(linea)
    if (!par) continue
    const [, clave = '', bruto = ''] = par
    if (process.env[clave] !== undefined) continue
    process.env[clave] = bruto.replace(/^["']|["']$/g, '')
  }
}

// ============================================
// La REST API de WordPress
// ============================================

/**
 * Trae un recurso entero, paginando.
 *
 * Se guarda el objeto completo tal como lo devuelve WordPress —sin `_fields`—
 * porque el volcado es el único registro que va a quedar del sitio viejo: si
 * más adelante hace falta un campo que hoy no se usa, tiene que estar en el
 * archivo y no a un `curl` de distancia de un sitio que ya no existe.
 */
async function traerRecurso<T>(
  origen: string,
  recurso: string,
  esquema: z.ZodType<T>,
): Promise<T[]> {
  const items: T[] = []
  let pagina = 1
  let totalPaginas = 1

  do {
    const url = `${origen}/wp-json/wp/v2/${recurso}?per_page=100&page=${pagina}`
    const respuesta = await fetch(url, { headers: { 'user-agent': 'periodico-delfos-migracion' } })

    if (!respuesta.ok) {
      throw new Error(`${recurso}: la API devolvió ${respuesta.status} en la página ${pagina}`)
    }

    totalPaginas = Number(respuesta.headers.get('x-wp-totalpages') ?? '1') || 1

    const crudos = z.array(z.unknown()).parse(await respuesta.json())
    for (const crudo of crudos) {
      const validado = esquema.safeParse(crudo)
      if (validado.success) {
        items.push(validado.data)
      } else {
        // No se corta la migración por un adjunto raro, pero tampoco se lo
        // esconde: un post que no valida es un post que no se migra.
        aviso(`${recurso}: un item no validó y quedó afuera — ${validado.error.issues[0]?.message}`)
      }
    }

    pagina += 1
  } while (pagina <= totalPaginas)

  return items
}

/** Baja todo el sitio viejo, o lee la copia que ya está en disco. */
async function obtenerVolcado(opciones: Opciones): Promise<VolcadoWP> {
  const dir = path.join(opciones.salida, 'crudo')
  const archivos = {
    posts: path.join(dir, 'posts.json'),
    categorias: path.join(dir, 'categorias.json'),
    medios: path.join(dir, 'medios.json'),
    autores: path.join(dir, 'autores.json'),
  }

  const hayCopia = Object.values(archivos).every((archivo) => existsSync(archivo))

  if (hayCopia && !opciones.redescargar) {
    paso(`Volcado local en ${path.relative(process.cwd(), dir)} — no se toca la API`)
    detalle('Para volver a bajarlo: --redescargar')

    return {
      posts: z.array(esquemaPostWP).parse(await leerJSON(archivos.posts)),
      categorias: z.array(esquemaCategoriaWP).parse(await leerJSON(archivos.categorias)),
      medios: z.array(esquemaMediaWP).parse(await leerJSON(archivos.medios)),
      autores: z.array(esquemaAutorWP).parse(await leerJSON(archivos.autores)),
    }
  }

  paso(`Bajando ${opciones.origen}/wp-json/wp/v2/`)

  const [posts, categorias, medios, autores] = await Promise.all([
    traerRecurso(opciones.origen, 'posts', esquemaPostWP),
    traerRecurso(opciones.origen, 'categories', esquemaCategoriaWP),
    traerRecurso(opciones.origen, 'media', esquemaMediaWP),
    traerRecurso(opciones.origen, 'users', esquemaAutorWP),
  ])

  await Promise.all([
    guardarJSON(archivos.posts, posts),
    guardarJSON(archivos.categorias, categorias),
    guardarJSON(archivos.medios, medios),
    guardarJSON(archivos.autores, autores),
  ])

  detalle(`${posts.length} notas · ${categorias.length} categorías · ${medios.length} medios · ${autores.length} autores`)
  detalle(`Guardado en ${path.relative(process.cwd(), dir)}`)

  return { posts, categorias, medios, autores }
}

// ============================================
// Los archivos que se completan a mano
// ============================================

const esquemaPendientes = z.record(z.string(), z.string())

/**
 * Lee un archivo de pendientes y lo vuelve a escribir con las claves nuevas.
 *
 * Nunca pisa lo que ya está escrito: el archivo es trabajo humano. Sólo agrega
 * las claves que faltan, con el valor vacío, y ordena para que el diff entre
 * dos corridas se lea.
 */
async function sincronizarPendientes(
  archivo: string,
  claves: readonly string[],
): Promise<Record<string, string>> {
  const previo = esquemaPendientes.catch({}).parse((await leerJSON(archivo)) ?? {})

  const completo: Record<string, string> = {}
  for (const clave of [...new Set([...Object.keys(previo), ...claves])].sort()) {
    completo[clave] = previo[clave] ?? ''
  }

  await guardarJSON(archivo, completo)
  return completo
}

// ============================================
// Las fotos
// ============================================

/** De a seis: el sitio viejo está en un hosting compartido. */
async function enTandas<T>(items: readonly T[], tamano: number, tarea: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += tamano) {
    await Promise.all(items.slice(i, i + tamano).map(tarea))
  }
}

async function bajarImagenes(imagenes: readonly ImagenMigrada[], salida: string): Promise<number> {
  let bajadas = 0
  let fallidas = 0

  await enTandas(imagenes, 6, async (imagen) => {
    const destino = path.join(salida, 'media', ...imagen.ruta.split('/'))
    if (existsSync(destino)) return

    try {
      const respuesta = await fetch(imagen.origen)
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)

      await mkdir(path.dirname(destino), { recursive: true })
      await writeFile(destino, Buffer.from(await respuesta.arrayBuffer()))
      bajadas += 1
    } catch (error) {
      fallidas += 1
      aviso(`no se pudo bajar ${imagen.origen} — ${(error as Error).message}`)
    }
  })

  if (fallidas > 0) aviso(`${fallidas} imágenes no se pudieron bajar`)
  return bajadas
}

const TIPOS_POR_EXTENSION: Readonly<Record<string, string>> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
}

// ============================================
// Supabase
// ============================================

async function escribirEnSupabase(
  notas: readonly NotaMigrada[],
  imagenes: readonly ImagenMigrada[],
  opciones: Opciones,
): Promise<void> {
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!urlSupabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. Completá .env.local desde .env.example.',
    )
  }

  // El import va acá adentro a propósito: en seco el script no toca
  // `@supabase/supabase-js` ni pide credenciales para arrancar.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const supabase = createAdminClient()

  // ── El bucket ──────────────────────────────────────────────
  paso('Bucket media')
  const { data: bucket } = await supabase.storage.getBucket('media')
  if (!bucket) {
    const { error } = await supabase.storage.createBucket('media', { public: true })
    if (error) throw new Error(`no se pudo crear el bucket media: ${error.message}`)
    detalle('creado, público')
  } else if (!bucket.public) {
    // Regla no negociable 7: Instagram exige una URL HTTPS pública.
    throw new Error('el bucket media existe pero es privado; Instagram necesita URLs públicas')
  }

  // ── Las fotos ──────────────────────────────────────────────
  paso(`Subiendo ${imagenes.length} imágenes`)
  let subidas = 0
  await enTandas(imagenes, 4, async (imagen) => {
    const local = path.join(opciones.salida, 'media', ...imagen.ruta.split('/'))
    if (!existsSync(local)) {
      aviso(`falta el archivo local de ${imagen.ruta}; corré sin --sin-imagenes`)
      return
    }

    const { error } = await supabase.storage.from('media').upload(imagen.ruta, await readFile(local), {
      contentType: TIPOS_POR_EXTENSION[path.extname(imagen.ruta).toLowerCase()] ?? 'application/octet-stream',
      upsert: true,
    })

    if (error) aviso(`${imagen.ruta}: ${error.message}`)
    else subidas += 1
  })
  detalle(`${subidas} subidas`)

  // ── Los ids que faltan ─────────────────────────────────────
  const { data: autor } = await supabase
    .from('autores')
    .select('id')
    .eq('slug', opciones.autorSlug)
    .maybeSingle()

  if (!autor) {
    throw new Error(
      `no existe el autor "${opciones.autorSlug}" en la tabla autores. ` +
        'Creá el usuario en Auth y su fila en autores, o pasá --autor <slug>.',
    )
  }

  const { data: temporadas } = await supabase.from('temporadas').select('id, slug')
  const idDeTemporada = new Map((temporadas ?? []).map((t) => [t.slug as string, t.id as string]))

  // ── Las notas ──────────────────────────────────────────────
  const escribibles = notas.filter((nota) => nota.listaParaEscribir)
  paso(`Escribiendo ${escribibles.length} notas (${notas.length - escribibles.length} esperan bajada)`)

  const filas = escribibles.map((nota) => {
    const temporadaId = nota.temporada ? idDeTemporada.get(nota.temporada.slug) ?? null : null
    if (nota.temporada && !temporadaId) {
      aviso(`${nota.slug}: no existe la temporada ${nota.temporada.slug}; queda sin temporada`)
    }

    return {
      titulo: nota.titulo,
      slug: nota.slug,
      bajada: nota.bajada,
      cuerpo: nota.cuerpo,
      imagen_portada: nota.portada ? urlPublicaDeBucket(urlSupabase, nota.portada.ruta) : null,
      imagen_alt: nota.portada?.alt ?? '',
      imagen_credito: nota.portada?.credito ?? null,
      categoria: nota.categoria,
      temporada_id: temporadaId,
      autor_id: autor.id as string,
      estado: nota.estado,
      publicada_en: nota.publicadaEn,
    }
  })

  // Idempotente por slug: correr dos veces no duplica ni una nota, que es lo
  // que permite completar bajadas y textos alternativos de a poco.
  const { error } = await supabase.from('notas').upsert(filas, { onConflict: 'slug' })
  if (error) throw new Error(`no se pudieron escribir las notas: ${error.message}`)

  detalle(`${filas.length} notas escritas`)
}

// ============================================
// El programa
// ============================================

async function principal(): Promise<void> {
  const opciones = leerOpciones(process.argv.slice(2))

  if (process.argv.includes('--ayuda')) {
    console.log(AYUDA)
    return
  }

  console.log(`Periódico Delfos · migración desde WordPress`)
  console.log(opciones.escribir ? '· MODO ESCRITURA ·' : '· en seco: no se escribe nada ·')

  const volcado = await obtenerVolcado(opciones)
  if (opciones.limite !== null) {
    volcado.posts = volcado.posts.slice(0, opciones.limite)
    detalle(`--limite ${opciones.limite}: se procesan ${volcado.posts.length} notas`)
  }

  // En seco todavía no hay proyecto de Supabase; las URLs del bucket salen con
  // un host de muestra y se recalculan cuando se corre con --escribir.
  await cargarEnvLocal()
  const urlSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://proyecto.supabase.co'

  const bajadasArchivo = path.join(opciones.salida, 'bajadas.json')
  const altArchivo = path.join(opciones.salida, 'alt.json')

  const bajadas = esquemaPendientes.catch({}).parse((await leerJSON(bajadasArchivo)) ?? {})
  const alts = esquemaPendientes.catch({}).parse((await leerJSON(altArchivo)) ?? {})

  paso('Transformando')
  const resultado = transformarVolcado(volcado, {
    urlSupabase,
    bajadas,
    alts,
    autorSlug: opciones.autorSlug,
  })

  const redirecciones = unificarRedirecciones(
    redireccionesDeNotas(resultado.notas),
    redireccionesDeCategorias(
      volcado.categorias,
      (slug) => categoriaDesdeWordPress([slug]).categoria,
    ),
    redireccionesDeAutores(volcado.autores),
    REDIRECCIONES_FIJAS,
  )

  // ── Salidas ────────────────────────────────────────────────
  paso('Escribiendo resultados a disco')

  await guardarJSON(path.join(opciones.salida, 'notas.json'), resultado.notas)
  await guardarJSON(path.join(opciones.salida, 'redirects.json'), {
    generado: new Date().toISOString(),
    origen: opciones.origen,
    redirecciones,
  })

  const informe = armarInforme({
    resultado,
    redirecciones,
    enSeco: !opciones.escribir,
    origen: opciones.origen,
  })
  const rutaInforme = path.join(opciones.salida, 'informe.md')
  await mkdir(path.dirname(rutaInforme), { recursive: true })
  await writeFile(rutaInforme, informe, 'utf8')

  await sincronizarPendientes(
    bajadasArchivo,
    resultado.notas.filter((nota) => !nota.listaParaEscribir).map((nota) => nota.slug),
  )
  await sincronizarPendientes(
    altArchivo,
    resultado.imagenes.filter((imagen) => imagen.alt === '').map((imagen) => imagen.ruta),
  )

  detalle(`notas.json · redirects.json (${redirecciones.length} reglas) · informe.md`)
  detalle(`bajadas.json y alt.json: completar a mano y volver a correr`)

  // ── Las fotos ──────────────────────────────────────────────
  if (opciones.sinImagenes) {
    paso('--sin-imagenes: no se bajan los binarios')
  } else {
    paso(`Bajando ${resultado.imagenes.length} imágenes`)
    const nuevas = await bajarImagenes(resultado.imagenes, opciones.salida)
    detalle(nuevas === 0 ? 'todas ya estaban en disco' : `${nuevas} nuevas`)
  }

  // ── Resumen ────────────────────────────────────────────────
  paso('Resumen')
  for (const linea of resumenDeConsola(resultado, path.relative(process.cwd(), rutaInforme))) {
    detalle(linea)
  }

  if (!opciones.escribir) {
    console.log('\nCorrida en seco. Para escribir en Supabase: --escribir\n')
    return
  }

  await escribirEnSupabase(resultado.notas, resultado.imagenes, opciones)
  console.log('\nListo.\n')
}

principal().catch((error: unknown) => {
  console.error(`\n✖ ${(error as Error).message}\n`)
  process.exitCode = 1
})
