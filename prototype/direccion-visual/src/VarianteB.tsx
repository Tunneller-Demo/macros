// Variante B, «Paso a paso»: una pregunta por pantalla y después una pantalla de resultado
// con el día dibujado como un plato y una franja de comidas. Serif cálida sobre crema y verde.
import { useState, type ReactNode } from 'react'
import { ToggleGroup } from 'radix-ui'
import {
  ACTIVIDADES,
  AVISO_PROVISIONAL,
  OBJETIVOS,
  planDeComidas,
  type NumeroComidas,
  type PropsVariante,
  type Resultado,
  type Sexo,
  type Unidades,
} from './calculo'

const COLOR = { proteina: '#d9512c', grasa: '#e4a72b', carbohidratos: '#6f9a5c' }
const PIE = 'Construida con Tunneller'

function Grande({ valor, poner, unidad, etiqueta }: { valor: string; poner: (v: string) => void; unidad: string; etiqueta: string }) {
  return (
    <label className="flex items-baseline gap-3 border-b-2 border-[#fbf3e4]/40 pb-1 focus-within:border-[#e4a72b]">
      <span className="sr-only">{etiqueta}</span>
      <input
        autoFocus
        type="number"
        inputMode="decimal"
        value={valor}
        onChange={(e) => poner(e.target.value)}
        className="w-full min-w-0 bg-transparent font-fraunces text-7xl text-[#fbf3e4] outline-none sm:text-8xl"
      />
      <span className="text-xl text-[#fbf3e4]/70">{unidad}</span>
    </label>
  )
}

