// Variante A, «Etiqueta»: formulario y resultado a la vez; el resultado es una etiqueta
// nutricional impresa sobre un envase amarillo. Una sola familia tipográfica y tinta negra.
import type { ReactNode } from 'react'
import { ToggleGroup } from 'radix-ui'
import {
  ACTIVIDADES,
  AVISO_PROVISIONAL,
  OBJETIVOS,
  planDeComidas,
  type Macro,
  type NumeroComidas,
  type PropsVariante,
  type Sexo,
  type Unidades,
} from './calculo'

const opcion =
  'flex-1 cursor-pointer border-2 border-black px-2 py-2.5 text-center text-sm font-bold -ml-0.5 first:ml-0 ' +
  'data-[state=on]:bg-black data-[state=on]:text-[#ffc928] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black'

function Campo({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <div className="border-t-4 border-black pt-2">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-xs font-extrabold uppercase tracking-wide">{titulo}</span>
        {nota && <span className="text-right text-[11px] font-medium leading-tight">{nota}</span>}
      </div>
      {children}
    </div>
  )
}

function Numero({ valor, poner, unidad, etiqueta }: { valor: string; poner: (v: string) => void; unidad: string; etiqueta: string }) {
  return (
    <label className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span className="sr-only">{etiqueta}</span>
      <input
        type="number"
        inputMode="decimal"
        value={valor}
        onChange={(e) => poner(e.target.value)}
        placeholder="0"
        className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-5xl font-black tabular-nums outline-none placeholder:text-black/25 [font-stretch:110%]"
      />
      <span className="text-sm font-bold">{unidad}</span>
    </label>
  )
}

