import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { errorDe, type DatoNumerico, type Respuestas } from '@/datos'
import { MARCA, NIVELES_DE_ACTIVIDAD, NOTA_SEXO, OBJETIVOS, PREGUNTAS, SEXOS, type Opcion } from '@/textos'

type PasoDeOpciones = {
  tipo: 'opciones'
  campo: 'objetivo' | 'sexo' | 'actividad'
  opciones: Opcion[]
  nota?: string
}

type PasoNumerico = {
  tipo: 'numero'
  campo: DatoNumerico
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

const ID_DEL_ERROR = 'error-de-la-pregunta'

type PropsDeOpciones = { opciones: Opcion[]; valor: string; error: string | null; elegir: (valor: string) => void }

function Opciones({ opciones, valor, error, elegir }: PropsDeOpciones) {
  return (
    <ToggleGroup
      type="single"
      spacing={3}
      value={valor}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? ID_DEL_ERROR : undefined}
      className="grid w-full"
    >
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

type PropsDeCampo = { paso: PasoNumerico; valor: string; error: string | null; poner: (valor: string) => void }

function CampoNumerico({ paso, valor, error, poner }: PropsDeCampo) {
  return (
    <label className="flex items-baseline gap-3 border-b-2 border-crema/40 pb-1 focus-within:border-grasa">
      <span className="sr-only">{PREGUNTAS[paso.campo]}</span>
      <input
        type="text"
        inputMode={paso.inputMode}
        autoComplete="off"
        value={valor}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? ID_DEL_ERROR : undefined}
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
  const [error, setError] = useState<string | null>(null)
  const paso = PASOS[indice]
  const esLaUltima = indice === PASOS.length - 1
  const valor = respuestas[paso.campo]

  function irA(nuevoIndice: number) {
    setError(null)
    setIndice(nuevoIndice)
  }

  function cambiar(nuevoValor: string) {
    setError(null)
    responder({ [paso.campo]: nuevoValor })
  }

  function seguir(evento: FormEvent) {
    evento.preventDefault()
    const errorDelPaso = errorDe(paso.campo, valor)
    if (errorDelPaso !== null) setError(errorDelPaso)
    else if (esLaUltima) alTerminar()
    else irA(indice + 1)
  }

  function elegir(elegido: string) {
    cambiar(elegido)
    if (!esLaUltima) irA(indice + 1)
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
            <Opciones opciones={paso.opciones} valor={valor} error={error} elegir={elegir} />
          ) : (
            <CampoNumerico key={paso.campo} paso={paso} valor={valor} error={error} poner={cambiar} />
          )}
          <p id={ID_DEL_ERROR} role="alert" className="mt-3 min-h-5 text-sm font-medium text-error-sobre-verde">
            {error}
          </p>
          <div className="mt-5 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => irA(indice - 1)}
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
