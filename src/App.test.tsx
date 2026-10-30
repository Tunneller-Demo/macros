import { cleanup, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  abrirApp,
  campoDePies,
  campoDePulgadas,
  opcion,
  recorrerAsistente,
  recorrerEnImperial,
  responderHastaLaActividad,
  type SeisDatos,
  type Usuario,
} from '@/test/recorrer'

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

function verMiPlan() {
  return screen.getByRole('button', { name: 'Ver mi plan' })
}

function editar() {
  return screen.getByRole('button', { name: 'Editar' })
}

function sigueA(anterior: Element, siguiente: Element) {
  return Boolean(anterior.compareDocumentPosition(siguiente) & Node.DOCUMENT_POSITION_FOLLOWING)
}

function tarjetaDeMacros() {
  return within(screen.getByRole('region', { name: 'Tus macros del día' }))
}

function macro(nombre: string) {
  const fila = tarjetaDeMacros()
    .getAllByRole('listitem')
    .find((item) => within(item).queryByText(nombre))
  if (!fila) throw new Error(`No se ve el macro ${nombre}`)
  return within(fila)
}

function comidas() {
  return within(screen.getByRole('region', { name: 'Tu plan de comidas' })).getAllByRole('listitem')
}

function caloriasDe(comida: HTMLElement) {
  return Number(/(\d+) kcal/.exec(comida.textContent ?? '')?.[1])
}

function cifraDe(comida: HTMLElement, nombre: string) {
  return Number(new RegExp(`${nombre}(\\d+) g`).exec(comida.textContent ?? '')?.[1])
}

async function hastaLaEdad(user: Usuario) {
  await user.click(opcion('Bajar'))
  await user.click(opcion('Mujer'))
}

type Dato = 'edad' | 'peso' | 'talla'

