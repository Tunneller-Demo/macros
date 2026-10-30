import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { opcion, recorrerAsistente, type SeisDatos } from '@/test/recorrer'

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

function abrirApp() {
  const user = userEvent.setup()
  render(<App />)
  return user
}

async function hastaLaEdad(user: ReturnType<typeof userEvent.setup>) {
  await user.click(opcion('Bajar'))
  await user.click(opcion('Mujer'))
}

async function hastaLaActividad(user: ReturnType<typeof userEvent.setup>) {
  await hastaLaEdad(user)
  for (const valor of ['35', '65', '165']) {
    await user.type(campo(), valor)
    await user.click(seguir())
  }
}

describe('Asistente', () => {
  it('hace las seis preguntas en orden, una por pantalla, con su progreso', async () => {
    const user = abrirApp()

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
    expect(screen.getByText('1345 kcal')).toBeVisible()
    expect(screen.getByText('1883 kcal')).toBeVisible()
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
