import type { Resultado } from '@/calculo'
import { MARCA } from '@/textos'

export function Resultados({ resultado }: { resultado: Resultado }) {
  return (
    <div className="min-h-screen bg-crema font-instrument text-bosque">
      <header className="bg-bosque px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 font-fraunces text-lg text-crema">{MARCA}</div>
          <h1 className="text-lg font-normal text-crema/75">Tus calorías objetivo</h1>
          <p className="font-fraunces text-8xl leading-none text-crema sm:text-[11rem]">
            <span>{Math.round(resultado.caloriasObjetivo)}</span>
            <span className="ml-2 text-2xl sm:text-4xl">kcal al día</span>
          </p>
          <p className="mt-5 text-crema/75">
            Metabolismo en reposo: <b className="font-semibold text-crema">{Math.round(resultado.metabolismoEnReposo)} kcal</b>
            <span className="mx-2">·</span>
            Gasto diario: <b className="font-semibold text-crema">{Math.round(resultado.gastoDiario)} kcal</b>
          </p>
        </div>
      </header>
    </div>
  )
}