function Formulario({ datos, cambiar, ponerUnidades }: PropsVariante) {
  const imperial = datos.unidades === 'imperial'
  return (
    <form className="grid gap-x-8 gap-y-6 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
      <Campo titulo="Objetivo">
        <ToggleGroup.Root type="single" className="flex" value={datos.objetivo} onValueChange={(v) => v && cambiar({ objetivo: v as typeof datos.objetivo })}>
          {OBJETIVOS.map((o) => (
            <ToggleGroup.Item key={o.valor} value={o.valor} className={opcion}>{o.nombre}</ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </Campo>
      <Campo titulo="Unidades">
        <ToggleGroup.Root type="single" className="flex" value={datos.unidades} onValueChange={(v) => v && ponerUnidades(v as Unidades)}>
          <ToggleGroup.Item value="metrico" className={opcion}>kg · cm</ToggleGroup.Item>
          <ToggleGroup.Item value="imperial" className={opcion}>lb · pies</ToggleGroup.Item>
        </ToggleGroup.Root>
      </Campo>
      <Campo titulo="Sexo" nota="Se usa solo porque la fórmula lo requiere">
        <ToggleGroup.Root type="single" className="flex" value={datos.sexo} onValueChange={(v) => v && cambiar({ sexo: v as Sexo })}>
          <ToggleGroup.Item value="mujer" className={opcion}>Mujer</ToggleGroup.Item>
          <ToggleGroup.Item value="hombre" className={opcion}>Hombre</ToggleGroup.Item>
        </ToggleGroup.Root>
      </Campo>
      <Campo titulo="Edad">
        <Numero etiqueta="Edad" valor={datos.edad} poner={(edad) => cambiar({ edad })} unidad="años" />
      </Campo>
      <Campo titulo="Peso">
        <Numero etiqueta="Peso" valor={datos.peso} poner={(peso) => cambiar({ peso })} unidad={imperial ? 'lb' : 'kg'} />
      </Campo>
      <Campo titulo="Talla">
        <div className="flex gap-3">
          <Numero etiqueta="Talla" valor={datos.talla} poner={(talla) => cambiar({ talla })} unidad={imperial ? 'pies' : 'cm'} />
          {imperial && <Numero etiqueta="Pulgadas" valor={datos.pulgadas} poner={(pulgadas) => cambiar({ pulgadas })} unidad="pulg" />}
        </div>
      </Campo>
      <div className="sm:col-span-2">
        <Campo titulo="Nivel de actividad">
          <ToggleGroup.Root type="single" className="grid sm:grid-cols-2" value={datos.actividad} onValueChange={(v) => v && cambiar({ actividad: v as typeof datos.actividad })}>
            {ACTIVIDADES.map((a) => (
              <ToggleGroup.Item
                key={a.valor}
                value={a.valor}
                className="-mt-0.5 cursor-pointer border-2 border-black px-3 py-2.5 text-left first:mt-0 sm:-ml-0.5 sm:[&:nth-child(-n+2)]:mt-0 sm:[&:nth-child(odd)]:ml-0 data-[state=on]:bg-black data-[state=on]:text-[#ffc928]"
              >
                <span className="block text-sm font-extrabold">{a.nombre}</span>
                <span className="block text-xs font-medium">{a.descripcion}</span>
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </Campo>
      </div>
    </form>
  )
}

function Fila({ nombre, macro }: { nombre: string; macro?: Macro }) {
  return (
    <div className="border-t border-black py-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-base"><b className="font-extrabold">{nombre}</b> {macro ? `${macro.gramos} g` : '— g'}</span>
        <b className="font-extrabold tabular-nums">{macro ? `${macro.porcentaje} %` : '— %'}</b>
      </div>
      <div className="mt-1 h-1.5 bg-black/10">
        <div className="h-full bg-black transition-[width] duration-300" style={{ width: `${macro?.porcentaje ?? 0}%` }} />
      </div>
    </div>
  )
}

function Etiqueta({ resultado, comidas, ponerComidas }: PropsVariante) {
  const plan = resultado ? planDeComidas(resultado, comidas) : []
  return (
    <section aria-label="Resultado" className="border-[3px] border-black bg-white px-4 pb-3 pt-2 text-black shadow-[8px_8px_0_#000] sm:px-5">
      <h2 className="text-[2.6rem] font-black leading-none tracking-tight [font-stretch:115%] sm:text-5xl">Tu día</h2>
      <p className="mt-1 border-b-[10px] border-black pb-1.5 text-sm font-medium">Cantidades por día, según tus datos</p>

      <div className="flex items-end justify-between border-b-[5px] border-black py-1">
        <div>
          <div className="text-xs font-extrabold">Calorías objetivo</div>
          <div className="text-sm font-medium">kcal al día</div>
        </div>
        <div className="text-7xl font-black leading-[.95] tabular-nums tracking-tight [font-stretch:110%]">
          {resultado?.caloriasObjetivo ?? '—'}
        </div>
      </div>

      <div className="flex justify-between py-1 text-sm">
        <span>Metabolismo en reposo</span>
        <b className="font-bold tabular-nums">{resultado ? `${resultado.metabolismoEnReposo} kcal` : '—'}</b>
      </div>
      <div className="flex justify-between border-t border-black py-1 text-sm">
        <span>Gasto diario</span>
        <b className="font-bold tabular-nums">{resultado ? `${resultado.gastoDiario} kcal` : '—'}</b>
      </div>

      <div className="mt-1 flex justify-between border-t-[10px] border-black pt-1 text-xs font-extrabold">
        <span>Macros</span>
        <span>% de las calorías</span>
      </div>
      <Fila nombre="Proteína" macro={resultado?.proteina} />
      <Fila nombre="Grasa" macro={resultado?.grasa} />
      <Fila nombre="Carbohidratos" macro={resultado?.carbohidratos} />

      <div className="mt-1 flex items-center justify-between gap-3 border-t-[10px] border-black py-1.5">
        <span className="text-xs font-extrabold">Plan de comidas</span>
        <ToggleGroup.Root type="single" className="flex" value={String(comidas)} onValueChange={(v) => v && ponerComidas(Number(v) as NumeroComidas)} aria-label="Número de comidas">
          {[3, 4, 5].map((n) => (
            <ToggleGroup.Item key={n} value={String(n)} className="-ml-0.5 h-8 w-9 cursor-pointer border-2 border-black text-sm font-extrabold first:ml-0 data-[state=on]:bg-black data-[state=on]:text-white">
              {n}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </div>

      {plan.map((c) => (
        <div key={c.nombre} className="flex items-baseline justify-between gap-3 border-t border-black py-1.5">
          <div className="min-w-0">
            <b className="block font-extrabold leading-tight">{c.nombre}</b>
            <span className="text-xs tabular-nums">Proteína {c.proteina} g · Grasa {c.grasa} g · Carbohidratos {c.carbohidratos} g</span>
          </div>
          <b className="shrink-0 text-lg font-black tabular-nums">{c.calorias}</b>
        </div>
      ))}
      {!resultado && <p className="border-t border-black py-3 text-sm font-medium">Completa tus datos para ver tu plan de comidas.</p>}

      <p className="mt-1 border-t-[5px] border-black pt-1.5 text-[11px] leading-snug">{AVISO_PROVISIONAL}</p>
    </section>
  )
}

export function VarianteA(props: PropsVariante) {
  return (
    <div className="min-h-screen bg-[#ffc928] pb-20 font-archivo text-black">
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
        <header className="mb-8 lg:mb-10">
          <p className="text-sm font-extrabold uppercase tracking-wide">Calculadora de macros</p>
          <h1 className="mt-1 text-[3.25rem] font-black leading-[.92] tracking-tight [font-stretch:120%] sm:text-7xl lg:text-8xl">
            Lee tu día<br />como una etiqueta.
          </h1>
        </header>
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
          <Formulario {...props} />
          <div className="lg:sticky lg:top-6">
            <Etiqueta {...props} />
          </div>
        </div>
        <footer className="mt-12 text-xs font-bold">Construida con Tunneller</footer>
      </div>
    </div>
  )
}
