'use server'

import { revalidatePath } from 'next/cache'
import { esquemaAltaDeAutor, esquemaAutor, handleLimpio } from '@/lib/entidades/autor'
import { errorDeBase, slugificar, type ResultadoEntidad } from '@/lib/entidades/campos'
import { urlDelSitio } from '@/lib/sitio'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAutorDeLaSesion } from '@/lib/supabase/queries/autores'
import { createClient } from '@/lib/supabase/server'
import type { RolDeAutor } from '@/types'

/**
 * El perfil del autor de la sesión.
 *
 * **Edita siempre la fila de quien está logueado, y el id no es un parámetro.**
 * Es la diferencia con el resto de los Server Actions del panel: equipos,
 * jugadoras y partidos reciben el id de lo que se edita, pero un perfil que
 * acepta un id ajeno es una pantalla para editar el perfil de otro. Mientras el
 * medio lo escriba una sola persona daría igual, y justamente por eso conviene
 * cerrarlo ahora: el pedido de Charlie incluye dar de alta colaboradores más
 * adelante.
 *
 * Con la sesión del autor y no con la service role, como todo el panel: lo que
 * habilita la escritura es RLS sobre `autores` en `0008_rls.sql`.
 *
 * Revalida las rutas donde sale la firma. La caja de autor va al pie de cada
 * nota, así que cambiar la bio sin revalidar deja la vieja hasta que venza el
 * ISR de 60s en cada una.
 */
