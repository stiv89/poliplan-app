import type { ReactNode } from 'react'

export interface TourStep {
  id: string
  target?: string
  title: string
  description: string
  hint?: string
  visual: ReactNode
  onEnter?: () => void
}

export function CareerPickerMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 text-xs">
        <span className="rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-600">Mi horario</span>
        <span className="text-slate-300">›</span>
        <span className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary ring-2 ring-primary/30">
          Carrera: IIN
        </span>
      </div>
      <div className="space-y-1 p-2">
        {['IIN — Ing. Informática', 'IAR — Ing. Ambiental'].map((item, index) => (
          <div
            key={item}
            className={`rounded-lg px-2 py-1.5 text-[11px] ${index === 0 ? 'bg-primary/8 font-semibold text-primary' : 'text-slate-500'}`}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoursePanelMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <div className="rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-muted">Buscar materia…</div>
      </div>
      <div className="space-y-1.5 p-2">
        {[
          { code: 'INF110', name: 'Intro. a la Informática', sem: '1° sem' },
          { code: 'MAT120', name: 'Matemática I', sem: '1° sem' },
        ].map((course) => (
          <div key={course.code} className="flex items-center gap-2 rounded-lg border border-slate-100 px-2 py-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-text">{course.code}</p>
              <p className="truncate text-[10px] text-muted">{course.name}</p>
            </div>
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-white">+</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ScheduleGridMock() {
  const blocks = [
    { day: 'Lun', time: '08:00', color: 'bg-sky-100 text-sky-800' },
    { day: 'Mar', time: '10:00', color: 'bg-violet-100 text-violet-800' },
    { day: 'Jue', time: '14:00', color: 'bg-emerald-100 text-emerald-800' },
  ]
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-4 gap-px bg-slate-100 p-px">
        {['', 'Lun', 'Mar', 'Jue'].map((label) => (
          <div key={label || 'time'} className="bg-white px-1 py-1 text-center text-[10px] font-medium text-muted">
            {label}
          </div>
        ))}
        {blocks.map((block) => (
          <div key={block.day + block.time} className="contents">
            <div className="bg-white px-1 py-2 text-[10px] text-muted">{block.time}</div>
            <div className={`col-span-1 rounded-md m-0.5 px-1 py-2 text-center text-[10px] font-semibold ${block.color}`}>
              INF110
            </div>
            {block.day === 'Lun' && <div className="bg-white" />}
            {block.day === 'Mar' && (
              <div className={`rounded-md m-0.5 px-1 py-2 text-center text-[10px] font-semibold ${block.color}`}>
                MAT120
              </div>
            )}
            {block.day === 'Jue' && (
              <>
                <div className="bg-white" />
                <div className={`rounded-md m-0.5 px-1 py-2 text-center text-[10px] font-semibold ${block.color}`}>
                  FIS100
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function SummaryMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-text">Resumen</div>
      <div className="space-y-2 p-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-muted">Materias</span>
          <span className="font-semibold text-text">4</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Conflictos</span>
          <span className="font-semibold text-emerald-600">0</span>
        </div>
        <div className="rounded-lg bg-amber-50 px-2 py-1.5 text-amber-800">Próximo examen: MAT120 · Vie 14:00</div>
      </div>
    </div>
  )
}

export function NavMock({ mobile = false }: { mobile?: boolean }) {
  const items = [
    { label: 'Horario', active: true },
    { label: 'Exámenes', active: false },
    { label: 'Notas', active: false },
    { label: 'Progreso', active: false },
  ]
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
        mobile ? 'px-2 py-2' : 'px-2 py-3'
      }`}
    >
      <div className={`flex ${mobile ? 'justify-around' : 'flex-col gap-1'}`}>
        {items.map((item) => (
          <div
            key={item.label}
            className={`rounded-lg px-2 py-1.5 text-center text-[10px] font-medium ${
              item.active ? 'bg-primary/10 text-primary' : 'text-slate-500'
            }`}
          >
            <div
              className={`mx-auto mb-0.5 h-4 w-4 rounded-md ${item.active ? 'bg-primary/30' : 'bg-slate-200'}`}
              aria-hidden="true"
            />
            {item.label}
          </div>
        ))}
      </div>
    </div>
  )
}

export function FabMock() {
  return (
    <div className="flex justify-end p-2">
      <div className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-white shadow-lg">
        <span className="text-base leading-none">+</span>
        Agregar materia
      </div>
    </div>
  )
}

export function DayTabsMock() {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      {['Lun', 'Mar', 'Mié', 'Jue', 'Vie'].map((day, index) => (
        <div
          key={day}
          className={`flex-1 rounded-lg py-1.5 text-center text-[10px] font-semibold ${
            index === 1 ? 'bg-primary text-white' : 'text-slate-500'
          }`}
        >
          {day}
        </div>
      ))}
    </div>
  )
}

export function WelcomeMock() {
  return (
    <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-white p-4">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
        P
      </div>
      <p className="mt-3 text-center text-xs font-medium text-text">Horarios oficiales FP-UNA</p>
      <p className="mt-1 text-center text-[11px] text-muted">Armá, compará y llevá tu plan de estudio</p>
    </div>
  )
}

export const DESKTOP_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a PoliPlan!',
    description:
      'Te mostramos en un minuto cómo armar tu horario con datos oficiales de la Facultad Politécnica.',
    visual: <WelcomeMock />,
  },
  {
    id: 'career',
    target: '[data-tour="career-picker"]',
    title: 'Primero, elegí tu carrera',
    description: 'Así cargamos las materias y secciones que corresponden a tu plan de estudios.',
    hint: 'Tocá «Elegir carrera» para ver el listado.',
    visual: <CareerPickerMock />,
    onEnter: () => {
      /* se abre al avanzar desde el paso anterior si el usuario quiere */
    },
  },
  {
    id: 'courses',
    target: '[data-tour="course-panel"]',
    title: 'Buscá y agregá materias',
    description: 'Filtrá por semestre, compará secciones y sumalas a tu horario con un clic.',
    hint: 'Cada materia muestra horarios, docente y aula.',
    visual: <CoursePanelMock />,
  },
  {
    id: 'grid',
    target: '[data-tour="schedule-grid"]',
    title: 'Mirá tu semana completa',
    description: 'El calendario detecta choques de horario y te avisa si dos clases se pisan.',
    visual: <ScheduleGridMock />,
  },
  {
    id: 'summary',
    target: '[data-tour="schedule-summary"]',
    title: 'Resumen y exámenes',
    description: 'Abrí el panel de info para ver materias cargadas, conflictos y fechas de examen.',
    visual: <SummaryMock />,
  },
  {
    id: 'nav',
    target: '[data-tour="app-nav"]',
    title: 'Explorá el resto de la app',
    description: 'Desde acá accedés a exámenes, calculadora de notas, progreso académico y novedades.',
    visual: <NavMock />,
  },
]

export const MOBILE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a PoliPlan!',
    description: 'Armá tu horario desde el celular con los mismos datos oficiales de la facultad.',
    visual: <WelcomeMock />,
  },
  {
    id: 'career',
    target: '[data-tour="career-picker"]',
    title: 'Elegí tu carrera',
    description: 'Empezá acá para ver las materias de tu carrera en el periodo activo.',
    hint: 'Tocá «Elegir carrera» arriba.',
    visual: <CareerPickerMock />,
  },
  {
    id: 'fab',
    target: '[data-tour="add-course-fab"]',
    title: 'Agregá materias',
    description: 'Usá el botón flotante + para buscar secciones y sumarlas al horario.',
    visual: <FabMock />,
  },
  {
    id: 'days',
    target: '[data-tour="day-selector"]',
    title: 'Navegá por día',
    description: 'En mobile ves una columna por día. Cambiá con las pestañas Lun–Vie.',
    visual: <DayTabsMock />,
  },
  {
    id: 'nav',
    target: '[data-tour="app-nav"]',
    title: 'Menú inferior',
    description: 'Exámenes, notas, progreso y novedades están en la barra de abajo.',
    visual: <NavMock mobile />,
  },
]
