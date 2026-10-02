'use client'

import { darDeAltaAutor } from '@/actions/autor'
import { Aviso } from '@/components/admin/Aviso'
import { BarraFormulario } from '@/components/admin/BarraFormulario'
import { CampoTexto } from '@/components/admin/CampoTexto'
import { usarFormulario } from '@/components/admin/usarFormulario'
import { esquemaAltaDeAutor, type EntradaAltaDeAutor } from '@/lib/entidades/autor'
import { slugificar } from '@/lib/entidades/campos'

/**
 * El alta de una cuenta del panel.
 *
 * **Pide tres cosas y nada más**: el nombre con el que va a firmar, el mail al
 * que va la invitación y qué alcance tiene. La bio, la foto y los handles los
 * carga cada uno en su perfil cuando entra; pedirlos acá es escribir el perfil
 * de otra persona antes de que lo vea.
 *
 * **La dirección se muestra pero no se edita.** Es el slug de la página del
 * autor y lo deriva `slugificar()`, el mismo criterio que el resto del
 * proyecto. Mostrarlo evita la sorpresa de descubrir después cómo quedó.
 *
 * El rol es un `<select>` y no un par de radios por una razón de pantalla: son
 * dos opciones hoy, pero la explicación de cada una no entra al lado del
 * control, así que va debajo, en la ayuda, y el select deja la ayuda libre.
 */
interface Props {
  /** Para explicar quién puede qué, con el nombre de quien está mirando. */
  nombreDelEditor: string
}

const INICIAL: EntradaAltaDeAutor = { nombre: '', mail: '', rol: 'redactor' }

export function FormularioAutorNuevo({ nombreDelEditor }: Props) {
  const f = usarFormulario({
    inicial: INICIAL,
    esquema: esquemaAltaDeAutor,
    guardar: (datos) => darDeAltaAutor(datos),
    volverA: '/admin/autores',
  })

  const slug = slugificar(f.entrada.nombre)

  return (
    <div className="flex flex-col gap-5">
      <Aviso>
        Se le manda una invitación por mail. Entra con ese link, se pone una
        contraseña y cae en su perfil para completar la bio y la foto. Mientras
        no la acepte, la cuenta existe pero no puede entrar.
      </Aviso>

      <CampoTexto
        id="nombre"
        etiqueta="Nombre"
        valor={f.entrada.nombre}
        onCambio={(v) => f.cambiar('nombre', v)}
        error={f.errores.nombre}
        ayuda={
          slug === ''
            ? 'Como va a firmar cada nota: «Juana Pérez».'
            : `Como va a firmar cada nota. Su página va a ser /autor/${slug}.`
        }
      />

      <CampoTexto
        id="mail"
        etiqueta="Mail"
        valor={f.entrada.mail}
        onCambio={(v) => f.cambiar('mail', v)}
        error={f.errores.mail}
        ayuda="A donde va la invitación. Es con el que después entra al panel."
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="rol" className="meta text-text-muted">
          Qué puede hacer
        </label>

        <select
          id="rol"
          value={f.entrada.rol}
          onChange={(e) => f.cambiar('rol', e.target.value as EntradaAltaDeAutor['rol'])}
          aria-describedby="rol-ayuda"
          className="tactil w-full border border-border-control bg-bg-elevated px-3 py-2 font-display text-[0.95rem] outline-none focus-visible:border-accent-text"
        >
          <option value="redactor">Redactor: sólo sus propias notas</option>
          <option value="editor">Editor: todas las notas, y da de alta cuentas</option>
        </select>

        <p id="rol-ayuda" className="text-[0.8rem] text-text-muted">
          Los partidos, las jugadoras, las planillas y la tabla las carga
          cualquiera de los dos: el reparto es de las notas, que son lo que se
          firma. {nombreDelEditor} es editor, así que va a ver lo que escriba.
        </p>
      </div>

      <BarraFormulario
        aviso={f.aviso}
        ocupado={f.ocupado}
        onGuardar={f.enviar}
        volverA="/admin/autores"
        etiqueta="Dar de alta e invitar"
      />
    </div>
  )
}
