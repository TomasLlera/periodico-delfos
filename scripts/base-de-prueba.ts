/**
 * Llena un proyecto de Supabase **de prueba** con datos inventados.
 *
 *     pnpm tsx scripts/base-de-prueba.ts             # en seco: dice qué haría
 *     pnpm tsx scripts/base-de-prueba.ts --cargar    # escribe
 *
 * Es para correr las verificaciones de `docs/consultas.md` sin tocar la base
 * del medio: los `curl` de RLS, la prueba de carga, el build con datos. Lo que
 * carga está pensado para esas pruebas y no para verse lindo:
 *
 * - una nota de cada estado —publicada, borrador, programada— para comprobar
 *   que el visitante anónimo sólo ve la primera;
 * - un editor y un redactor, para comprobar que el redactor sólo ve lo suyo;
 * - una jugadora **menor de edad** con fecha de nacimiento, que es el caso de
 *   la consulta 6;
 * - un sponsor vigente y uno vencido, para la política `lectura_vigentes`;
 * - un registro en `social_posts`, que el anónimo no tiene que poder leer.
 *
 * **No corre si `BASE_DE_PRUEBA=true` no está en `.env.local`.** Las cuentas y
 * las notas que crea no se distinguen de las reales a primera vista, y
 * cargarlas en producción sería publicar notas inventadas. La variable no
 * existe en `.env.example` a propósito: hay que escribirla a mano en el
 * `.env.local` del proyecto de prueba.
 *
 * Es idempotente: los ids son fijos y todo es `upsert`, así que correrlo de
 * nuevo deja la base igual y les pone contraseña nueva a las dos cuentas.
 *
 * No reemplaza a `supabase/seed.sql`: ese trae el UUID de la cuenta real de
 * Charlie y falla en cualquier otro proyecto.
 */

import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database, TablesInsert } from '../src/lib/supabase/types'
import { cargarEnvLocal } from './env-local'

type Cliente = SupabaseClient<Database>

const CUENTAS = {
  editor: { mail: 'prueba-editor@periodicodelfos.com', nombre: 'Editora de Prueba', slug: 'editora-de-prueba' },
  redactor: { mail: 'prueba-redactor@periodicodelfos.com', nombre: 'Redactor de Prueba', slug: 'redactor-de-prueba' },
} as const

/** Ids fijos: es lo que hace idempotente al script y deja escribir los `curl` de antemano. */
const ID = {
  temporada: '00000000-0000-4000-a000-000000000001',
  aldosivi: '00000000-0000-4000-a000-000000000101',
  rivalA: '00000000-0000-4000-a000-000000000102',
  rivalB: '00000000-0000-4000-a000-000000000103',
  rivalC: '00000000-0000-4000-a000-000000000104',
  jugadoras: [
    '00000000-0000-4000-a000-000000000201',
    '00000000-0000-4000-a000-000000000202',
    '00000000-0000-4000-a000-000000000203',
    '00000000-0000-4000-a000-000000000204',
    '00000000-0000-4000-a000-000000000205',
    '00000000-0000-4000-a000-000000000206',
  ],
  jugado: '00000000-0000-4000-a000-000000000301',
  proximo: '00000000-0000-4000-a000-000000000302',
  notaPublicada: '00000000-0000-4000-a000-000000000401',
  notaAnalisis: '00000000-0000-4000-a000-000000000402',
  notaBorrador: '00000000-0000-4000-a000-000000000403',
  notaProgramada: '00000000-0000-4000-a000-000000000404',
  sponsorVigente: '00000000-0000-4000-a000-000000000501',
  sponsorVencido: '00000000-0000-4000-a000-000000000502',
} as const

const AYUDA = `
Llena un proyecto de Supabase de prueba con datos inventados.

  pnpm tsx scripts/base-de-prueba.ts            en seco: no escribe nada
  pnpm tsx scripts/base-de-prueba.ts --cargar   carga los datos y las cuentas

Necesita en .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y
BASE_DE_PRUEBA=true. Con --cargar guarda las claves de las dos cuentas en
.env.local (PRUEBA_EDITOR_* y PRUEBA_REDACTOR_*) y también como E2E_ADMIN_*,
para que ande la suite del panel.
`.trim()

function claveNueva(): string {
  return randomBytes(24).toString('base64url')
}

