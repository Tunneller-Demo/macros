import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { abrirApp, opcion, recorrerAsistente, responderHastaLaActividad, type SeisDatos, type Usuario } from '@/test/recorrer'

const mujerDe35: Omit<SeisDatos, 'objetivo'> = {
  sexo: 'Mujer',
  edad: '35',
  peso: '65',
  talla: '165',
  actividad: 'Sedentaria',
}

function pregunta(texto: string) {
  return screen.getByRole('heading', { name: texto })
}

function seguir() {
  return screen.getByRole('button', { name: 'Seguir' })
}

function atras() {
  return screen.getByRole('button', { name: 'Atrás' })
}

function campo() {
  return screen.getByRole('textbox')
}

function macro(nombre: string) {
  const fila = screen.getAllByRole('listitem').find((item) => within(item).queryByText(nombre))
  if (!fila) throw new Error(`No se ve el macro ${nombre}`)
  return within(fila)
}

async function hastaLaEdad(user: Usuario) {
  await user.click(opcion('Bajar'))
  await user.click(opcion('Mujer'))
}

function hastaLaActividad(user: Usuario) {
  return responderHastaLaActividad(user, { ...mujerDe35, objetivo: 'Bajar' })
}

describe('Asistente', () => {
  it('hace las seis preguntas en orden, una por pantalla, con su progreso', async () => {
    const user = abrirApp()

    expect(screen.getByText('Macros')).toBeVisible()
    expect(pregunta('¿Qué quieres hacer con tu peso?')).toBeVisible()
    expect(screen.getByText('1 de 6')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')

    await user.click(opcion('Bajar'))
    expect(pregunta('¿Cuál es tu sexo?')).toBeVisible()
    expect(screen.getByText('2 de 6')).toBeVisible()
    expect(screen.queryByRole('heading', { name: '¿Qué quieres hacer con tu peso?' })).not.toBeInTheDocument()

    await user.click(opcion('Mujer'))
    expect(pregunta('¿Cuántos años tienes?')).toBeVisible()
    expect(screen.getByText('3 de 6')).toBeVisible()

    await user.type(campo(), '35')
    await user.click(seguir())
    expect(pregunta('¿Cuánto pesas?')).toBeVisible()
    expect(screen.getByText('4 de 6')).toBeVisible()

    await user.type(campo(), '65')
    await user.click(seguir())
    expect(pregunta('¿Cuánto mides?')).toBeVisible()
    expect(screen.getByText('5 de 6')).toBeVisible()

    await user.type(campo(), '165')
    await user.click(seguir())
    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
    expect(screen.getByText('6 de 6')).toBeVisible()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '6')
  })

  it('ofrece Mujer y Hombre y explica por qué pregunta el sexo', async () => {
    const user = abrirApp()
    await user.click(opcion('Bajar'))

    expect(screen.getAllByRole('radio')).toHaveLength(2)
    expect(opcion('Mujer')).toBeVisible()
    expect(opcion('Hombre')).toBeVisible()
    expect(screen.getByText('Se usa solo porque la fórmula lo requiere')).toBeVisible()
  })

  it('describe cada nivel de actividad por la vida diaria', async () => {
    const user = abrirApp()
    await hastaLaActividad(user)

    expect(opcion('Sedentaria')).toHaveTextContent('Trabajo sentado y poco movimiento')
    expect(opcion('Moderada')).toHaveTextContent('Caminas a diario o trabajas de pie')
    expect(opcion('Activa')).toHaveTextContent('Trabajo físico o ejercicio habitual')
    expect(opcion('Muy activa')).toHaveTextContent('Trabajo duro o entrenamiento intenso casi a diario')
  })

  it('en la última pregunta elegir no avanza y Seguir pasa a «Ver mi plan»', async () => {
    const user = abrirApp()
    await hastaLaActividad(user)

    await user.click(opcion('Moderada'))

    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
    expect(opcion('Moderada')).toBeChecked()
    expect(screen.queryByRole('button', { name: 'Seguir' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver mi plan' })).toBeVisible()
  })

  it('Atrás vuelve a la pregunta anterior sin perder lo escrito', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)
    await user.type(campo(), '35')
    await user.click(seguir())
    await user.type(campo(), '65')

    await user.click(atras())
    expect(pregunta('¿Cuántos años tienes?')).toBeVisible()
    expect(campo()).toHaveValue('35')

    await user.click(atras())
    expect(pregunta('¿Cuál es tu sexo?')).toBeVisible()
    expect(opcion('Mujer')).toBeChecked()

    await user.click(opcion('Mujer'))
    await user.click(seguir())
    expect(pregunta('¿Cuánto pesas?')).toBeVisible()
    expect(campo()).toHaveValue('65')
  })

  it('volver a elegir la opción ya marcada también avanza', async () => {
    const user = abrirApp()
    await user.click(opcion('Subir'))
    await user.click(atras())

    await user.click(opcion('Subir'))

    expect(pregunta('¿Cuál es tu sexo?')).toBeVisible()
  })

  it('Seguir se puede pulsar siempre, pero sin dato no avanza', async () => {
    const user = abrirApp()
    await user.click(seguir())
    expect(pregunta('¿Qué quieres hacer con tu peso?')).toBeVisible()

    await hastaLaEdad(user)
    expect(seguir()).toBeEnabled()
    await user.click(seguir())
    expect(pregunta('¿Cuántos años tienes?')).toBeVisible()
  })
})

describe('Resultados', () => {
  it('muestra las calorías objetivo con el metabolismo en reposo y el gasto diario debajo', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    expect(screen.getByRole('heading', { name: 'Tus calorías objetivo' })).toBeVisible()
    expect(screen.getByText('1383')).toBeVisible()
    expect(screen.getByText(/Metabolismo en reposo/)).toHaveTextContent(
      /Metabolismo en reposo: 1345 kcal.*Gasto diario: 1883 kcal/,
    )
  })

  it.each([
    ['Mantener', '1883'],
    ['Subir', '2283'],
  ] as const)('con objetivo de %s, las calorías objetivo son %s', async (objetivo, calorias) => {
    await recorrerAsistente({ ...mujerDe35, objetivo })

    expect(screen.getByText(calorias)).toBeVisible()
    expect(screen.getByText('1345 kcal')).toBeVisible()
    expect(screen.getByText('1883 kcal')).toBeVisible()
  })

  it.each([
    [{ ...mujerDe35, objetivo: 'Mantener', sexo: 'Hombre' }, '1511 kcal', '2116 kcal'],
    [{ ...mujerDe35, objetivo: 'Mantener', actividad: 'Moderada' }, '1345 kcal', '2152 kcal'],
    [{ ...mujerDe35, objetivo: 'Mantener', actividad: 'Activa' }, '1345 kcal', '2421 kcal'],
    [{ ...mujerDe35, objetivo: 'Mantener', actividad: 'Muy activa' }, '1345 kcal', '2691 kcal'],
  ] as [SeisDatos, string, string][])('calcula según el sexo y el nivel de actividad: %o', async (datos, reposo, gasto) => {
    await recorrerAsistente(datos)

    expect(screen.getByText(reposo)).toBeVisible()
    expect(screen.getByText(gasto)).toBeVisible()
  })
})

