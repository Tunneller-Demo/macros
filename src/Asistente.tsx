import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { esNumero, type Respuestas } from '@/datos'
import { MARCA, NIVELES_DE_ACTIVIDAD, NOTA_SEXO, OBJETIVOS, PREGUNTAS, SEXOS, type Opcion } from '@/textos'

type PasoDeOpciones = {
  tipo: 'opciones'
  campo: 'objetivo' | 'sexo' | 'actividad'
  opciones: Opcion[]
  nota?: string
}

type PasoNumerico = {
  tipo: 'numero'
  campo: 'edad' | 'peso' | 'talla'
  unidad: string
  inputMode: 'numeric' | 'decimal'
}

type Paso = PasoDeOpciones | PasoNumerico

const PASOS: Paso[] = [
  { tipo: 'opciones', campo: 'objetivo', opciones: OBJETIVOS },
  { tipo: 'opciones', campo: 'sexo', opciones: SEXOS, nota: NOTA_SEXO },
  { tipo: 'numero', campo: 'edad', unidad: 'años', inputMode: 'numeric' },
  { tipo: 'numero', campo: 'peso', unidad: 'kg', inputMode: 'decimal' },
  { tipo: 'numero', campo: 'talla', unidad: 'cm', inputMode: 'numeric' },
  { tipo: 'opciones', campo: 'actividad', opciones: NIVELES_DE_ACTIVIDAD },
]

function Opciones({ opciones, valor, elegir }: { opciones: Opcion[]; valor: string; elegir: (valor: string) => void }) {
  return (
    <ToggleGroup type="single" spacing={3} value={valor} className="grid w-full">
      {opciones.map((opcion) => (
        <ToggleGroupItem
          key={opcion.valor}
          value={opcion.valor}
          onClick={() => elegir(opcion.valor)}
          className="h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-2xl border border-crema/60 px-5 py-4 text-left text-crema data-[state=off]:hover:border-crema data-[state=on]:border-grasa data-[state=on]:bg-grasa data-[state=on]:text-bosque"
        >
          <span className="font-fraunces text-2xl font-normal">{opcion.nombre}</span>
          {opcion.descripcion && <span className="text-sm font-normal opacity-80">{opcion.descripcion}</span>}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function CampoNumerico({ paso, valor, poner }: { paso: PasoNumerico; valor: string; poner: (valor: string) => void }) {
  return (
    <label className="flex items-baseline gap-3 border-b-2 border-crema/40 pb-1 focus-within:border-grasa">
      <span className="sr-only">{PREGUNTAS[paso.campo]}</span>
      <input
        type="text"
        inputMode={paso.inputMode}
        autoComplete="off"
        value={valor}
        onChange={(evento) => poner(evento.target.value)}
        className="w-full min-w-0 bg-transparent font-fraunces text-7xl text-crema outline-none sm:text-8xl"
      />
      <span className="text-xl text-crema/70">{paso.unidad}</span>
    </label>
  )
}

type Props = {
  respuestas: Respuestas
  responder: (cambios: Partial<Respuestas>) => void
  alTerminar: () => void
}

export function Asistente({ respuestas, responder, alTerminar }: Props) {
  const [indice, setIndice] = useState(0)
  const paso = PASOS[indice]
  const esLaUltima = indice === PASOS.length - 1
  const valor = respuestas[paso.campo]
  const respondida = paso.tipo === 'opciones' ? valor !== '' : esNumero(valor)

  function seguir(evento: FormEvent) {
    evento.preventDefault()
    if (!respondida) return
    if (esLaUltima) alTerminar()
    else setIndice(indice + 1)
  }

  function elegir(elegido: string) {
    responder({ [paso.campo]: elegido })
    if (!esLaUltima) setIndice(indice + 1)
  }

  return (
    <div className="flex min-h-screen flex-col bg-bosque px-5 pb-20 pt-6 font-instrument sm:px-8">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex items-center justify-between text-sm text-crema/70">
          <span className="font-fraunces text-lg text-crema">{MARCA}</span>
          <span>
            {indice + 1} de {PASOS.length}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progreso"
          aria-valuemin={1}
          aria-valuemax={PASOS.length}
          aria-valuenow={indice + 1}
          className="mt-3 flex gap-1.5"
        >
          {PASOS.map(({ campo }, i) => (
            <span key={campo} className={`h-1 flex-1 rounded-full ${i <= indice ? 'bg-grasa' : 'bg-crema/15'}`} />
          ))}
        </div>
        <form className="my-auto py-10" onSubmit={seguir}>
          <h1 className="font-fraunces text-[2.6rem] leading-[1.05] font-normal text-crema sm:text-6xl">
            {PREGUNTAS[paso.campo]}
          </h1>
          <p className="mb-8 mt-3 min-h-5 text-sm text-crema/70">{paso.tipo === 'opciones' && paso.nota}</p>
          {paso.tipo === 'opciones' ? (
            <Opciones opciones={paso.opciones} valor={valor} elegir={elegir} />
          ) : (
            <CampoNumerico
              key={paso.campo}
              paso={paso}
              valor={valor}
              poner={(escrito) => responder({ [paso.campo]: escrito })}
            />
          )}
          <div className="mt-8 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIndice(indice - 1)}
              className={`text-base font-normal text-crema/70 hover:bg-transparent hover:text-crema ${indice === 0 ? 'invisible' : ''}`}
            >
              Atrás
            </Button>
            <Button type="submit" className="h-auto rounded-full px-7 py-3 text-base font-semibold">
              {esLaUltima ? 'Ver mi plan' : 'Seguir'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
