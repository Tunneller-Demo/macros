import { readFileSync } from 'node:fs'
import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import html from '../index.html?raw'
import { infraccionesDeAxe } from '@/test/axe'
import {
  abrirApp,
  campoDePies,
  campoDePulgadas,
  opcion,
  recorrerAsistente,
  responderHastaLaActividad,
  type SeisDatos,
  type Usuario,
} from '@/test/recorrer'

const datos: SeisDatos = { objetivo: 'Bajar', sexo: 'Mujer', edad: '35', peso: '65', talla: '165', actividad: 'Sedentaria' }

function titulo() {
  return screen.getByRole('heading', { level: 1 })
}

function campo() {
  return screen.getByRole('textbox')
}

function boton(nombre: string) {
  return screen.getByRole('button', { name: nombre })
}

// Las flechas las mueve Radix en una tarea aparte.
async function pulsarFlecha(user: Usuario, tecla: string, destino: () => HTMLElement) {
  await user.keyboard(tecla)
  await waitFor(() => expect(destino()).toHaveFocus())
}

async function hastaLaEdad(user: Usuario) {
  await user.click(opcion('Bajar'))
  await user.click(opcion('Mujer'))
}

async function hastaElPeso(user: Usuario) {
  await hastaLaEdad(user)
  await user.type(campo(), '35')
  await user.click(boton('Seguir'))
}

async function hastaLaTalla(user: Usuario) {
  await hastaElPeso(user)
  await user.type(campo(), '65')
  await user.click(boton('Seguir'))
}

function hastaLaActividad(user: Usuario) {
  return responderHastaLaActividad(user, datos)
}

describe('Destino del foco', () => {
  it('al abrir, va al título de la primera pregunta', () => {
    abrirApp()

    expect(titulo()).toHaveFocus()
  })

  it('en una pregunta con opciones, el título anuncia el paso y su texto', async () => {
    const user = abrirApp()

    await user.click(opcion('Bajar'))

    expect(titulo()).toHaveFocus()
    expect(titulo()).toHaveAccessibleName('Pregunta 2 de 6. ¿Cuál es tu sexo?')
  })

  it('el grupo de opciones se nombra con su pregunta', () => {
    abrirApp()

    expect(screen.getByRole('radiogroup')).toHaveAccessibleName(/¿Qué quieres hacer con tu peso\?$/)
  })

  it('en la última pregunta, va al título', async () => {
    const user = abrirApp()

    await hastaLaActividad(user)

    expect(titulo()).toHaveFocus()
    expect(titulo()).toHaveAccessibleName('Pregunta 6 de 6. ¿Cómo es tu día a día?')
  })

  it.each([
    ['edad', hastaLaEdad, '¿Cuántos años tienes? años'],
    ['peso', hastaElPeso, '¿Cuánto pesas? kg'],
    ['talla', hastaLaTalla, '¿Cuánto mides? cm'],
  ] as const)('en la %s, va al campo, nombrado con la pregunta y la unidad', async (_, llegar, nombre) => {
    const user = abrirApp()

    await llegar(user)

    expect(campo()).toHaveFocus()
    expect(campo()).toHaveAccessibleName(nombre)
  })

  it('en la talla imperial, va a los pies, y las pulgadas se nombran con su unidad', async () => {
    const user = abrirApp()
    await hastaElPeso(user)
    await user.click(opcion('Imperiales'))
    await user.type(campo(), '143')

    await user.click(boton('Seguir'))

    expect(campoDePies()).toHaveFocus()
    expect(campoDePies()).toHaveAccessibleName('¿Cuánto mides? pies')
    expect(campoDePulgadas()).toHaveAccessibleName('¿Cuánto mides? pulgadas')
  })

  it('Atrás lleva a la pregunta anterior con el mismo destino', async () => {
    const user = abrirApp()
    await hastaElPeso(user)

    await user.click(boton('Atrás'))
    expect(campo()).toHaveFocus()

    await user.click(boton('Atrás'))
    expect(titulo()).toHaveFocus()
  })

  it('cambiar de unidades no se lleva el foco', async () => {
    const user = abrirApp()
    await hastaElPeso(user)

    await user.click(opcion('Imperiales'))

    expect(opcion('Imperiales')).toHaveFocus()
  })

  it('en resultados, va a «Tus calorías objetivo»', async () => {
    await recorrerAsistente(datos)

    expect(screen.getByRole('heading', { name: 'Tus calorías objetivo' })).toHaveFocus()
  })

  it('con Editar, va al título de la primera pregunta', async () => {
    const user = await recorrerAsistente(datos)

    await user.click(boton('Editar'))

    expect(titulo()).toHaveFocus()
    expect(titulo()).toHaveAccessibleName('Pregunta 1 de 6. ¿Qué quieres hacer con tu peso?')
  })

  it('Seguir con un error en opciones lleva a la primera opción', async () => {
    const user = abrirApp()

    await user.click(boton('Seguir'))

    expect(opcion('Bajar')).toHaveFocus()
  })

  it('Seguir con un error en un número lleva al campo', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)

    await user.click(boton('Seguir'))

    expect(campo()).toHaveFocus()
  })

  it('Seguir con un error en la talla imperial lleva a los pies', async () => {
    const user = abrirApp()
    await hastaLaTalla(user)
    await user.click(opcion('Imperiales'))

    await user.click(boton('Seguir'))

    expect(campoDePies()).toHaveFocus()
  })
})

