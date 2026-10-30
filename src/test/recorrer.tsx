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

export async function responderHastaLaActividad(user: Usuario, datos: Omit<SeisDatos, 'actividad'>) {
  await user.click(opcion(datos.objetivo))
  await user.click(opcion(datos.sexo))
  for (const valor of [datos.edad, datos.peso, datos.talla]) {
    await user.type(screen.getByRole('textbox'), valor)
    await user.click(screen.getByRole('button', { name: 'Seguir' }))
  }
}

// Abre la app y responde las seis preguntas como lo haría una persona.
export async function recorrerAsistente(datos: SeisDatos) {
  const user = abrirApp()
  await responderHastaLaActividad(user, datos)
  await user.click(opcion(datos.actividad))
  await user.click(screen.getByRole('button', { name: 'Ver mi plan' }))
}
