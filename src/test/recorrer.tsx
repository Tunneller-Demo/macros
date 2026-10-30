import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '@/App'

export type Usuario = ReturnType<typeof userEvent.setup>

export type SeisDatos = {
  objetivo: 'Bajar' | 'Mantener' | 'Subir'
  sexo: 'Mujer' | 'Hombre'
  edad: string
  peso: string
  talla: string
  actividad: 'Sedentaria' | 'Moderada' | 'Activa' | 'Muy activa'
}

export function opcion(nombre: string) {
  return screen.getByRole('radio', { name: new RegExp(`^${nombre}`) })
}

export function abrirApp() {
  const user = userEvent.setup()
  render(<App />)
  return user
}

async function seguir(user: Usuario) {
  await user.click(screen.getByRole('button', { name: 'Seguir' }))
}

async function responderHastaLaEdad(user: Usuario, datos: Pick<SeisDatos, 'objetivo' | 'sexo' | 'edad'>) {
  await user.click(opcion(datos.objetivo))
  await user.click(opcion(datos.sexo))
  await user.type(screen.getByRole('textbox'), datos.edad)
  await seguir(user)
}

async function terminar(user: Usuario, actividad: SeisDatos['actividad']) {
  await user.click(opcion(actividad))
  await user.click(screen.getByRole('button', { name: 'Ver mi plan' }))
}

export async function responderHastaLaActividad(user: Usuario, datos: Omit<SeisDatos, 'actividad'>) {
  await responderHastaLaEdad(user, datos)
  for (const valor of [datos.peso, datos.talla]) {
    await user.type(screen.getByRole('textbox'), valor)
    await seguir(user)
  }
}

// Abre la app y responde las seis preguntas como lo haría una persona.
export async function recorrerAsistente(datos: SeisDatos) {
  const user = abrirApp()
  await responderHastaLaActividad(user, datos)
  await terminar(user, datos.actividad)
  return user
}

type SeisDatosImperiales = Omit<SeisDatos, 'talla'> & { pies: string; pulgadas: string }

export function campoDePies() {
  return screen.getByRole('textbox', { name: /pies$/ })
}

export function campoDePulgadas() {
  return screen.getByRole('textbox', { name: /pulgadas$/ })
}

// Igual que recorrerAsistente, pero eligiendo las unidades imperiales al llegar al peso.
export async function recorrerEnImperial(datos: SeisDatosImperiales) {
  const user = abrirApp()
  await responderHastaLaEdad(user, datos)
  await user.click(opcion('Imperiales'))
  await user.type(screen.getByRole('textbox'), datos.peso)
  await seguir(user)
  await user.type(campoDePies(), datos.pies)
  if (datos.pulgadas) await user.type(campoDePulgadas(), datos.pulgadas)
  await seguir(user)
  await terminar(user, datos.actividad)
  return user
}