/** Mismo criterio que `usuario-e2e.ts`: reemplaza las claves, no apendea a ciegas. */
function guardarEnEnvLocal(raiz: string, claves: Record<string, string>): void {
  const archivo = path.resolve(raiz, '.env.local')
  const previo = existsSync(archivo) ? readFileSync(archivo, 'utf8') : ''
  const finDeLinea = previo.includes('\r\n') ? '\r\n' : '\n'

  const nombres = Object.keys(claves)
  const conservadas = previo
    .split(/\r?\n/)
    .filter((linea) => !nombres.some((clave) => new RegExp(`^\\s*${clave}\\s*=`).test(linea)))
    .filter((linea) => !linea.startsWith('# ── Base de prueba'))

  while (conservadas.length > 0 && conservadas[conservadas.length - 1]?.trim() === '') {
    conservadas.pop()
  }

  const bloque = [
    '',
    '# ── Base de prueba (scripts/base-de-prueba.ts) ──',
    ...nombres.map((clave) => `${clave}=${claves[clave]}`),
  ]

  writeFileSync(archivo, [...conservadas, ...bloque, ''].join(finDeLinea), 'utf8')
}

/** Crea la cuenta o le repone la clave. Devuelve el UUID de Auth. */
async function cuenta(supabase: Cliente, mail: string, clave: string): Promise<string> {
  const { data: lista, error: errorLista } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (errorLista) throw errorLista

  const existente = lista.users.find((u) => u.email?.toLowerCase() === mail)
  if (existente) {
    const { error } = await supabase.auth.admin.updateUserById(existente.id, { password: clave })
    if (error) throw error
    return existente.id
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: mail,
    password: clave,
    email_confirm: true,
  })
  if (error) throw error
  return data.user.id
}

async function upsert<T extends keyof Database['public']['Tables']>(
  supabase: Cliente,
  tabla: T,
  filas: TablesInsert<T>[],
  onConflict?: string,
): Promise<void> {
  // El cast es por cómo supabase-js tipa `from()` con una tabla genérica: con
  // un `T` concreto no hace falta, y repetir esta función por tabla no aporta.
  const { error } = await supabase
    .from(tabla)
    .upsert(filas as never, onConflict ? { onConflict } : undefined)
  if (error) throw new Error(`${tabla}: ${error.message}`)
  console.log(`  ${tabla}: ${filas.length}`)
}

/** Un documento TipTap mínimo: un párrafo. */
function cuerpo(texto: string): TablesInsert<'notas'>['cuerpo'] {
  return { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: texto }] }] }
}

function enDias(dias: number): string {
  return new Date(Date.now() + dias * 86_400_000).toISOString()
}

function fechaEnDias(dias: number): string {
  return enDias(dias).slice(0, 10)
}