describe('Teclado', () => {
  it('las flechas solo mueven el foco; Enter elige y avanza', async () => {
    const user = abrirApp()
    await user.tab()
    expect(opcion('Bajar')).toHaveFocus()

    await pulsarFlecha(user, '{ArrowDown}', () => opcion('Mantener'))

    expect(titulo()).toHaveAccessibleName(/¿Qué quieres hacer con tu peso\?$/)
    expect(opcion('Bajar')).not.toBeChecked()
    expect(opcion('Mantener')).not.toBeChecked()

    await user.keyboard('{Enter}')
    expect(titulo()).toHaveAccessibleName(/¿Cuál es tu sexo\?$/)

    await user.click(boton('Atrás'))
    expect(opcion('Mantener')).toBeChecked()
  })

  it('Espacio también elige y avanza', async () => {
    const user = abrirApp()
    await user.tab()

    await user.keyboard(' ')

    expect(titulo()).toHaveAccessibleName(/¿Cuál es tu sexo\?$/)

    await user.click(boton('Atrás'))
    expect(opcion('Bajar')).toBeChecked()
  })

  it('en la nueva pregunta, Tab entra en la primera opción, no en la posición anterior', async () => {
    const user = abrirApp()
    await user.tab()
    await pulsarFlecha(user, '{ArrowDown}', () => opcion('Mantener'))
    await pulsarFlecha(user, '{ArrowDown}', () => opcion('Subir'))
    await user.keyboard('{Enter}')

    await user.tab()

    expect(opcion('Mujer')).toHaveFocus()
  })

  it('en la última pregunta, Enter elige sin avanzar', async () => {
    const user = abrirApp()
    await hastaLaActividad(user)
    await user.tab()

    await user.keyboard('{Enter}')

    expect(opcion('Sedentaria')).toBeChecked()
    expect(titulo()).toHaveAccessibleName(/¿Cómo es tu día a día\?$/)
  })

  it('Atrás se alcanza y se usa con el teclado', async () => {
    const user = abrirApp()
    await user.keyboard('{Tab}{Enter}')
    await user.tab()
    await user.tab()
    expect(boton('Atrás')).toHaveFocus()

    await user.keyboard('{Enter}')

    expect(titulo()).toHaveAccessibleName(/¿Qué quieres hacer con tu peso\?$/)
  })

  it('Atrás sigue disponible con un error visible', async () => {
    const user = abrirApp()
    await hastaLaEdad(user)
    await user.keyboard('{Enter}')
    expect(screen.getByRole('alert')).not.toBeEmptyDOMElement()

    await user.tab()
    expect(boton('Atrás')).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(titulo()).toHaveAccessibleName(/¿Cuál es tu sexo\?$/)
  })

  it('se recorre toda la app sin ratón: asistente, unidades, resultados, comidas y Editar', async () => {
    const user = abrirApp()
    await user.keyboard('{Tab}{Enter}')
    await user.keyboard('{Tab} ')
    await user.keyboard('35{Enter}')

    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(opcion('Métricas')).toHaveFocus()
    await pulsarFlecha(user, '{ArrowRight}', () => opcion('Imperiales'))
    await user.keyboard('{Enter}')
    expect(opcion('Imperiales')).toBeChecked()
    await pulsarFlecha(user, '{ArrowLeft}', () => opcion('Métricas'))
    await user.keyboard(' ')
    expect(opcion('Métricas')).toBeChecked()

    await user.tab()
    await user.keyboard('65{Enter}')
    await user.keyboard('165{Enter}')
    await user.keyboard('{Tab} ')
    await user.tab()
    await user.tab()
    expect(boton('Ver mi plan')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('heading', { name: 'Tus calorías objetivo' })).toHaveFocus()

    await user.tab()
    expect(opcion('4 comidas')).toHaveFocus()
    await pulsarFlecha(user, '{ArrowRight}', () => opcion('5 comidas'))
    await user.keyboard('{Enter}')
    expect(opcion('5 comidas')).toBeChecked()

    await user.tab({ shift: true })
    expect(boton('Editar')).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(titulo()).toHaveAccessibleName(/¿Qué quieres hacer con tu peso\?$/)
    expect(titulo()).toHaveFocus()
  })
})

describe('Documento', () => {
  it('declara el idioma español', () => {
    expect(html).toMatch(/<html[^>]*\blang="es"/)
  })
})

