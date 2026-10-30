import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { repartoEnEnteros, type Macro, type RepartoDeMacros, type Resultado } from '@/calculo'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Datos } from '@/datos'
import { COMIDAS_POR_DEFECTO, NUMEROS_DE_COMIDAS, planDeComidas, type Comida, type NumeroDeComidas } from '@/plan'
import {
  AVISO_ORIENTATIVO,
  CONSTRUIDA_CON,
  MACROS,
  MARCA,
  MARGEN_DE_ERROR,
  MENSAJES_DE_REGLA,
  NIVELES_DE_ACTIVIDAD,
  NOMBRES_DE_COMIDA,
  OBJETIVOS,
  SEXOS,
  type Opcion,
} from '@/textos'

const COLORES_DEL_MACRO: Record<Macro, { sector: string; punto: string; sobreVerde: string }> = {
  proteina: { sector: 'stroke-proteina', punto: 'bg-proteina', sobreVerde: 'text-proteina-sobre-verde' },
  grasa: { sector: 'stroke-grasa', punto: 'bg-grasa', sobreVerde: 'text-grasa' },
  carbohidratos: {
    sector: 'stroke-carbohidratos',
    punto: 'bg-carbohidratos',
    sobreVerde: 'text-carbohidratos-sobre-verde',
  },
}

// Hueco entre sectores, sobre una circunferencia de 100.
const HUECO_DEL_PLATO = 2

function nombreDe(opciones: Opcion[], valor: string) {
  return opciones.find((opcion) => opcion.valor === valor)?.nombre
}

type Medidas = { peso: string; talla: string }