async function cargar(supabase: Cliente, editorId: string, redactorId: string): Promise<void> {
  await upsert(supabase, 'autores', [
    { id: editorId, nombre: CUENTAS.editor.nombre, slug: CUENTAS.editor.slug, rol: 'editor' },
    { id: redactorId, nombre: CUENTAS.redactor.nombre, slug: CUENTAS.redactor.slug, rol: 'redactor' },
  ])

  await upsert(supabase, 'temporadas', [
    {
      id: ID.temporada,
      nombre: 'Primera B 2026',
      slug: 'primera-b-2026',
      division: 'Primera B',
      anio: 2026,
      zona: 'Zona A',
      activa: true,
    },
  ])

  await upsert(supabase, 'equipos', [
    { id: ID.aldosivi, nombre: 'Club Atlético Aldosivi', nombre_corto: 'Aldosivi', apodo: 'Tiburonas', slug: 'aldosivi', ciudad: 'Mar del Plata', es_aldosivi: true },
    { id: ID.rivalA, nombre: 'Club Atlético Ficticio', nombre_corto: 'Ficticio', slug: 'ficticio', ciudad: 'Tandil', es_aldosivi: false },
    { id: ID.rivalB, nombre: 'Sportivo Inventado', nombre_corto: 'Inventado', slug: 'inventado', ciudad: 'Necochea', es_aldosivi: false },
    { id: ID.rivalC, nombre: 'Deportivo de Prueba', nombre_corto: 'De Prueba', slug: 'de-prueba', ciudad: 'Balcarce', es_aldosivi: false },
  ])

  const [j1, j2, j3, j4, j5, j6] = ID.jugadoras
  await upsert(supabase, 'jugadoras', [
    { id: j1, nombre: 'Ana', apellido: 'Arquera', slug: 'ana-arquera', posicion: 'arquera', fecha_nacimiento: '1998-03-14', lugar_origen: 'Mar del Plata' },
    { id: j2, nombre: 'Bea', apellido: 'Defensa', slug: 'bea-defensa', posicion: 'defensora', fecha_nacimiento: '2001-07-02', lugar_origen: 'Batán' },
    { id: j3, nombre: 'Caro', apellido: 'Medio', slug: 'caro-medio', posicion: 'mediocampista', fecha_nacimiento: '1999-11-20', lugar_origen: 'Mar del Plata' },
    { id: j4, nombre: 'Dani', apellido: 'Punta', slug: 'dani-punta', posicion: 'delantera', fecha_nacimiento: '2000-01-30', lugar_origen: 'Miramar' },
    // La menor de edad de la consulta 6: el sitio sólo debería mostrar la edad.
    { id: j5, nombre: 'Eli', apellido: 'Juvenil', slug: 'eli-juvenil', posicion: 'delantera', fecha_nacimiento: '2010-05-12', lugar_origen: 'Sierra de los Padres' },
    { id: j6, nombre: 'Fer', apellido: 'Suplente', slug: 'fer-suplente', posicion: 'mediocampista', fecha_nacimiento: null, lugar_origen: null },
  ])

  await upsert(
    supabase,
    'plantel',
    ID.jugadoras.map((jugadora_id, i) => ({
      temporada_id: ID.temporada,
      jugadora_id,
      dorsal: i + 1,
      capitana: i === 2,
    })),
    'temporada_id,jugadora_id',
  )

  await upsert(supabase, 'partidos', [
    {
      id: ID.jugado,
      temporada_id: ID.temporada,
      fecha_numero: 1,
      fecha_hora: enDias(-7),
      equipo_local_id: ID.aldosivi,
      equipo_visitante_id: ID.rivalA,
      goles_local: 2,
      goles_visitante: 1,
      estado: 'finalizado',
      cancha: 'Estadio de Prueba',
      slug: 'fecha-1-aldosivi-ficticio-2026',
    },
    {
      id: ID.proximo,
      temporada_id: ID.temporada,
      fecha_numero: 2,
      fecha_hora: enDias(7),
      equipo_local_id: ID.rivalB,
      equipo_visitante_id: ID.aldosivi,
      estado: 'programado',
      slug: 'fecha-2-inventado-aldosivi-2026',
    },
  ])

  await upsert(
    supabase,
    'formaciones',
    [j1, j2, j3, j4, j5].map((jugadora_id, i) => ({
      partido_id: ID.jugado,
      jugadora_id,
      es_titular: i < 4,
      dorsal: i + 1,
    })),
    'partido_id,jugadora_id',
  )

  // Los eventos no tienen clave natural: se borran y se vuelven a escribir.
  const { error: errorBorrado } = await supabase.from('eventos').delete().eq('partido_id', ID.jugado)
  if (errorBorrado) throw new Error(`eventos: ${errorBorrado.message}`)
  await upsert(supabase, 'eventos', [
    { partido_id: ID.jugado, minuto: 12, tipo: 'gol', equipo_id: ID.aldosivi, jugadora_id: j4 },
    { partido_id: ID.jugado, minuto: 30, tipo: 'amarilla', equipo_id: ID.aldosivi, jugadora_id: j2 },
    { partido_id: ID.jugado, minuto: 55, tipo: 'gol', equipo_id: ID.rivalA, jugadora_nombre: 'Rival Goleadora' },
    { partido_id: ID.jugado, minuto: 70, tipo: 'cambio', equipo_id: ID.aldosivi, jugadora_id: j5, jugadora_sale_id: j3 },
    { partido_id: ID.jugado, minuto: 88, tipo: 'gol', equipo_id: ID.aldosivi, jugadora_id: j5 },
  ])

  const fila = (equipo_id: string, posicion: number, g: number, e: number, p: number, gf: number, gc: number) => ({
    temporada_id: ID.temporada,
    fecha_numero: 1,
    equipo_id,
    posicion,
    puntos: g * 3 + e,
    jugados: g + e + p,
    ganados: g,
    empatados: e,
    perdidos: p,
    goles_favor: gf,
    goles_contra: gc,
  })
  await upsert(
    supabase,
    'tabla_posiciones',
    [
      fila(ID.aldosivi, 1, 1, 0, 0, 2, 1),
      fila(ID.rivalB, 2, 0, 1, 0, 1, 1),
      fila(ID.rivalC, 3, 0, 1, 0, 1, 1),
      fila(ID.rivalA, 4, 0, 0, 1, 1, 2),
    ],
    'temporada_id,fecha_numero,equipo_id',
  )

  await upsert(supabase, 'notas', [
    {
      id: ID.notaPublicada,
      titulo: 'Aldosivi 2-1 Ficticio: las Tiburonas arrancaron ganando',
      slug: 'aldosivi-2-1-ficticio',
      bajada: 'Crónica inventada para la base de prueba.',
      cuerpo: cuerpo('Texto de prueba de la crónica. Los goles salen de la planilla, no de acá.'),
      categoria: 'cronica',
      temporada_id: ID.temporada,
      partido_id: ID.jugado,
      autor_id: editorId,
      estado: 'publicada',
      publicada_en: enDias(-6),
      destacada: true,
    },
    {
      id: ID.notaAnalisis,
      titulo: 'Análisis: cómo llega Inventado',
      slug: 'analisis-como-llega-inventado',
      bajada: 'Análisis inventado, escrito por la cuenta de redactor.',
      cuerpo: cuerpo('Texto de prueba del análisis.'),
      categoria: 'analisis',
      temporada_id: ID.temporada,
      partido_id: ID.proximo,
      autor_id: redactorId,
      estado: 'publicada',
      publicada_en: enDias(-1),
    },
    {
      id: ID.notaBorrador,
      titulo: 'BORRADOR: esto no tiene que verse en el sitio',
      slug: 'borrador-secreto',
      bajada: 'Si un visitante anónimo lee esto, RLS está mal.',
      cuerpo: cuerpo('Borrador de prueba.'),
      categoria: 'cronica',
      autor_id: editorId,
      estado: 'borrador',
    },
    {
      id: ID.notaProgramada,
      titulo: 'PROGRAMADA: sale dentro de un mes',
      slug: 'programada-futura',
      bajada: 'Si un visitante anónimo lee esto antes de la fecha, RLS está mal.',
      cuerpo: cuerpo('Nota programada de prueba.'),
      categoria: 'institucional',
      autor_id: editorId,
      estado: 'programada',
      publicar_en: enDias(30),
    },
  ])

  await upsert(
    supabase,
    'social_posts',
    [
      {
        nota_id: ID.notaPublicada,
        nota_slug: 'aldosivi-2-1-ficticio',
        platform: 'facebook',
        status: 'success',
        external_post_id: 'simulado-facebook-aldosivi-2-1-ficticio',
        attempts: 1,
      },
    ],
    'nota_id,platform',
  )

  await upsert(supabase, 'sponsors', [
    {
      id: ID.sponsorVigente,
      nombre: 'Panadería de Prueba',
      imagen_url: 'https://placehold.co/600x120.png',
      alt: 'Banner de Panadería de Prueba',
      ubicacion: 'portada_arriba',
      desde: fechaEnDias(-30),
      hasta: fechaEnDias(30),
    },
    {
      id: ID.sponsorVencido,
      nombre: 'Sponsor Vencido',
      imagen_url: 'https://placehold.co/600x120.png',
      alt: 'Banner de un sponsor que ya terminó',
      ubicacion: 'nota_lateral',
      desde: fechaEnDias(-90),
      hasta: fechaEnDias(-60),
    },
  ])
}