async function hastaElDato(user: Usuario, dato: Dato) {
  await hastaLaEdad(user)
  if (dato === 'edad') return
  await user.type(campo(), '35')
  await user.click(seguir())
  if (dato === 'peso') return
  await user.type(campo(), '65')
  await user.click(seguir())
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
    expect(verMiPlan()).toBeVisible()
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

describe('Validación de las preguntas', () => {
  const RANGO_EDAD = 'Introduce una edad entre 18 y 100 años'
  const RANGO_PESO = 'Introduce un peso entre 35 y 250 kg'
  const RANGO_TALLA = 'Introduce una talla entre 130 y 220 cm'
  const MENORES = 'Esta calculadora es para personas adultas, a partir de 18 años'
  const SIN_OPCION = 'Elige una opción para seguir'

  it('sin una opción elegida, no avanza y pide elegir, asociado a las opciones', async () => {
    const user = abrirApp()

    await user.click(seguir())

    expect(pregunta('¿Qué quieres hacer con tu peso?')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(SIN_OPCION)
    expect(screen.getByRole('radiogroup')).toHaveAccessibleDescription(SIN_OPCION)
    expect(screen.getByRole('radiogroup')).toBeInvalid()
  })

  it('en la última pregunta, sin opción elegida, «Ver mi plan» tampoco avanza', async () => {
    const user = abrirApp()
    await hastaLaActividad(user)

    await user.click(verMiPlan())

    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(SIN_OPCION)
  })

  it.each([
    ['edad', '', RANGO_EDAD],
    ['edad', 'abc', RANGO_EDAD],
    ['edad', '-5', RANGO_EDAD],
    ['edad', '17', MENORES],
    ['edad', '17,5', MENORES],
    ['edad', '0', MENORES],
    ['edad', '101', RANGO_EDAD],
    ['edad', '25,5', `${RANGO_EDAD}, sin decimales`],
    ['peso', '', RANGO_PESO],
    ['peso', '1e2', RANGO_PESO],
    ['peso', '6 5', RANGO_PESO],
    ['peso', '-65', RANGO_PESO],
    ['peso', '65,', RANGO_PESO],
    ['peso', '34,9', RANGO_PESO],
    ['peso', '34.9', RANGO_PESO],
    ['peso', '250,1', RANGO_PESO],
    ['peso', '250.1', RANGO_PESO],
    ['peso', '65,55', `${RANGO_PESO}, con un decimal como máximo`],
    ['talla', '', RANGO_TALLA],
    ['talla', '129', RANGO_TALLA],
    ['talla', '221', RANGO_TALLA],
    ['talla', '170,5', `${RANGO_TALLA}, sin decimales`],
  ] as [Dato, string, string][])('%s «%s» no avanza y explica qué corregir, asociado al campo', async (dato, escrito, mensaje) => {
    const user = abrirApp()
    await hastaElDato(user, dato)
    const enunciado = screen.getByRole('heading').textContent

    if (escrito) await user.type(campo(), escrito)
    await user.click(seguir())

    expect(pregunta(enunciado)).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(campo()).toHaveAccessibleDescription(mensaje)
    expect(campo()).toBeInvalid()
    expect(campo()).toHaveValue(escrito)
  })

  it.each([
    ['edad', '18'],
    ['edad', '100'],
    ['peso', '35'],
    ['peso', '250'],
    ['peso', '35,0'],
    ['peso', '250.0'],
    ['peso', '65,5'],
    ['peso', '65.5'],
    ['peso', ' 65 '],
    ['talla', '130'],
    ['talla', '220'],
  ] as [Dato, string][])('%s «%s» vale y avanza', async (dato, escrito) => {
    const user = abrirApp()
    await hastaElDato(user, dato)
    const enunciado = screen.getByRole('heading').textContent

    await user.type(campo(), escrito)
    await user.click(seguir())

    expect(screen.queryByRole('heading', { name: enunciado })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it.each(['65,5', '65.5'])('el peso %s da las mismas cifras con coma y con punto', async (peso) => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Mantener', peso })

    expect(screen.getByText('1890')).toBeVisible()
  })

  it('el mensaje desaparece al corregir el campo', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)
    await user.click(seguir())

    await user.type(campo(), '3')

    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
    expect(campo()).toBeValid()
    expect(campo()).not.toHaveAccessibleDescription()
  })

  it('el mensaje desaparece al elegir una opción en la última pregunta', async () => {
    const user = abrirApp()
    await hastaLaActividad(user)
    await user.click(verMiPlan())

    await user.click(opcion('Moderada'))

    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('Atrás quita el mensaje y conserva lo escrito', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)
    await user.type(campo(), '17')
    await user.click(seguir())

    await user.click(atras())
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()

    await user.click(opcion('Mujer'))
    expect(campo()).toHaveValue('17')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('en un campo numérico, Enter equivale a Seguir', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)

    await user.type(campo(), '{Enter}')
    expect(pregunta('¿Cuántos años tienes?')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(RANGO_EDAD)

    await user.type(campo(), '35{Enter}')
    expect(pregunta('¿Cuánto pesas?')).toBeVisible()
  })

  it.each([
    ['edad', 'numeric'],
    ['peso', 'decimal'],
    ['talla', 'numeric'],
  ] as [Dato, string][])('el campo %s abre el teclado numérico', async (dato, teclado) => {
    const user = abrirApp()
    await hastaElDato(user, dato)

    expect(campo()).toHaveAttribute('inputmode', teclado)
  })
})

describe('Unidades', () => {
  const RANGO_LB = 'Introduce un peso entre 78 y 551 lb'
  const RANGO_PIES = `Introduce una talla entre 4'4" y 7'2"`

  const EQUIVALENTES_DE_MUJER_DE_35 = { ...mujerDe35, peso: '143,3', pies: '5', pulgadas: '5' }

  function cifrasDe(elemento: HTMLElement) {
    return (elemento.textContent ?? '').match(/\d+/g)?.map(Number) ?? []
  }

  it('son métricas por defecto y el mismo selector se ve en peso y en talla, no en la edad', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()

    await user.type(campo(), '35')
    await user.click(seguir())
    expect(opcion('Métricas')).toBeChecked()
    expect(screen.getByRole('textbox', { name: /kg$/ })).toBeVisible()

    await user.click(opcion('Imperiales'))
    expect(screen.getByRole('textbox', { name: /lb$/ })).toBeVisible()

    await user.type(campo(), '143')
    await user.click(seguir())
    expect(opcion('Imperiales')).toBeChecked()
    expect(campoDePies()).toBeVisible()
    expect(campoDePulgadas()).toBeVisible()

    await user.click(opcion('Métricas'))
    expect(screen.getByRole('textbox', { name: /cm$/ })).toBeVisible()
    await user.click(atras())
    expect(opcion('Métricas')).toBeChecked()
  })

  it.each([
    ['', RANGO_LB],
    ['77,9', RANGO_LB],
    ['77.9', RANGO_LB],
    ['551,1', RANGO_LB],
    ['551.1', RANGO_LB],
    ['143,33', `${RANGO_LB}, con un decimal como máximo`],
  ])('en imperial, el peso «%s» no avanza y da el rango en libras', async (escrito, mensaje) => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.click(opcion('Imperiales'))

    if (escrito) await user.type(campo(), escrito)
    await user.click(seguir())

    expect(pregunta('¿Cuánto pesas?')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(campo()).toHaveAccessibleDescription(mensaje)
    expect(campo()).toBeInvalid()
  })

  it.each(['78', '78,0', '78.0', '143,3', '143.3', '551', '551.0'])('en imperial, el peso «%s» vale y avanza', async (escrito) => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.click(opcion('Imperiales'))

    await user.type(campo(), escrito)
    await user.click(seguir())

    expect(pregunta('¿Cuánto mides?')).toBeVisible()
  })

  it.each([
    ['', '', RANGO_PIES],
    ['', '5', RANGO_PIES],
    ['abc', '', RANGO_PIES],
    ['4', '3', RANGO_PIES],
    ['4', '', RANGO_PIES],
    ['7', '3', RANGO_PIES],
    ['8', '', RANGO_PIES],
    ['5', '12', `${RANGO_PIES}, con pulgadas de 0 a 11`],
    ['5', '5,5', `${RANGO_PIES}, sin decimales`],
    ['5,5', '', `${RANGO_PIES}, sin decimales`],
  ])('en imperial, la talla %s pies y «%s» pulgadas no avanza y da el rango', async (pies, pulgadas, mensaje) => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.click(opcion('Imperiales'))

    if (pies) await user.type(campoDePies(), pies)
    if (pulgadas) await user.type(campoDePulgadas(), pulgadas)
    await user.click(seguir())

    expect(pregunta('¿Cuánto mides?')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent(mensaje)
    expect(campoDePies()).toHaveAccessibleDescription(mensaje)
    expect(campoDePulgadas()).toHaveAccessibleDescription(mensaje)
    expect(campoDePies()).toBeInvalid()
    expect(campoDePulgadas()).toBeInvalid()
  })

  it.each([
    ['4', '4'],
    ['5', ''],
    ['5', '0'],
    ['5', '11'],
    ['7', '2'],
    ['7', '0'],
  ])('en imperial, la talla %s pies y «%s» pulgadas vale y avanza', async (pies, pulgadas) => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.click(opcion('Imperiales'))

    await user.type(campoDePies(), pies)
    if (pulgadas) await user.type(campoDePulgadas(), pulgadas)
    await user.click(seguir())

    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
  })

  it('las pulgadas abren el teclado numérico y Enter equivale a Seguir', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.click(opcion('Imperiales'))

    expect(campoDePies()).toHaveAttribute('inputmode', 'numeric')
    expect(campoDePulgadas()).toHaveAttribute('inputmode', 'numeric')

    await user.type(campoDePies(), '5')
    await user.type(campoDePulgadas(), '{Enter}')
    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
  })

  it.each([
    ['65', '143,3'],
    ['65,5', '144,4'],
    ['100', '220,5'],
  ])('al cambiar a imperial, %s kg pasan a %s lb', async (kilos, libras) => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.type(campo(), kilos)

    await user.click(opcion('Imperiales'))

    expect(campo()).toHaveValue(libras)
  })

  it.each([
    ['143,3', '65'],
    ['143.3', '65'],
    ['144,4', '65,5'],
    ['78', '35,4'],
    ['551', '249,9'],
  ])('al cambiar a métricas, %s lb pasan a %s kg', async (libras, kilos) => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.click(opcion('Imperiales'))
    await user.type(campo(), libras)

    await user.click(opcion('Métricas'))

    expect(campo()).toHaveValue(kilos)
  })

  it.each([
    ['165', '5', '5'],
    ['170', '5', '7'],
    ['183', '6', '0'],
    // 71,7 pulgadas: se redondea el total, y nunca salen 12 pulgadas.
    ['182', '6', '0'],
  ])('al cambiar a imperial, %s cm pasan a %s pies y %s pulgadas', async (centimetros, pies, pulgadas) => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.type(campo(), centimetros)

    await user.click(opcion('Imperiales'))

    expect(campoDePies()).toHaveValue(pies)
    expect(campoDePulgadas()).toHaveValue(pulgadas)
  })

  it.each([
    ['5', '5', '165'],
    ['5', '', '152'],
    ['4', '4', '132'],
    ['7', '2', '218'],
  ])('al cambiar a métricas, %s pies y «%s» pulgadas pasan a %s cm', async (pies, pulgadas, centimetros) => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.click(opcion('Imperiales'))
    await user.type(campoDePies(), pies)
    if (pulgadas) await user.type(campoDePulgadas(), pulgadas)

    await user.click(opcion('Métricas'))

    expect(campo()).toHaveValue(centimetros)
  })

  it('un peso vacío sigue vacío y uno que no se entiende se vacía al cambiar', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')

    await user.click(opcion('Imperiales'))
    expect(campo()).toHaveValue('')

    await user.type(campo(), 'abc')
    await user.click(opcion('Métricas'))
    expect(campo()).toHaveValue('')
  })

  it('una talla vacía sigue vacía y una que no se entiende se vacía al cambiar', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')

    await user.click(opcion('Imperiales'))
    expect(campoDePies()).toHaveValue('')
    expect(campoDePulgadas()).toHaveValue('')

    await user.type(campoDePies(), 'abc')
    await user.click(opcion('Métricas'))
    expect(campo()).toHaveValue('')

    await user.type(campo(), 'abc')
    await user.click(opcion('Imperiales'))
    expect(campoDePies()).toHaveValue('')
    expect(campoDePulgadas()).toHaveValue('')
  })

  it('un dato inválido se convierte sin ajustarlo y su error sale en la unidad nueva', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.type(campo(), '300')

    await user.click(opcion('Imperiales'))
    expect(campo()).toHaveValue('661,4')

    await user.click(seguir())
    expect(screen.getByRole('alert')).toHaveTextContent(RANGO_LB)
  })

  it('cambiar de unidades quita el error, que estaba en la unidad anterior', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.click(seguir())
    expect(screen.getByRole('alert')).toHaveTextContent('Introduce un peso entre 35 y 250 kg')

    await user.click(opcion('Imperiales'))

    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it.each([
    ['35', '78'],
    ['250', '551'],
  ])('un peso válido sigue siendo válido al convertirlo: %s kg pasan a %s lb', async (kilos, libras) => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.type(campo(), kilos)

    await user.click(opcion('Imperiales'))

    expect(campo()).toHaveValue(libras)
    await user.click(seguir())
    expect(pregunta('¿Cuánto mides?')).toBeVisible()
  })

  it.each([
    ['130', '4', '4'],
    ['220', '7', '2'],
  ])('una talla válida sigue siendo válida al convertirla: %s cm pasan a %s pies y %s pulgadas', async (centimetros, pies, pulgadas) => {
    const user = abrirApp()
    await hastaElDato(user, 'talla')
    await user.type(campo(), centimetros)

    await user.click(opcion('Imperiales'))

    expect(campoDePies()).toHaveValue(pies)
    expect(campoDePulgadas()).toHaveValue(pulgadas)
    await user.click(seguir())
    expect(pregunta('¿Cómo es tu día a día?')).toBeVisible()
  })

  it('cambiar de unidades en la talla no deja atrás un peso imposible de corregir', async () => {
    const user = abrirApp()
    await hastaElDato(user, 'peso')
    await user.type(campo(), '35')
    await user.click(seguir())
    await user.type(campo(), '165')
    await user.click(opcion('Imperiales'))
    await user.click(seguir())
    await user.click(opcion('Sedentaria'))

    await user.click(verMiPlan())

    expect(screen.getByRole('heading', { name: 'Tus calorías objetivo' })).toBeVisible()
  })

  it.each([
    ['Bajar', 1383],
    ['Mantener', 1883],
    ['Subir', 2283],
  ] as const)('con datos equivalentes en imperial, objetivo de %s, las cifras son casi las mismas', async (objetivo, calorias) => {
    await recorrerEnImperial({ ...EQUIVALENTES_DE_MUJER_DE_35, objetivo })

    // 5'5" son 165,1 cm: la conversión no coincide al entero, pero apenas se aleja.
    const cifra = Number(within(screen.getByRole('banner')).getByText(/^\d+$/).textContent)
    expect(Math.abs(cifra - calorias)).toBeLessThanOrEqual(2)
  })

  it('con datos equivalentes en imperial, el metabolismo, el gasto, los macros y las comidas casi no cambian', async () => {
    function cifras() {
      return [...cifrasDe(screen.getByText(/Metabolismo en reposo/)), ...cifrasDe(screen.getByRole('main'))]
    }
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Mantener' })
    const enMetrico = cifras()
    cleanup()

    await recorrerEnImperial({ ...EQUIVALENTES_DE_MUJER_DE_35, objetivo: 'Mantener' })

    const enImperial = cifras()
    expect(enImperial).toHaveLength(enMetrico.length)
    enImperial.forEach((cifra, i) => expect(Math.abs(cifra - enMetrico[i])).toBeLessThanOrEqual(2))
  })

  it('el cálculo usa el dato escrito, no el métrico redondeado', async () => {
    await recorrerEnImperial({
      objetivo: 'Mantener',
      sexo: 'Hombre',
      edad: '40',
      peso: '330,7',
      pies: '7',
      pulgadas: '2',
      actividad: 'Sedentaria',
    })

    // 330,7 lb son 150,003 kg y 7'2" son 218,44 cm: 10·150,003 + 6,25·218,44 − 200 + 5 = 2670,28.
    expect(screen.getByText('2670 kcal')).toBeVisible()
  })

  it('el resumen muestra los datos en las unidades elegidas y Editar las conserva', async () => {
    const user = await recorrerEnImperial({ ...mujerDe35, objetivo: 'Bajar', peso: '143.3', pies: '5', pulgadas: '' })

    const resumen = within(screen.getByRole('banner'))
    expect(resumen.getByText('143,3 lb')).toBeVisible()
    expect(resumen.getByText(`5'0"`)).toBeVisible()
    expect(resumen.queryByText(/kg|cm/)).not.toBeInTheDocument()

    await user.click(editar())
    for (let paso = 0; paso < 3; paso++) await user.click(seguir())
    expect(opcion('Imperiales')).toBeChecked()
    expect(campo()).toHaveValue('143.3')

    await user.click(seguir())
    expect(campoDePies()).toHaveValue('5')
    expect(campoDePulgadas()).toHaveValue('')

    await user.click(seguir())
    await user.click(verMiPlan())
    expect(within(screen.getByRole('banner')).getByText('143,3 lb')).toBeVisible()
  })

  it('volver a métricas desde Editar cambia también el resumen', async () => {
    const user = await recorrerEnImperial({ ...EQUIVALENTES_DE_MUJER_DE_35, objetivo: 'Bajar' })

    await user.click(editar())
    for (let paso = 0; paso < 3; paso++) await user.click(seguir())
    await user.click(opcion('Métricas'))
    await user.click(seguir())
    await user.click(seguir())
    await user.click(verMiPlan())

    const resumen = within(screen.getByRole('banner'))
    expect(resumen.getByText('65 kg')).toBeVisible()
    expect(resumen.getByText('165 cm')).toBeVisible()
    expect(resumen.queryByText(/lb|"/)).not.toBeInTheDocument()
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
    const filas = tarjetaDeMacros()
      .getAllByRole('listitem')
      .map((item) => item.textContent)
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

    for (const control of ['textbox', 'spinbutton', 'slider', 'radio', 'checkbox', 'combobox', 'button']) {
      expect(tarjetaDeMacros().queryByRole(control)).not.toBeInTheDocument()
    }
  })

  it('oculta el plato a los lectores de pantalla, que leen la lista', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    expect(document.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(tarjetaDeMacros().getByRole('list')).toBeVisible()
  })
})

