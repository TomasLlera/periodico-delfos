import { describe, expect, it } from 'vitest'
import { esquemaAltaDeAutor, esquemaAutor, handleLimpio } from '@/lib/entidades/autor'

describe('handleLimpio', () => {
  it('saca la arroba, que es como se copia un handle', () => {
    expect(handleLimpio('@periodicodelfos')).toBe('periodicodelfos')
  })

  it('saca la URL entera, que es lo que da el boton Compartir', () => {
    expect(handleLimpio('https://instagram.com/periodicodelfos')).toBe('periodicodelfos')
    expect(handleLimpio('https://www.x.com/delfos/')).toBe('delfos')
    expect(handleLimpio('twitter.com/delfos')).toBe('delfos')
  })

  it('deja null lo vacio, para no guardar un string vacio en una columna nullable', () => {
    expect(handleLimpio('')).toBeNull()
    expect(handleLimpio('   ')).toBeNull()
    expect(handleLimpio('@')).toBeNull()
    expect(handleLimpio(null)).toBeNull()
    expect(handleLimpio(undefined)).toBeNull()
  })

  it('deja intacto un handle que ya esta limpio', () => {
    expect(handleLimpio('charlieredondo')).toBe('charlieredondo')
  })
})

describe('esquemaAutor', () => {
  it('exige el nombre: es lo que firma cada nota', () => {
    expect(esquemaAutor.safeParse({ nombre: '' }).success).toBe(false)
    expect(esquemaAutor.safeParse({ nombre: '   ' }).success).toBe(false)
  })

  it('acepta un perfil con los opcionales vacios, que es lo que manda el formulario', () => {
    const r = esquemaAutor.safeParse({
      nombre: 'Charlie Redondo',
      bio: '',
      foto_url: '',
      instagram: '',
      x_handle: '',
    })

    expect(r.success).toBe(true)
    // La cadena vacia del formulario entra como null, no como ''.
    if (r.success) expect(r.data.bio).toBeNull()
  })
})

describe('esquemaAltaDeAutor', () => {
  const alta = { nombre: 'Juana Perez', mail: 'juana@ejemplo.com', rol: 'redactor' }

  it('acepta un alta completa', () => {
    expect(esquemaAltaDeAutor.safeParse(alta).success).toBe(true)
  })

  it('exige el nombre y el mail', () => {
    expect(esquemaAltaDeAutor.safeParse({ ...alta, nombre: '  ' }).success).toBe(false)
    expect(esquemaAltaDeAutor.safeParse({ ...alta, mail: '' }).success).toBe(false)
  })

  it('un campo de mail vacio dice que falta, no que esta mal escrito', () => {
    const r = esquemaAltaDeAutor.safeParse({ ...alta, mail: '   ' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toContain('obligatorio')
  })

  it('rechaza un mail sin forma de mail', () => {
    expect(esquemaAltaDeAutor.safeParse({ ...alta, mail: 'juana' }).success).toBe(false)
    expect(esquemaAltaDeAutor.safeParse({ ...alta, mail: 'juana@' }).success).toBe(false)
  })

  it('recorta el mail, que es lo que deja un copiar y pegar', () => {
    const r = esquemaAltaDeAutor.safeParse({ ...alta, mail: '  juana@ejemplo.com ' })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.mail).toBe('juana@ejemplo.com')
  })

  it('solo acepta los dos roles que existen', () => {
    expect(esquemaAltaDeAutor.safeParse({ ...alta, rol: 'editor' }).success).toBe(true)
    expect(esquemaAltaDeAutor.safeParse({ ...alta, rol: 'admin' }).success).toBe(false)
    expect(esquemaAltaDeAutor.safeParse({ ...alta, rol: '' }).success).toBe(false)
  })
})