async function main(): Promise<void> {
  if (process.argv.includes('--ayuda')) {
    console.log(AYUDA)
    return
  }

  const raiz = process.cwd()
  cargarEnvLocal(raiz)

  if (process.env.BASE_DE_PRUEBA !== 'true') {
    throw new Error(
      'Falta BASE_DE_PRUEBA=true en .env.local. Este script carga datos inventados y no se corre contra la base del medio.',
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const servicio = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !servicio) {
    throw new Error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local.')
  }

  console.log(`Base: ${url}`)

  if (!process.argv.includes('--cargar')) {
    console.log('En seco: no se escribió nada. Con --cargar crea las cuentas y los datos.')
    return
  }

  // Service role: crear cuentas y escribir `autores` no lo permite RLS a nadie
  // que todavía no sea autor.
  const supabase = createClient<Database>(url, servicio, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const claveEditor = claveNueva()
  const claveRedactor = claveNueva()
  const editorId = await cuenta(supabase, CUENTAS.editor.mail, claveEditor)
  const redactorId = await cuenta(supabase, CUENTAS.redactor.mail, claveRedactor)
  console.log('Cuentas listas. Cargando:')

  await cargar(supabase, editorId, redactorId)

  guardarEnEnvLocal(raiz, {
    PRUEBA_EDITOR_EMAIL: CUENTAS.editor.mail,
    PRUEBA_EDITOR_PASSWORD: claveEditor,
    PRUEBA_REDACTOR_EMAIL: CUENTAS.redactor.mail,
    PRUEBA_REDACTOR_PASSWORD: claveRedactor,
    E2E_ADMIN_EMAIL: CUENTAS.editor.mail,
    E2E_ADMIN_PASSWORD: claveEditor,
  })
  console.log('\nLas claves de las dos cuentas quedaron en .env.local (PRUEBA_* y E2E_ADMIN_*).')
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
