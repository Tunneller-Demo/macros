import { repartoEnEnteros, type Macro, type RepartoDeMacros, type Resultado } from '@/calculo'
import { MACROS, MARCA, MENSAJES_DE_REGLA } from '@/textos'

const COLORES_DEL_MACRO: Record<Macro, { sector: string; punto: string }> = {
  proteina: { sector: 'stroke-proteina', punto: 'bg-proteina' },
  grasa: { sector: 'stroke-grasa', punto: 'bg-grasa' },
  carbohidratos: { sector: 'stroke-carbohidratos', punto: 'bg-carbohidratos' },
}

// Hueco entre sectores, sobre una circunferencia de 100.
const HUECO_DEL_PLATO = 2

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
    <section className="rounded-3xl bg-crema-clara p-5 shadow-[0_10px_40px] shadow-bosque/12 sm:p-8">
      <h2 className="mb-6 font-fraunces text-3xl font-normal">Tus macros del día</h2>
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
                <span className="ml-3 text-bosque/70">{reparto[valor].porcentaje} %</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Resultados({ resultado }: { resultado: Resultado }) {
  return (
    <div className="min-h-screen bg-crema pb-12 font-instrument text-bosque">
      <header className="bg-bosque px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 font-fraunces text-lg text-crema">{MARCA}</div>
          <h1 className="text-lg font-normal text-crema/75">Tus calorías objetivo</h1>
          <p className="font-fraunces text-8xl leading-none text-crema sm:text-[11rem]">
            <span>{Math.round(resultado.caloriasObjetivo)}</span>
            <span className="ml-2 text-2xl sm:text-4xl">kcal al día</span>
          </p>
          {resultado.regla && (
            <p className="mt-5 max-w-2xl border-l-4 border-grasa pl-4 text-lg text-crema">
              {MENSAJES_DE_REGLA[resultado.regla]}
            </p>
          )}
          <p className="mt-5 text-crema/75">
            Metabolismo en reposo: <b className="font-semibold text-crema">{Math.round(resultado.metabolismoEnReposo)} kcal</b>
            <span className="mx-2">·</span>
            Gasto diario: <b className="font-semibold text-crema">{Math.round(resultado.gastoDiario)} kcal</b>
          </p>
        </div>
      </header>
      <main className="-mt-10 px-5 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <TarjetaDeMacros reparto={repartoEnEnteros(resultado)} />
        </div>
      </main>
    </div>
  )
}