describe('Macros del día', () => {
  type Cifras = [gramos: string, porcentaje: string]

  const hombreDe150Kg: SeisDatos = {
    objetivo: 'Bajar',
    sexo: 'Hombre',
    edad: '40',
    peso: '150',
    talla: '180',
    actividad: 'Sedentaria',
  }

  function comprobarMacro(nombre: string, gramos: string, porcentaje: string) {
    expect(macro(nombre).getByText(gramos)).toBeVisible()
    expect(macro(nombre).getByText(porcentaje)).toBeVisible()
  }

  it('muestra una tarjeta con una fila por macro, en orden', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    expect(screen.getByRole('heading', { name: 'Tus macros del día' })).toBeVisible()
    const filas = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(filas).toEqual([
      expect.stringContaining('Proteína'),
      expect.stringContaining('Grasa'),
      expect.stringContaining('Carbohidratos'),
    ])
  })

  it.each([
    ['Bajar', ['117 g', '34 %'], ['46 g', '30 %'], ['125 g', '36 %']],
    ['Mantener', ['91 g', '19 %'], ['63 g', '30 %'], ['239 g', '51 %']],
    ['Subir', ['104 g', '18 %'], ['76 g', '30 %'], ['296 g', '52 %']],
  ] as [SeisDatos['objetivo'], Cifras, Cifras, Cifras][])('con objetivo de %s, reparte los macros', async (objetivo, proteina, grasa, carbohidratos) => {
    await recorrerAsistente({ ...mujerDe35, objetivo })

    comprobarMacro('Proteína', ...proteina)
    comprobarMacro('Grasa', ...grasa)
    comprobarMacro('Carbohidratos', ...carbohidratos)
  })

  it('limita la proteína al 35 % y los carbohidratos siguen siendo el resto', async () => {
    await recorrerAsistente(hombreDe150Kg)

    expect(screen.getByText('2902')).toBeVisible()
    comprobarMacro('Proteína', '254 g', '35 %')
    comprobarMacro('Grasa', '97 g', '30 %')
    comprobarMacro('Carbohidratos', '254 g', '35 %')
  })

  it('el tope de proteína vale para cualquier objetivo', async () => {
    await recorrerAsistente({
      objetivo: 'Mantener',
      sexo: 'Mujer',
      edad: '99',
      peso: '150',
      talla: '130',
      actividad: 'Sedentaria',
    })

    comprobarMacro('Proteína', '203 g', '35 %')
  })

  it.each([
    [{ ...mujerDe35, objetivo: 'Bajar' }],
    [{ ...mujerDe35, objetivo: 'Mantener' }],
    [{ ...mujerDe35, objetivo: 'Subir' }],
    [hombreDe150Kg],
    // 12,5 % y 57,5 %: redondeados por separado sumarían 101.
    [{ objetivo: 'Mantener', sexo: 'Mujer', edad: '18', peso: '42', talla: '188', actividad: 'Sedentaria' }],
  ] as [SeisDatos][])('los porcentajes suman 100: %o', async (datos) => {
    await recorrerAsistente(datos)

    const porcentajes = screen.getAllByText(/^\d+ %$/).map((cifra) => Number.parseInt(cifra.textContent))
    expect(porcentajes).toHaveLength(3)
    expect(porcentajes.reduce((suma, porcentaje) => suma + porcentaje)).toBe(100)
  })

  it('el reparto no se puede modificar', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    for (const control of ['textbox', 'spinbutton', 'slider', 'radio', 'checkbox', 'combobox']) {
      expect(screen.queryByRole(control)).not.toBeInTheDocument()
    }
    expect(within(screen.getByRole('list')).queryByRole('button')).not.toBeInTheDocument()
  })

  it('oculta el plato a los lectores de pantalla, que leen la lista', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('list')).toBeVisible()
  })
})