describe('Plan de comidas', () => {
  const bajar: SeisDatos = { ...mujerDe35, objetivo: 'Bajar' }

  it('ofrece 3, 4 o 5 comidas, con 4 por defecto', async () => {
    await recorrerAsistente(bajar)

    expect(screen.getAllByRole('radio').map((selector) => selector.textContent)).toEqual([
      '3 comidas',
      '4 comidas',
      '5 comidas',
    ])
    expect(opcion('4 comidas')).toBeChecked()
    expect(comidas()).toHaveLength(4)
  })

  it('muestra en cada comida su nombre, sus calorías y sus gramos, y nada más', async () => {
    await recorrerAsistente(bajar)

    expect(comidas().map((comida) => comida.textContent)).toEqual([
      'Desayuno346 kcalProteína29 gGrasa12 gCarbohidratos31 g',
      'Almuerzo484 kcalProteína41 gGrasa16 gCarbohidratos44 g',
      'Merienda207 kcalProteína18 gGrasa7 gCarbohidratos19 g',
      'Cena346 kcalProteína29 gGrasa11 gCarbohidratos31 g',
    ])
  })

  it.each([
    ['3 comidas', ['Desayuno', 'Almuerzo', 'Cena'], [415, 553, 415], [35, 47, 35]],
    ['5 comidas', ['Desayuno', 'Media mañana', 'Almuerzo', 'Merienda', 'Cena'], [277, 138, 484, 138, 346], [23, 12, 41, 12, 29]],
  ] as [string, string[], number[], number[]][])('con %s usa sus nombres y sus porcentajes', async (numero, nombres, calorias, proteina) => {
    const user = await recorrerAsistente(bajar)

    await user.click(opcion(numero))

    expect(comidas().map((comida) => within(comida).getByRole('heading').textContent)).toEqual(nombres)
    expect(comidas().map(caloriasDe)).toEqual(calorias)
    expect(comidas().map((comida) => cifraDe(comida, 'Proteína'))).toEqual(proteina)
  })

  it('la diferencia del redondeo va a las cifras con mayor parte decimal', async () => {
    const user = await recorrerAsistente(bajar)

    await user.click(opcion('5 comidas'))

    // 9,2 · 4,6 · 16,1 · 4,6 · 11,5: redondeados por separado sumarían 47, no 46.
    expect(comidas().map((comida) => cifraDe(comida, 'Grasa'))).toEqual([9, 5, 16, 5, 11])
  })

  const personas: [SeisDatos][] = [
    [bajar],
    [{ ...mujerDe35, objetivo: 'Mantener' }],
    [{ ...mujerDe35, objetivo: 'Subir' }],
    // Regla de protección.
    [{ objetivo: 'Bajar', sexo: 'Mujer', edad: '40', peso: '50', talla: '155', actividad: 'Sedentaria' }],
    // Tope de proteína.
    [{ objetivo: 'Bajar', sexo: 'Hombre', edad: '40', peso: '150', talla: '180', actividad: 'Sedentaria' }],
  ]

  it.each(personas)('las comidas suman los totales del día con 3, 4 y 5 comidas: %o', async (datos) => {
    const user = await recorrerAsistente(datos)
    const totalDeCalorias = within(screen.getByRole('banner')).getByText(/^\d+$/).textContent

    for (const numero of ['3 comidas', '4 comidas', '5 comidas']) {
      await user.click(opcion(numero))

      const calorias = comidas().map(caloriasDe)
      expect(calorias.reduce((suma, cifra) => suma + cifra)).toBe(Number.parseInt(totalDeCalorias))
      for (const nombre of ['Proteína', 'Grasa', 'Carbohidratos']) {
        const total = macro(nombre).getByText(/^\d+ g$/).textContent
        const gramos = comidas().map((comida) => cifraDe(comida, nombre))
        expect(gramos.reduce((suma, cifra) => suma + cifra)).toBe(Number.parseInt(total))
      }
    }
  })

  it('cambiar el número de comidas actualiza el plan y lo anuncia, pero no al llegar', async () => {
    const user = await recorrerAsistente(bajar)
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    await user.click(opcion('5 comidas'))
    expect(comidas()).toHaveLength(5)
    expect(screen.getByRole('status')).toHaveTextContent('Plan de 5 comidas')

    await user.click(opcion('4 comidas'))
    expect(comidas()).toHaveLength(4)
    expect(screen.getByRole('status')).toHaveTextContent('Plan de 4 comidas')
  })

  it('volver a pulsar la opción elegida no vacía el plan', async () => {
    const user = await recorrerAsistente(bajar)

    await user.click(opcion('4 comidas'))

    expect(opcion('4 comidas')).toBeChecked()
    expect(comidas()).toHaveLength(4)
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
    expect(sigueA(screen.getByText('2291'), mensaje)).toBe(true)
    expect(sigueA(mensaje, screen.getByText(/Metabolismo en reposo/))).toBe(true)
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

describe('Resumen y Editar', () => {
  const bajar: SeisDatos = { ...mujerDe35, objetivo: 'Bajar' }

  function resumen() {
    return within(screen.getByRole('banner'))
      .getAllByRole('listitem')
      .map((dato) => dato.textContent)
  }

  it('la cabecera muestra la marca, los seis datos en orden y Editar', async () => {
    await recorrerAsistente(bajar)

    const cabecera = within(screen.getByRole('banner'))
    expect(cabecera.getByText('Macros')).toBeVisible()
    expect(resumen()).toEqual(['Bajar', 'Mujer', '35 años', '65 kg', '165 cm', 'Sedentaria'])
    expect(cabecera.getByRole('button', { name: 'Editar' })).toBeVisible()
  })

  it.each(['65,5', '65.5', ' 65,5 '])('el resumen muestra el peso «%s» con coma y sin espacios', async (peso) => {
    await recorrerAsistente({ ...bajar, peso })

    expect(resumen()).toContain('65,5 kg')
  })

  it('Editar vuelve a la primera pregunta con los datos conservados', async () => {
    const user = await recorrerAsistente(bajar)

    await user.click(editar())

    expect(pregunta('¿Qué quieres hacer con tu peso?')).toBeVisible()
    expect(screen.getByText('1 de 6')).toBeVisible()
    expect(opcion('Bajar')).toBeChecked()

    await user.click(seguir())
    expect(opcion('Mujer')).toBeChecked()

    await user.click(seguir())
    expect(campo()).toHaveValue('35')

    await user.click(seguir())
    expect(campo()).toHaveValue('65')

    await user.click(seguir())
    expect(campo()).toHaveValue('165')

    await user.click(seguir())
    expect(opcion('Sedentaria')).toBeChecked()
  })

  it('Editar sin cambiar nada da las mismas cifras', async () => {
    const user = await recorrerAsistente(bajar)

    await user.click(editar())
    for (let paso = 0; paso < 5; paso++) await user.click(seguir())
    await user.click(verMiPlan())

    expect(screen.getByText('1383')).toBeVisible()
    expect(resumen()).toEqual(['Bajar', 'Mujer', '35 años', '65 kg', '165 cm', 'Sedentaria'])
  })

  it('un cambio se refleja en el resumen y en las cifras', async () => {
    const user = await recorrerAsistente(bajar)

    await user.click(editar())
    await user.click(opcion('Mantener'))
    for (let paso = 0; paso < 4; paso++) await user.click(seguir())
    await user.click(verMiPlan())

    expect(screen.getByText('1883')).toBeVisible()
    expect(resumen()[0]).toBe('Mantener')
  })

  it('un cambio que activa una regla de protección muestra su mensaje', async () => {
    const user = await recorrerAsistente(bajar)
    expect(screen.queryByText(/Hemos limitado el recorte/)).not.toBeInTheDocument()

    await user.click(editar())
    await user.click(seguir())
    await user.click(seguir())
    await user.click(seguir())
    await user.clear(campo())
    await user.type(campo(), '51')
    await user.click(seguir())
    await user.click(seguir())
    await user.click(verMiPlan())

    expect(resumen()).toContain('51 kg')
    expect(screen.getByText(/Hemos limitado el recorte/)).toBeVisible()
  })

  it('tras Editar, el plan vuelve a 4 comidas', async () => {
    const user = await recorrerAsistente(bajar)
    await user.click(opcion('5 comidas'))

    await user.click(editar())
    for (let paso = 0; paso < 5; paso++) await user.click(seguir())
    await user.click(verMiPlan())

    expect(opcion('4 comidas')).toBeChecked()
    expect(comidas()).toHaveLength(4)
  })
})

describe('Avisos', () => {
  const NOTA_OBJETIVO = 'Orientativa y para personas adultas. No apta para embarazo ni lactancia.'
  const MARGEN_DE_ERROR =
    'Es una estimación: tu gasto real puede variar unas 300 kcal arriba o abajo. Si tu peso no evoluciona como esperabas, ajusta.'
  const AVISO_ORIENTATIVO =
    'Este resultado es orientativo y no sustituye el consejo de un profesional sanitario. La calculadora está pensada para personas adultas: no sirve para menores ni durante el embarazo o la lactancia. Si tienes alguna enfermedad o dudas sobre tu alimentación, consulta a un profesional.'

  const bajoPeso: SeisDatos = { objetivo: 'Bajar', sexo: 'Mujer', edad: '25', peso: '40', talla: '165', actividad: 'Muy activa' }
  const personas: [SeisDatos][] = [
    [{ ...mujerDe35, objetivo: 'Bajar' }],
    [{ ...mujerDe35, objetivo: 'Mantener' }],
    [{ ...mujerDe35, objetivo: 'Subir' }],
    [bajoPeso],
  ]

  function pie() {
    return within(screen.getByRole('contentinfo'))
  }

  it('la primera pregunta avisa de para quién es la calculadora, y las demás no', async () => {
    const user = abrirApp()
    expect(screen.getByText(NOTA_OBJETIVO)).toBeVisible()

    await user.click(opcion('Bajar'))
    expect(screen.queryByText(NOTA_OBJETIVO)).not.toBeInTheDocument()
  })

  it('la primera pregunta mantiene el aviso con un error y al volver con Atrás', async () => {
    const user = abrirApp()

    await user.click(seguir())
    expect(screen.getByRole('alert')).toHaveTextContent('Elige una opción para seguir')
    expect(screen.getByText(NOTA_OBJETIVO)).toBeVisible()

    await user.click(opcion('Bajar'))
    await user.click(atras())
    expect(screen.getByText(NOTA_OBJETIVO)).toBeVisible()
  })

  it('la primera pregunta vuelve a mostrar el aviso con Editar', async () => {
    const user = await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    await user.click(editar())

    expect(screen.getByText(NOTA_OBJETIVO)).toBeVisible()
  })

  it.each(personas)('la frase del margen de error aparece siempre bajo la cifra: %o', async (datos) => {
    await recorrerAsistente(datos)

    const cabecera = within(screen.getByRole('banner'))
    const frase = cabecera.getByText(MARGEN_DE_ERROR)
    expect(frase).toBeVisible()
    expect(sigueA(cabecera.getByText(/^\d+$/), frase)).toBe(true)
  })

  it('con una regla, la frase del margen de error va tras su mensaje', async () => {
    await recorrerAsistente(bajoPeso)

    expect(sigueA(screen.getByText(/^Con tu peso y tu talla/), screen.getByText(MARGEN_DE_ERROR))).toBe(true)
  })

  it.each(personas)('el aviso orientativo y «Construida con Tunneller» están siempre en resultados: %o', async (datos) => {
    const user = await recorrerAsistente(datos)

    for (const numero of ['3 comidas', '4 comidas', '5 comidas']) {
      await user.click(opcion(numero))

      expect(pie().getByText(AVISO_ORIENTATIVO)).toBeVisible()
      expect(pie().getByText('Construida con Tunneller')).toBeVisible()
    }
  })

  it('el aviso orientativo solo informa: no se marca, no bloquea y no se pliega', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    // Un <details> tiene el rol group.
    for (const control of ['checkbox', 'button', 'switch', 'link', 'radio', 'group']) {
      expect(pie().queryByRole(control)).not.toBeInTheDocument()
    }
    expect(opcion('3 comidas')).toBeEnabled()
  })

  it('resultados sigue el orden: cabecera, cifra, macros, plan y pie', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })

    const secuencia = [
      editar(),
      screen.getByRole('heading', { name: 'Tus calorías objetivo' }),
      screen.getByText('1383'),
      screen.getByRole('region', { name: 'Tus macros del día' }),
      screen.getByRole('region', { name: 'Tu plan de comidas' }),
      screen.getByRole('contentinfo'),
    ]

    secuencia.slice(1).forEach((elemento, i) => expect(sigueA(secuencia[i], elemento)).toBe(true))
  })
})

describe('Privacidad', () => {
  it('tras un recorrido no queda nada en el navegador ni en la URL', async () => {
    const direccion = window.location.href

    const user = await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })
    await user.click(opcion('5 comidas'))
    await user.click(editar())

    expect(localStorage).toHaveLength(0)
    expect(sessionStorage).toHaveLength(0)
    expect(document.cookie).toBe('')
    expect(window.location.href).toBe(direccion)
  })

  it('al recargar, el formulario queda vacío', async () => {
    await recorrerAsistente({ ...mujerDe35, objetivo: 'Bajar' })
    cleanup()

    const user = abrirApp()

    expect(pregunta('¿Qué quieres hacer con tu peso?')).toBeVisible()
    expect(screen.getByText('1 de 6')).toBeVisible()
    expect(opcion('Bajar')).not.toBeChecked()
    await user.click(opcion('Bajar'))
    expect(opcion('Mujer')).not.toBeChecked()
    await user.click(opcion('Mujer'))
    for (const valor of ['35', '65', '165']) {
      expect(campo()).toHaveValue('')
      await user.type(campo(), valor)
      await user.click(seguir())
    }
    expect(opcion('Sedentaria')).not.toBeChecked()
  })
})
