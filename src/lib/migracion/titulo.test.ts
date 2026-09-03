/**
 * Los casos de este archivo no son inventados: son las siete formas del sufijo
 * que aparecen en las 70 notas de periodicodelfos.com, copiadas de
 * `/wp-json/wp/v2/posts`. Si alguna deja de pasar, es que se rompió el recorte
 * de un título real.
 */

import { describe, expect, it } from 'vitest'
import { limpiarTitulo, slugDeTemporada } from '@/lib/migracion/titulo'

describe('limpiarTitulo', () => {
  it('saca el sufijo común y guarda fecha y temporada', () => {
    const resultado = limpiarTitulo(
      'Defensa y Justicia 2-1 Tiburonas: Fecha N°12 &#8211; Aldosivi Femenino en la Primera B 2026',
    )

    expect(resultado.titulo).toBe('Defensa y Justicia 2-1 Tiburonas')
    expect(resultado.fechaNumero).toBe(12)
    expect(resultado.etapa).toBeNull()
    expect(resultado.temporada).toEqual({
      nombre: 'Primera B 2026',
      slug: 'primera-b-2026',
      division: 'Primera B',
      anio: 2026,
    })
  })

  it('deja el título original con las entidades ya resueltas', () => {
    const resultado = limpiarTitulo(
      'Tiburonas 0-1 All Boys: Fecha N°11 &#8211; Aldosivi Femenino en la Primera B 2026',
    )

    expect(resultado.original).toBe(
      'Tiburonas 0-1 All Boys: Fecha N°11 – Aldosivi Femenino en la Primera B 2026',
    )
  })

  it('no confunde la raya del marcador con el separador del sufijo', () => {
    // El caso que rompe cualquier `split('–')`: hay tres rayas en el título.
    const resultado = limpiarTitulo(
      'Defensores de Belgrano 2 &#8211; 1 Tiburonas: Fecha N°10 &#8211; Aldosivi Femenino en la Primera B 2026',
    )

    expect(resultado.titulo).toBe('Defensores de Belgrano 2 – 1 Tiburonas')
    expect(resultado.fechaNumero).toBe(10)
  })

  it('tolera el espacio entre N° y el número', () => {
    const resultado = limpiarTitulo(
      'Nueva Chicago 2-5 Tiburonas: Fecha N° 4 &#8211; Aldosivi Femenino en la Primera C 2024',
    )

    expect(resultado.titulo).toBe('Nueva Chicago 2-5 Tiburonas')
    expect(resultado.fechaNumero).toBe(4)
    expect(resultado.temporada?.slug).toBe('primera-c-2024')
  })

  it('tolera que falte la raya antes de "Aldosivi"', () => {
    const resultado = limpiarTitulo(
      'Tiburonas 1-0 Quilmes: Fecha N°5 Aldosivi Femenino en la Primera C 2023',
    )

    expect(resultado.titulo).toBe('Tiburonas 1-0 Quilmes')
    expect(resultado.fechaNumero).toBe(5)
    expect(resultado.temporada?.anio).toBe(2023)
  })

  it('tolera que no haya número de fecha', () => {
    const resultado = limpiarTitulo(
      'Tiburonas 1-3 Almirante Brown: Aldosivi Femenino en la Primera C 2023',
    )

    expect(resultado.titulo).toBe('Tiburonas 1-3 Almirante Brown')
    expect(resultado.fechaNumero).toBeNull()
    expect(resultado.etapa).toBeNull()
    expect(resultado.temporada?.slug).toBe('primera-c-2023')
  })

  it('separa la etapa del número de fecha', () => {
    const resultado = limpiarTitulo(
      'Almirante Brown &#8211; Tiburonas Campeonas: Postergado Fecha N°22 &#8211; Aldosivi Femenino en la Primera C 2024',
    )

    expect(resultado.titulo).toBe('Almirante Brown – Tiburonas Campeonas')
    expect(resultado.fechaNumero).toBe(22)
    expect(resultado.etapa).toBe('Postergado')
  })

  it('guarda la etapa de los playoffs, que no tiene número', () => {
    const semis = limpiarTitulo(
      'Tiburonas 7-0 Laferrere: Semifinales &#8211; Aldosivi Femenino en la Primera B 2023',
    )
    expect(semis.titulo).toBe('Tiburonas 7-0 Laferrere')
    expect(semis.etapa).toBe('Semifinales')
    expect(semis.fechaNumero).toBeNull()

    const cuartos = limpiarTitulo(
      'Tiburonas 1-0 Quilmes: Cuartos de Final &#8211; Aldosivi Femenino en la Primera C 2023',
    )
    expect(cuartos.titulo).toBe('Tiburonas 1-0 Quilmes')
    expect(cuartos.etapa).toBe('Cuartos de Final')
  })

  it('reconoce el sufijo corto, sin la marca "Aldosivi Femenino en la"', () => {
    const resultado = limpiarTitulo(
      '¡Campaña histórica de las Tiburonas! &#8211; Primera C 2024',
    )

    expect(resultado.titulo).toBe('¡Campaña histórica de las Tiburonas!')
    expect(resultado.temporada?.slug).toBe('primera-c-2024')
  })

  it('deja intacto un título sin sufijo', () => {
    const resultado = limpiarTitulo('Desafío mayúsculo para las Tiburonas en el Gigante de Arroyito')

    expect(resultado.titulo).toBe('Desafío mayúsculo para las Tiburonas en el Gigante de Arroyito')
    expect(resultado.temporada).toBeNull()
    expect(resultado.fechaNumero).toBeNull()
  })

  it('no recorta un título que sólo menciona el torneo al pasar', () => {
    // Sin un separador antes de "Primera" no hay sufijo que sacar.
    const resultado = limpiarTitulo('Las Tiburonas y el ascenso a la Primera B 2026')

    expect(resultado.titulo).toBe('Las Tiburonas y el ascenso a la Primera B 2026')
    expect(resultado.temporada).toBeNull()
  })

  it('normaliza los espacios de más', () => {
    const resultado = limpiarTitulo('  Tiburonas   2-0    Chacarita : Fecha N°4 – Aldosivi Femenino en la Primera C 2024  ')

    expect(resultado.titulo).toBe('Tiburonas 2-0 Chacarita')
  })
})

describe('slugDeTemporada', () => {
  it('arma el slug que usa la tabla temporadas', () => {
    expect(slugDeTemporada('Primera B', 2026)).toBe('primera-b-2026')
    expect(slugDeTemporada('Primera C', 2024)).toBe('primera-c-2024')
  })
})