function Resumen({ datos, medidas, alEditar }: { datos: Datos; medidas: Medidas; alEditar: () => void }) {
  const partes = [
    nombreDe(OBJETIVOS, datos.objetivo),
    nombreDe(SEXOS, datos.sexo),
    `${datos.edad} años`,
    medidas.peso,
    medidas.talla,
    nombreDe(NIVELES_DE_ACTIVIDAD, datos.actividad),
  ]

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <ul role="list" className="flex flex-wrap gap-2">
        {partes.map((parte) => (
          <li key={parte} className="rounded-full bg-crema/12 px-3 py-1 text-crema">
            {parte}
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="link"
        onClick={alEditar}
        className="h-auto px-2 py-1 font-normal text-grasa underline"
      >
        Editar
      </Button>
    </div>
  )
}

function Plato({ reparto }: { reparto: RepartoDeMacros }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true" className="mx-auto w-56 sm:w-full">
      <circle cx="60" cy="60" r="58" className="fill-crema-clara stroke-bosque/15" />
      {MACROS.map(({ valor }, i) => {
        const inicio = MACROS.slice(0, i).reduce((suma, anterior) => suma + reparto[anterior.valor].porcentaje, 0)
        const largo = reparto[valor].porcentaje - HUECO_DEL_PLATO
        return (
          <circle
            key={valor}
            cx="60"
            cy="60"
            r="44"
            fill="none"
            strokeWidth="17"
            pathLength={100}
            strokeDasharray={`${largo} ${100 - largo}`}
            strokeDashoffset={-inicio}
            transform="rotate(-90 60 60)"
            className={COLORES_DEL_MACRO[valor].sector}
          />
        )
      })}
    </svg>
  )
}

function TarjetaDeMacros({ reparto }: { reparto: RepartoDeMacros }) {
  return (
    <section
      aria-labelledby="titulo-macros"
      className="rounded-3xl bg-crema-clara p-5 shadow-[0_10px_40px] shadow-bosque/12 sm:p-8"
    >
      <h2 id="titulo-macros" className="mb-6 font-fraunces text-3xl font-normal">
        Tus macros del día
      </h2>
      <div className="grid items-center gap-8 sm:grid-cols-[260px_1fr]">
        <Plato reparto={reparto} />
        {/* Sin viñetas, VoiceOver deja de anunciarla como lista si no lleva el rol. */}
        <ul role="list" className="grid gap-4">
          {MACROS.map(({ valor, nombre }) => (
            <li key={valor} className="flex items-baseline justify-between gap-4 border-b border-bosque/15 pb-3">
              <span className="flex items-center gap-2.5 text-lg">
                <span className={`size-3 rounded-full ${COLORES_DEL_MACRO[valor].punto}`} />
                <span>{nombre}</span>
              </span>
              <span className="tabular-nums">
                <span className="font-fraunces text-3xl">{reparto[valor].gramos} g</span>
                {' '}
                <span className="ml-2 text-bosque/70">{reparto[valor].porcentaje} %</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function TarjetaDeComida({ comida }: { comida: Comida }) {
  return (
    // La tarjeta adapta la letra a su propio ancho: en las del 10 %, la línea de Carbohidratos cabe solo a 12 px.
    <li className="@container min-w-0 rounded-2xl bg-bosque text-crema">
      <div className="p-4 text-sm xl:px-1.5 xl:text-xs xl:@min-[9rem]:px-4 xl:@min-[9rem]:text-sm">
        <div className="flex items-baseline justify-between gap-2 xl:block">
          <h3 className="font-normal whitespace-nowrap text-crema/75">{NOMBRES_DE_COMIDA[comida.tipo]}</h3>
          <p className="font-fraunces text-3xl whitespace-nowrap xl:mt-6">
            {comida.calorias} <span className="font-instrument text-sm">kcal</span>
          </p>
        </div>
        <dl className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1 tabular-nums xl:block xl:space-y-1">
          {MACROS.map(({ valor, nombre }) => (
            <div key={valor} className="flex justify-between gap-1 whitespace-nowrap">
              <dt className={COLORES_DEL_MACRO[valor].sobreVerde}>{nombre}</dt>
              <dd>{comida.gramos[valor]} g</dd>
            </div>
          ))}
        </dl>
      </div>
    </li>
  )
}

function PlanDeComidas({ calorias, reparto }: { calorias: number; reparto: RepartoDeMacros }) {
  const [elegidas, setElegidas] = useState<NumeroDeComidas | null>(null)
  const numeroDeComidas = elegidas ?? COMIDAS_POR_DEFECTO
  const comidas = planDeComidas(calorias, reparto, numeroDeComidas)
  const columnas = comidas.map(({ porcentaje }) => `minmax(0, ${porcentaje}fr)`).join(' ')

  return (
    // La franja puede salirse de la columna: dentro de ella, «Carbohidratos» no cabe en una tarjeta del 10 %.
    <section aria-labelledby="titulo-plan" className="mx-auto mt-12 max-w-7xl">
      <div className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <h2 id="titulo-plan" className="font-fraunces text-3xl font-normal">
          Tu plan de comidas
        </h2>
        <ToggleGroup
          type="single"
          spacing={1}
          aria-label="Número de comidas"
          value={String(numeroDeComidas)}
          onValueChange={(valor) => valor && setElegidas(Number(valor) as NumeroDeComidas)}
          className="rounded-full bg-bosque/8 p-1"
        >
          {NUMEROS_DE_COMIDAS.map((numero) => (
            <ToggleGroupItem
              key={numero}
              value={String(numero)}
              className="rounded-full px-2.5 text-bosque sm:px-4 hover:bg-bosque/10 hover:text-bosque data-[state=on]:bg-bosque data-[state=on]:text-crema"
            >
              {numero} comidas
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <p role="status" className="sr-only">
        {elegidas && `Plan de ${elegidas} comidas`}
      </p>
      <ol
        role="list"
        style={{ '--columnas': columnas } as CSSProperties}
        className="grid gap-2 xl:grid-cols-(--columnas) xl:gap-1"
      >
        {comidas.map((comida) => (
          <TarjetaDeComida key={comida.tipo} comida={comida} />
        ))}
      </ol>
    </section>
  )
}

type Props = { datos: Datos; medidas: Medidas; resultado: Resultado; alEditar: () => void }

export function Resultados({ datos, medidas, resultado, alEditar }: Props) {
  const caloriasObjetivo = Math.round(resultado.caloriasObjetivo)
  const reparto = repartoEnEnteros(resultado)
  const tituloRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    tituloRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen bg-crema pb-12 font-instrument text-bosque">
      <header className="bg-bosque px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-fraunces text-lg text-crema">{MARCA}</span>
            <Resumen datos={datos} medidas={medidas} alEditar={alEditar} />
          </div>
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-lg font-normal text-crema/75 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Tus calorías objetivo
          </h1>
          <p className="font-fraunces text-8xl leading-none text-crema sm:text-[11rem]">
            <span>{caloriasObjetivo}</span>
            <span className="text-2xl sm:text-4xl"> kcal al día</span>
          </p>
          {resultado.regla && (
            <p className="mt-5 max-w-2xl border-l-4 border-grasa pl-4 text-lg text-crema">
              {MENSAJES_DE_REGLA[resultado.regla]}
            </p>
          )}
          <p className="mt-5 text-crema/75">
            Metabolismo en reposo: <b className="font-semibold text-crema">{Math.round(resultado.metabolismoEnReposo)} kcal</b>
            <span className="mx-1"> · </span>
            Gasto diario: <b className="font-semibold text-crema">{Math.round(resultado.gastoDiario)} kcal</b>
          </p>
          <p className="mt-3 max-w-2xl text-sm text-crema/75">{MARGEN_DE_ERROR}</p>
        </div>
      </header>
      <main className="-mt-10 px-5 [--color-ring:var(--color-bosque)] sm:px-8">
        <div className="mx-auto max-w-5xl">
          <TarjetaDeMacros reparto={reparto} />
        </div>
        <PlanDeComidas calorias={caloriasObjetivo} reparto={reparto} />
      </main>
      <footer className="mt-12 px-5 text-sm sm:px-8">
        <div className="mx-auto max-w-5xl space-y-2">
          <p>{AVISO_ORIENTATIVO}</p>
          <p>{CONSTRUIDA_CON}</p>
        </div>
      </footer>
    </div>
  )
}
