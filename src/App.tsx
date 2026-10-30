import { useState } from 'react'
import { Asistente } from '@/Asistente'
import { calcular } from '@/calculo'
import { leerDatos, SIN_RESPUESTAS, type Respuestas } from '@/datos'
import { Resultados } from '@/Resultados'

export default function App() {
  const [respuestas, setRespuestas] = useState(SIN_RESPUESTAS)
  const [terminado, setTerminado] = useState(false)

  const datos = terminado ? leerDatos(respuestas) : null
  if (datos) return <Resultados resultado={calcular(datos)} />

  return (
    <Asistente
      respuestas={respuestas}
      responder={(cambios: Partial<Respuestas>) => setRespuestas((anteriores) => ({ ...anteriores, ...cambios }))}
      alTerminar={() => setTerminado(true)}
    />
  )
}