function Opciones({ opciones, valor, elegir }: { opciones: { valor: string; nombre: string; descripcion?: string }[]; valor: string; elegir: (v: string) => void }) {
  return (
    <ToggleGroup.Root type="single" className="grid gap-3" value={valor} onValueChange={(v) => v && elegir(v)}>
      {opciones.map((o) => (
        <ToggleGroup.Item
          key={o.valor}
          value={o.valor}
          className="cursor-pointer rounded-2xl border border-[#fbf3e4]/30 px-5 py-4 text-left text-[#fbf3e4] transition hover:border-[#fbf3e4] data-[state=on]:border-[#e4a72b] data-[state=on]:bg-[#e4a72b] data-[state=on]:text-[#16352a]"
        >
          <span className="block font-fraunces text-2xl">{o.nombre}</span>
          {o.descripcion && <span className="block text-sm opacity-80">{o.descripcion}</span>}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

function SelectorUnidades({ valor, poner }: { valor: Unidades; poner: (u: Unidades) => void }) {
  return (
    <ToggleGroup.Root type="single" className="mb-6 inline-flex rounded-full bg-[#fbf3e4]/10 p-1 text-sm" value={valor} onValueChange={(v) => v && poner(v as Unidades)}>
      {[['metrico', 'Métrico'], ['imperial', 'Imperial']].map(([v, n]) => (
        <ToggleGroup.Item key={v} value={v} className="cursor-pointer rounded-full px-4 py-1.5 text-[#fbf3e4] data-[state=on]:bg-[#fbf3e4] data-[state=on]:text-[#16352a]">{n}</ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}

function Asistente({ datos, cambiar, ponerUnidades, resultado, alTerminar }: PropsVariante & { alTerminar: () => void }) {
  const [indice, setIndice] = useState(0)
  const imperial = datos.unidades === 'imperial'
  const siguiente = () => (indice === 5 ? alTerminar() : setIndice(indice + 1))
  const conAvance = (accion: () => void) => {
    accion()
    if (indice < 5) setIndice(indice + 1)
  }

  const pasos: { pregunta: string; nota?: string; listo: boolean; contenido: ReactNode }[] = [
    {
      pregunta: '¿Qué quieres hacer con tu peso?',
      listo: !!datos.objetivo,
      contenido: <Opciones opciones={OBJETIVOS} valor={datos.objetivo} elegir={(v) => conAvance(() => cambiar({ objetivo: v as typeof datos.objetivo }))} />,
    },
    {
      pregunta: '¿Cuál es tu sexo?',
      nota: 'Se usa solo porque la fórmula lo requiere.',
      listo: !!datos.sexo,
      contenido: (
        <Opciones
          opciones={[{ valor: 'mujer', nombre: 'Mujer' }, { valor: 'hombre', nombre: 'Hombre' }]}
          valor={datos.sexo}
          elegir={(v) => conAvance(() => cambiar({ sexo: v as Sexo }))}
        />
      ),
    },
    {
      pregunta: '¿Cuántos años tienes?',
      listo: Number(datos.edad) >= 18,
      contenido: <Grande etiqueta="Edad" valor={datos.edad} poner={(edad) => cambiar({ edad })} unidad="años" />,
    },
    {
      pregunta: '¿Cuánto pesas?',
      listo: Number(datos.peso) > 0,
      contenido: (
        <>
          <SelectorUnidades valor={datos.unidades} poner={ponerUnidades} />
          <Grande etiqueta="Peso" valor={datos.peso} poner={(peso) => cambiar({ peso })} unidad={imperial ? 'lb' : 'kg'} />
        </>
      ),
    },
    {
      pregunta: '¿Cuánto mides?',
      listo: Number(datos.talla) > 0,
      contenido: (
        <>
          <SelectorUnidades valor={datos.unidades} poner={ponerUnidades} />
          <div className="flex gap-6">
            <Grande etiqueta="Talla" valor={datos.talla} poner={(talla) => cambiar({ talla })} unidad={imperial ? 'pies' : 'cm'} />
            {imperial && <Grande etiqueta="Pulgadas" valor={datos.pulgadas} poner={(pulgadas) => cambiar({ pulgadas })} unidad="pulg" />}
          </div>
        </>
      ),
    },
    {
      pregunta: '¿Cómo es tu día a día?',
      listo: !!datos.actividad,
      contenido: <Opciones opciones={ACTIVIDADES} valor={datos.actividad} elegir={(v) => cambiar({ actividad: v as typeof datos.actividad })} />,
    },
  ]
  const paso = pasos[indice]

  return (
    <div className="flex min-h-screen flex-col bg-[#16352a] px-5 pb-20 pt-6 font-instrument sm:px-8">
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
        <div className="flex items-center justify-between text-sm text-[#fbf3e4]/70">
          <span className="font-fraunces text-lg text-[#fbf3e4]">Macros</span>
          <span>{indice + 1} de 6</span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {pasos.map((p, i) => (
            <span key={p.pregunta} className={`h-1 flex-1 rounded-full ${i <= indice ? 'bg-[#e4a72b]' : 'bg-[#fbf3e4]/15'}`} />
          ))}
        </div>
        <form className="my-auto py-10" onSubmit={(e) => { e.preventDefault(); if (paso.listo) siguiente() }}>
          <h1 className="font-fraunces text-[2.6rem] leading-[1.05] text-[#fbf3e4] sm:text-6xl">{paso.pregunta}</h1>
          <p className="mb-8 mt-3 min-h-5 text-sm text-[#fbf3e4]/70">{paso.nota}</p>
          {paso.contenido}
          <div className="mt-8 flex items-center justify-between">
            <button type="button" onClick={() => setIndice(indice - 1)} className={`cursor-pointer text-[#fbf3e4]/70 hover:text-[#fbf3e4] ${indice === 0 ? 'invisible' : ''}`}>Atrás</button>
            <button type="submit" disabled={!paso.listo || (indice === 5 && !resultado)} className="cursor-pointer rounded-full bg-[#e4a72b] px-7 py-3 font-semibold text-[#16352a] transition disabled:cursor-default disabled:opacity-30">
              {indice === 5 ? 'Ver mi plan' : 'Seguir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Plato({ resultado }: { resultado: Resultado }) {
  const macros = [
    { ...resultado.proteina, color: COLOR.proteina },
    { ...resultado.grasa, color: COLOR.grasa },
    { ...resultado.carbohidratos, color: COLOR.carbohidratos },
  ]
  const total = macros.reduce((s, m) => s + m.porcentaje, 0)
  let inicio = 0
  return (
    <div className="grid items-center gap-8 sm:grid-cols-[260px_1fr]">
      <svg viewBox="0 0 120 120" className="mx-auto w-56 sm:w-full" role="img" aria-label="Reparto de macros">
        <circle cx="60" cy="60" r="58" fill="#fffaf0" stroke="#16352a" strokeOpacity=".12" />
        {macros.map((m) => {
          const largo = (m.porcentaje / total) * 100
          const anillo = (
            <circle
              key={m.nombre}
              cx="60" cy="60" r="44" fill="none" stroke={m.color} strokeWidth="17" pathLength={100}
              strokeDasharray={`${largo - 0.8} ${100 - largo + 0.8}`}
              strokeDashoffset={-inicio}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dasharray .3s, stroke-dashoffset .3s' }}
            />
          )
          inicio += largo
          return anillo
        })}
      </svg>
      <ul className="grid gap-4">
        {macros.map((m) => (
          <li key={m.nombre} className="flex items-baseline justify-between gap-4 border-b border-[#16352a]/15 pb-3">
            <span className="flex items-center gap-2.5 text-lg">
              <span className="size-3 rounded-full" style={{ background: m.color }} />
              {m.nombre}
            </span>
            <span className="tabular-nums">
              <span className="font-fraunces text-3xl">{m.gramos} g</span>
              <span className="ml-3 text-[#16352a]/60">{m.porcentaje} %</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Resumen({ datos, editar }: PropsVariante & { editar: () => void }) {
  const unidadPeso = datos.unidades === 'imperial' ? 'lb' : 'kg'
  const talla = datos.unidades === 'imperial' ? `${datos.talla} pies ${datos.pulgadas || 0} pulg` : `${datos.talla} cm`
  const partes = [
    OBJETIVOS.find((o) => o.valor === datos.objetivo)?.nombre,
    datos.sexo === 'mujer' ? 'Mujer' : 'Hombre',
    `${datos.edad} años`,
    `${datos.peso} ${unidadPeso}`,
    talla,
    ACTIVIDADES.find((a) => a.valor === datos.actividad)?.nombre,
  ]
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {partes.map((p) => (
        <span key={p} className="rounded-full bg-[#fbf3e4]/12 px-3 py-1 text-[#fbf3e4]">{p}</span>
      ))}
      <button onClick={editar} className="cursor-pointer px-2 py-1 text-[#e4a72b] underline underline-offset-4">Editar</button>
    </div>
  )
}

function Pantalla(props: PropsVariante & { resultado: Resultado; editar: () => void }) {
  const { resultado, comidas, ponerComidas } = props
  const plan = planDeComidas(resultado, comidas)
  return (
    <div className="min-h-screen bg-[#fbf3e4] pb-20 font-instrument text-[#16352a]">
      <header className="bg-[#16352a] px-5 pb-20 pt-6 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="font-fraunces text-lg text-[#fbf3e4]">Macros</span>
            <Resumen {...props} />
          </div>
          <p className="text-lg text-[#fbf3e4]/75">Tus calorías objetivo</p>
          <h1 className="font-fraunces text-8xl leading-none text-[#fbf3e4] sm:text-[11rem]">
            {resultado.caloriasObjetivo}<span className="ml-2 align-baseline text-2xl sm:text-4xl">kcal al día</span>
          </h1>
          <p className="mt-5 text-[#fbf3e4]/75">
            Metabolismo en reposo: <b className="font-semibold text-[#fbf3e4]">{resultado.metabolismoEnReposo} kcal</b>
            <span className="mx-2">·</span>
            Gasto diario: <b className="font-semibold text-[#fbf3e4]">{resultado.gastoDiario} kcal</b>
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-10 max-w-5xl px-4 sm:px-8">
        <section className="rounded-3xl bg-[#fffaf0] p-5 shadow-[0_10px_40px_rgba(22,53,42,.12)] sm:p-8">
          <h2 className="mb-6 font-fraunces text-3xl">Tus macros del día</h2>
          <Plato resultado={resultado} />
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-fraunces text-3xl">Tu plan de comidas</h2>
            <ToggleGroup.Root type="single" className="inline-flex rounded-full bg-[#16352a]/8 p-1" value={String(comidas)} onValueChange={(v) => v && ponerComidas(Number(v) as NumeroComidas)} aria-label="Número de comidas">
              {[3, 4, 5].map((n) => (
                <ToggleGroup.Item key={n} value={String(n)} className="cursor-pointer rounded-full px-4 py-1.5 text-sm data-[state=on]:bg-[#16352a] data-[state=on]:text-[#fbf3e4]">{n} comidas</ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </div>
          <ol className="flex flex-col gap-2 sm:flex-row">
            {plan.map((c) => (
              <li key={c.nombre} className="min-w-0 rounded-2xl bg-[#16352a] p-4 text-[#fbf3e4] sm:min-w-[116px]" style={{ flex: `${c.peso} 1 0` }}>
                <div className="flex items-baseline justify-between gap-2 sm:block">
                  <h3 className="text-sm text-[#fbf3e4]/75">{c.nombre}</h3>
                  <p className="font-fraunces text-3xl sm:mt-6">{c.calorias}<span className="ml-1 text-sm">kcal</span></p>
                </div>
                <dl className="mt-3 flex justify-between gap-2 text-sm tabular-nums sm:block sm:space-y-1">
                  <div className="flex flex-wrap gap-x-1.5 sm:justify-between"><dt style={{ color: '#f08a68' }}>Proteína</dt><dd>{c.proteina} g</dd></div>
                  <div className="flex flex-wrap gap-x-1.5 sm:justify-between"><dt style={{ color: COLOR.grasa }}>Grasa</dt><dd>{c.grasa} g</dd></div>
                  <div className="flex flex-wrap gap-x-1.5 sm:justify-between"><dt style={{ color: '#a5cb92' }}>Carbohidratos</dt><dd>{c.carbohidratos} g</dd></div>
                </dl>
              </li>
            ))}
          </ol>
        </section>

        <footer className="mt-12 space-y-1 text-sm text-[#16352a]/65">
          <p>{AVISO_PROVISIONAL}</p>
          <p>{PIE}</p>
        </footer>
      </main>
    </div>
  )
}

export function VarianteB(props: PropsVariante) {
  const [editando, setEditando] = useState(!props.resultado)
  if (editando || !props.resultado) return <Asistente {...props} alTerminar={() => setEditando(false)} />
  return <Pantalla {...props} resultado={props.resultado} editar={() => setEditando(true)} />
}