describe('Metadatos para compartir', () => {
  const TITULO = 'Calculadora de macros'
  const DESCRIPCION =
    'Responde seis preguntas y descubre tus calorías, tus macros y cómo repartirlos entre tus comidas. Sin cuentas y sin guardar tus datos.'
  const URL_DE_LA_IMAGEN = 'https://tunneller-demo.github.io/macros/og-imagen.png'

  const documento = new DOMParser().parseFromString(html, 'text/html')
  const contenidoDeMeta = (atributo: string) =>
    documento.querySelector(`meta[${atributo}]`)?.getAttribute('content')
  const metaPorPropiedad = (propiedad: string) => contenidoDeMeta(`property="${propiedad}"`)
  const metaPorNombre = (nombre: string) => contenidoDeMeta(`name="${nombre}"`)
  const publico = (archivo: string) => readFileSync(`public/${archivo}`)

  it('da el título y la descripción a las tarjetas', () => {
    expect(documento.title).toBe(TITULO)
    expect(metaPorNombre('description')).toBe(DESCRIPCION)
    expect(metaPorPropiedad('og:title')).toBe(TITULO)
    expect(metaPorPropiedad('og:description')).toBe(DESCRIPCION)
    expect(metaPorNombre('twitter:title')).toBe(TITULO)
    expect(metaPorNombre('twitter:description')).toBe(DESCRIPCION)
  })

  it('identifica la página en Open Graph y pide la tarjeta grande de Twitter', () => {
    expect(metaPorPropiedad('og:type')).toBe('website')
    expect(metaPorPropiedad('og:url')).toBe('https://tunneller-demo.github.io/macros/')
    expect(metaPorPropiedad('og:locale')).toBe('es_ES')
    expect(metaPorNombre('twitter:card')).toBe('summary_large_image')
  })

  it('publica la imagen con URL absoluta y texto alternativo', () => {
    expect(metaPorPropiedad('og:image')).toBe(URL_DE_LA_IMAGEN)
    expect(metaPorNombre('twitter:image')).toBe(URL_DE_LA_IMAGEN)
    expect(metaPorPropiedad('og:image:alt')).toBeTruthy()
    expect(metaPorNombre('twitter:image:alt')).toBe(metaPorPropiedad('og:image:alt'))
  })

  it('la imagen es un PNG de 1200×630', () => {
    const imagen = publico('og-imagen.png')

    expect(imagen.subarray(1, 4).toString()).toBe('PNG')
    expect([imagen.readUInt32BE(16), imagen.readUInt32BE(20)]).toEqual([1200, 630])
    expect(metaPorPropiedad('og:image:type')).toBe('image/png')
    expect(metaPorPropiedad('og:image:width')).toBe('1200')
    expect(metaPorPropiedad('og:image:height')).toBe('630')
  })

  it('el favicon es el plato, con los tres colores de los macros', () => {
    const favicon = documento.querySelector('link[rel="icon"]')

    expect(favicon?.getAttribute('href')).toBe('/favicon.svg')
    expect(favicon?.getAttribute('type')).toBe('image/svg+xml')

    const svg = publico('favicon.svg').toString()
    for (const color of ['#d9512c', '#e4a72b', '#6f9a5c']) expect(svg).toContain(color)
  })
})

describe('axe', () => {
  const pantallas = {
    'la primera pregunta': async () => {},
    'una pregunta con opciones': async (user: Usuario) => {
      await user.click(opcion('Bajar'))
    },
    'una pregunta numérica': hastaLaEdad,
    'el peso, con su selector de unidades': hastaElPeso,
    'la talla imperial': async (user: Usuario) => {
      await hastaLaTalla(user)
      await user.click(opcion('Imperiales'))
    },
    'la última pregunta': hastaLaActividad,
  }

  it.each(Object.entries(pantallas))('pasa en %s', async (_, llegar) => {
    const user = abrirApp()
    await llegar(user)

    expect(await infraccionesDeAxe()).toEqual([])
  })

  it.each(Object.entries(pantallas))('pasa en %s con un mensaje de error', async (_, llegar) => {
    const user = abrirApp()
    await llegar(user)
    await user.click(screen.getByRole('button', { name: /^(Seguir|Ver mi plan)$/ }))

    expect(screen.getByRole('alert')).not.toBeEmptyDOMElement()
    expect(await infraccionesDeAxe()).toEqual([])
  })

  it('pasa en resultados', async () => {
    await recorrerAsistente(datos)

    expect(await infraccionesDeAxe()).toEqual([])
  })

  it('pasa en resultados con el mensaje de una regla', async () => {
    await recorrerAsistente({ objetivo: 'Bajar', sexo: 'Mujer', edad: '25', peso: '40', talla: '165', actividad: 'Muy activa' })

    expect(screen.getByText(/no proponemos bajar/)).toBeVisible()
    expect(await infraccionesDeAxe()).toEqual([])
  })
})