export async function guardarPerfil(datos: unknown): Promise<ResultadoEntidad> {
  const autor = await getAutorDeLaSesion()
  if (!autor) return { error: 'Se cerró la sesión. Entrá de nuevo.' }

  const validado = esquemaAutor.safeParse(datos)
  if (!validado.success) {
    return { error: validado.error.issues[0]?.message ?? 'Hay un campo mal cargado.' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('autores')
    .update({
      nombre: validado.data.nombre,
      bio: validado.data.bio,
      foto_url: validado.data.foto_url,
      instagram: handleLimpio(validado.data.instagram),
      x_handle: handleLimpio(validado.data.x_handle),
    })
    .eq('id', autor.id)

  if (error) return { error: errorDeBase(error, 'Ese nombre ya está usado por otra cuenta.') }

  revalidatePath('/', 'layout')

  return {}
}

/**
 * Da de alta una cuenta del panel y le manda la invitación.
 *
 * Es lo que pidió Charlie: hasta ahora un autor nacía creando el usuario a mano
 * en el panel de Supabase Auth y después insertando la fila de `autores` con
 * SQL, con el UUID copiado de una pantalla a la otra.
 *
 * **Son dos mitades y cada una va con el cliente que le corresponde**, que es
 * la decisión del action:
 *
 * - El usuario de Auth, con la service role. Crear usuarios es una operación de
 *   administrador y no hay otra forma.
 * - La fila de `autores`, **con la sesión de quien está dando el alta**. Así la
 *   regla "sólo un editor da de alta" la sostiene RLS (`gestion_de_autores`,
 *   `0014_roles_de_autor.sql`) y no sólo el `if` de abajo. Con la service role
 *   funcionaría igual y la única defensa sería este archivo.
 *
 * **Si la fila falla, se borra el usuario que se acababa de crear.** Un usuario
 * de Auth sin fila en `autores` es una cuenta que entra al login, pasa la
 * contraseña y después rebota del panel sin decir por qué: el peor de los dos
 * estados a medias. Si el usuario ya existía en Auth no se lo toca, que es el
 * caso de una cuenta que entró antes de que existiera esta pantalla.
 *
 * **La invitación necesita dos cosas configuradas en Supabase**, y si no están
 * el alta falla con el mensaje que devuelva Auth: el mail de salida
 * (Authentication → Emails) y el template de Invite apuntando a
 * `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`, por la
 * misma razón que el de Magic Link —ver `src/app/auth/confirm/route.ts`—.
 */
export async function darDeAltaAutor(datos: unknown): Promise<ResultadoEntidad> {
  const quienDaDeAlta = await getAutorDeLaSesion()
  if (!quienDaDeAlta) return { error: 'Se cerró la sesión. Entrá de nuevo.' }
  if (quienDaDeAlta.rol !== 'editor') {
    return { error: 'Sólo un editor puede dar de alta una cuenta.' }
  }

  const validado = esquemaAltaDeAutor.safeParse(datos)
  if (!validado.success) {
    return { error: validado.error.issues[0]?.message ?? 'Hay un campo mal cargado.' }
  }

  const { nombre, mail, rol } = validado.data

  const slug = slugificar(nombre)
  if (slug === '') {
    return { error: 'Ese nombre no deja armar una dirección. Usá letras y números.' }
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return { error: 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.' }
  }

  const yaEnAuth = await buscarEnAuth(admin, mail)

  let id: string
  let recienCreado = false

  if (yaEnAuth) {
    id = yaEnAuth
  } else {
    const { data, error } = await admin.auth.admin.inviteUserByEmail(mail, {
      redirectTo: `${urlDelSitio()}/auth/confirm?volver=${encodeURIComponent('/admin/perfil')}`,
    })

    // El mensaje de Auth se pasa tal cual: los que salen de acá son "el mail de
    // salida no está configurado" y "ya hay un usuario con ese mail", y
    // taparlos con una frase genérica deja a alguien mirando una pantalla que
    // no dice qué arreglar.
    if (error || !data.user) {
      return { error: `No se pudo invitar: ${error?.message ?? 'Auth no devolvió el usuario'}` }
    }

    id = data.user.id
    recienCreado = true
  }

  const supabase = await createClient()
  const { error } = await supabase.from('autores').insert({ id, nombre, slug, rol })

  if (error) {
    if (recienCreado) await admin.auth.admin.deleteUser(id)
    return { error: errorDeBase(error, 'Ya hay un autor con ese nombre.') }
  }

  revalidatePath('/admin/autores')

  return { id }
}

/**
 * El id en Auth de un mail, o `null`.
 *
 * `listUsers` y no una consulta por mail porque la API de administración no
 * tiene búsqueda por mail: es la misma vuelta que da `scripts/usuario-e2e.ts`.
 * Con una redacción de tres personas la primera página alcanza y sobra.
 */
async function buscarEnAuth(
  admin: ReturnType<typeof createAdminClient>,
  mail: string,
): Promise<string | null> {
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const usuario = data?.users.find((u) => u.email?.toLowerCase() === mail.toLowerCase())
  return usuario?.id ?? null
}

/**
 * Cambia el rol de una cuenta.
 *
 * El `if` de acá es comodidad: lo que de verdad lo impide es el trigger
 * `autores_rol_solo_por_editor` de la 0014, porque un Server Action es una ruta
 * HTTP y esta columna decide quién ve las notas de los demás.
 *
 * **Nadie se saca a sí mismo el rol de editor.** No es una regla de seguridad
 * —podría volver a pedírselo a otro editor— sino de no quedar encerrado: con un
 * solo editor, el que se degrada deja el medio sin nadie que pueda dar de alta
 * una cuenta ni editar las notas de otro.
 */
export async function cambiarRolDeAutor(id: string, rol: RolDeAutor): Promise<ResultadoEntidad> {
  const quienCambia = await getAutorDeLaSesion()
  if (!quienCambia) return { error: 'Se cerró la sesión. Entrá de nuevo.' }
  if (quienCambia.rol !== 'editor') return { error: 'Sólo un editor puede cambiar un rol.' }
  if (quienCambia.id === id && rol !== 'editor') {
    return { error: 'No podés quitarte el rol de editor a vos mismo.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('autores').update({ rol }).eq('id', id)

  if (error) return { error: 'No se pudo cambiar el rol.' }

  revalidatePath('/admin/autores')

  return {}
}