describe('Reglas de protección', () => {
  const MENSAJE_BAJO_PESO =
    'Con tu peso y tu talla no proponemos bajar: estas son las calorías que lo mantienen. Si quieres perder peso, consúltalo con un profesional sanitario.'
  const MENSAJE_GASTO_BAJO =
    'Tu gasto diario ya es bajo, así que no proponemos recortarlo: estas son las calorías que mantienen tu peso.'
  const MENSAJE_SUELO = 'Hemos limitado el recorte para no proponerte menos de 1200 kcal al día.'
  const MENSAJES = [MENSAJE_BAJO_PESO, MENSAJE_GASTO_BAJO, MENSAJE_SUELO]

  function paraBajar(sexo: SeisDatos['sexo'], edad: string, peso: string, talla: string, actividad: SeisDatos['actividad'] = 'Sedentaria'): SeisDatos {
    return { objetivo: 'Bajar', sexo, edad, peso, talla, actividad }
  }

  function comprobarMensajes(visible: string | null) {
    for (const mensaje of MENSAJES) {
      if (mensaje === visible) expect(screen.getByText(mensaje)).toBeVisible()
      else expect(screen.queryByText(mensaje)).not.toBeInTheDocument()
    }
  }

  const bajoPeso = paraBajar('Mujer', '25', '40', '165', 'Muy activa')

  it.each([
    [bajoPeso, '2291', '2291 kcal', MENSAJE_BAJO_PESO, '56 g', '76 g', '345 g'],
    [paraBajar('Mujer', '85', '45', '150'), '1122', '1122 kcal', MENSAJE_GASTO_BAJO, '81 g', '37 g', '115 g'],
    [paraBajar('Mujer', '40', '50', '155'), '1200', '1551 kcal', MENSAJE_SUELO, '90 g', '40 g', '120 g'],
    // Tope de proteína a la baja: de 108 g a 105 g.
    [paraBajar('Mujer', '70', '60', '160'), '1200', '1525 kcal', MENSAJE_SUELO, '105 g', '40 g', '105 g'],
    [paraBajar('Mujer', '35', '65', '165'), '1383', '1883 kcal', null, '117 g', '46 g', '125 g'],
    // Bajo peso con un gasto diario por debajo de 1200 kcal: gana la regla 1.
    [paraBajar('Mujer', '80', '35', '150'), '1017', '1017 kcal', MENSAJE_BAJO_PESO, '49 g', '34 g', '129 g'],
  ] as [SeisDatos, string, string, string | null, string, string, string][])(
    'aplica la primera regla que se cumple: %o',
    async (datos, calorias, gasto, mensaje, proteina, grasa, carbohidratos) => {
      await recorrerAsistente(datos)

      expect(screen.getByText(calorias)).toBeVisible()
      expect(screen.getByText(gasto)).toBeVisible()
      comprobarMensajes(mensaje)
      expect(macro('Proteína').getByText(proteina)).toBeVisible()
      expect(macro('Grasa').getByText(grasa)).toBeVisible()
      expect(macro('Carbohidratos').getByText(carbohidratos)).toBeVisible()
    },
  )

  it.each([
    // IMC de 18,5 exacto: no es Bajo peso.
    [paraBajar('Hombre', '30', '74', '200'), '2083', null],
    [paraBajar('Hombre', '30', '73.9', '200'), '2582', MENSAJE_BAJO_PESO],
    // Gasto diario de 1200 kcal exactas: no es la regla 2, sino la 3.
    [paraBajar('Mujer', '58', '35.1', '136', 'Moderada'), '1200', MENSAJE_SUELO],
    // Gasto diario de 1700 kcal: el recorte llega justo a 1200 kcal y no se limita.
    [paraBajar('Mujer', '60', '51.1', '162', 'Moderada'), '1200', null],
  ] as [SeisDatos, string, string | null][])('los umbrales de las reglas son estrictos: %o', async (datos, calorias, mensaje) => {
    await recorrerAsistente(datos)

    expect(screen.getByText(calorias)).toBeVisible()
    comprobarMensajes(mensaje)
  })

  it('el mensaje se lee entre la cifra principal y el metabolismo en reposo', async () => {
    await recorrerAsistente(bajoPeso)

    const mensaje = screen.getByText(MENSAJE_BAJO_PESO)
    const sigue = Node.DOCUMENT_POSITION_FOLLOWING
    expect(screen.getByText('2291').compareDocumentPosition(mensaje) & sigue).toBeTruthy()
    expect(mensaje.compareDocumentPosition(screen.getByText(/Metabolismo en reposo/)) & sigue).toBeTruthy()
  })

  it.each([
    ['Mantener', bajoPeso, '2291', '56 g'],
    ['Subir', bajoPeso, '2691', '64 g'],
    ['Mantener', paraBajar('Mujer', '85', '45', '150'), '1122', '63 g'],
    ['Subir', paraBajar('Mujer', '85', '45', '150'), '1522', '72 g'],
    ['Mantener', paraBajar('Mujer', '40', '50', '155'), '1551', '70 g'],
    ['Subir', paraBajar('Mujer', '40', '50', '155'), '1951', '80 g'],
  ] as [SeisDatos['objetivo'], SeisDatos, string, string][])(
    'con objetivo de %s no se aplica ninguna regla, ni con datos que al bajar la tendrían: %o',
    async (objetivo, datos, calorias, proteina) => {
      await recorrerAsistente({ ...datos, objetivo })

      expect(screen.getByText(calorias)).toBeVisible()
      expect(macro('Proteína').getByText(proteina)).toBeVisible()
      comprobarMensajes(null)
    },
  )

  it('el IMC no se enseña', async () => {
    await recorrerAsistente(bajoPeso)

    expect(screen.queryByText(/IMC/)).not.toBeInTheDocument()
    expect(document.body).not.toHaveTextContent('14,7')
    expect(document.body).not.toHaveTextContent('14.7')
  })
})
