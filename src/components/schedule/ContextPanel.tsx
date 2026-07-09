/**
 * ContextPanel — Resumen del horario (drawer / bottom sheet)
 */
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  LayoutDashboard,
  Plus,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useDataTrustInfo } from '@/components/ui/DataTrustBanner'
import { ROUTES } from '@/config/constants'
import { useChanges } from '@/hooks/useChanges'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { buildContextPillLabel } from '@/components/schedule/ScheduleContextSelector'
import {
  filterActivityByKind,
  formatActivityTime,
  getActivityDetail,
  getActivityHeadline,
  groupChangesByActivityRecency,
  type ActivityKindFilter,
} from '@/utils/changes'
import { formatUpdatedLong } from '@/utils/dates'
import { getDayLabel } from '@/utils/dates'
import {
  collectExamItems,
  formatExamTypeLabel,
  groupUpcomingExamsByRecency,
  type ExamItem,
} from '@/utils/exams'
import { formatTimeRange } from '@/utils/times'
import type {
  AcademicPeriod,
  Career,
  CourseSection,
  ScheduleChange,
  ScheduleConflict,
} from '@/types/academic'

type PanelTab = 'resumen' | 'examenes' | 'actividad'
type PanelView = 'tabs' | 'activity-all'

export interface ContextPanelProps {
  activePeriod: AcademicPeriod | null
  selectedCareer: Career | undefined
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  coursesById: Map<string, { name: string; code: string | null }>
  lastUpdated: string | null
  scheduleName?: string
  onClose?: () => void
  onAddFirstCourse?: () => void
  presentation?: 'drawer' | 'sheet'
  returnFocusRef?: RefObject<HTMLElement | null>
}

function weeklyHours(sections: CourseSection[]): number {
  const minutes = sections.reduce((acc, section) => {
    return (
      acc +
      section.meetings.reduce((mAcc, meeting) => {
        const start = meeting.startTime
          .split(':')
          .reduce((h, v, i) => h + (i === 0 ? +v * 60 : +v), 0)
        const end = meeting.endTime
          .split(':')
          .reduce((h, v, i) => h + (i === 0 ? +v * 60 : +v), 0)
        return mAcc + Math.max(0, end - start)
      }, 0)
    )
  }, 0)
  return Math.round(minutes / 60)
}

function getNextClassLabel(
  sections: CourseSection[],
  coursesById: Map<string, { name: string; code: string | null }>,
): string | null {
  const now = new Date()
  const currentDay = ((now.getDay() + 6) % 7) + 1 // Mon=1 … Sat=6, Sun=7
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  type Candidate = { day: number; start: string; end: string; courseId: string }
  const candidates: Candidate[] = []

  for (const section of sections) {
    for (const meeting of section.meetings) {
      candidates.push({
        day: meeting.dayOfWeek,
        start: meeting.startTime,
        end: meeting.endTime,
        courseId: section.courseId,
      })
    }
  }

  if (candidates.length === 0) return null

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
  }

  candidates.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day
    return a.start.localeCompare(b.start)
  })

  const upcoming =
    candidates.find(
      (c) => c.day > currentDay || (c.day === currentDay && toMinutes(c.start) >= currentMinutes),
    ) ?? candidates[0]

  if (!upcoming) return null

  const dayLabel =
    upcoming.day === currentDay
      ? 'Hoy'
      : upcoming.day === currentDay + 1 || (currentDay === 7 && upcoming.day === 1)
        ? 'Mañana'
        : getDayLabel(upcoming.day)

  const courseName = coursesById.get(upcoming.courseId)?.name
  const when = `${dayLabel} · ${formatTimeRange(upcoming.start, upcoming.end)}`
  return courseName ? `${courseName} · ${when}` : when
}

export function ContextPanel({
  activePeriod,
  selectedCareer,
  selectedSections,
  conflicts: _conflicts,
  coursesById,
  lastUpdated,
  scheduleName = 'Mi horario',
  onClose,
  onAddFirstCourse,
  presentation = 'drawer',
  returnFocusRef,
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('resumen')
  const [view, setView] = useState<PanelView>('tabs')
  const [activityFilter, setActivityFilter] = useState<ActivityKindFilter>('all')
  const panelRef = useRef<HTMLDivElement>(null)
  const tablistId = useId()
  const { changes, unseenCount } = useChanges()
  const isSheet = presentation === 'sheet'
  const padX = isSheet ? 'px-5' : 'px-6'

  useFocusTrap(true, panelRef, onClose, returnFocusRef)

  useEffect(() => {
    if (view === 'tabs') setActivityFilter('all')
  }, [view])

  const careerLabel = selectedCareer?.code ?? selectedCareer?.name
  const contextLabel = buildContextPillLabel(careerLabel, activePeriod?.name ?? null)
  const metaLine = `${scheduleName} · ${contextLabel}`

  const tabs: { id: PanelTab; label: string; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'examenes', label: 'Exámenes' },
    { id: 'actividad', label: 'Actividad', badge: unseenCount },
  ]

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const nextIndex =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : null

    if (nextIndex == null) return
    event.preventDefault()
    const next = tabs[nextIndex]
    if (!next) return
    setActiveTab(next.id)
    const button = document.getElementById(`${tablistId}-${next.id}`)
    button?.focus()
  }

  return (
    <div
      ref={panelRef}
      className="flex h-full min-h-0 flex-col bg-white outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Resumen del horario"
      tabIndex={-1}
    >
      {isSheet && (
        <div className="flex shrink-0 justify-center pt-2" aria-hidden="true">
          <div className="h-1 w-9 rounded-full bg-slate-200" />
        </div>
      )}

      <header
        className={`shrink-0 border-b border-slate-100/90 ${padX} ${
          isSheet ? 'pt-1.5' : 'pt-5'
        }`}
      >
        <div className="flex items-center gap-2">
          {view === 'activity-all' ? (
            <button
              type="button"
              onClick={() => setView('tabs')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Volver al resumen"
              data-autofocus
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <LayoutDashboard
              className="h-4 w-4 shrink-0 text-slate-500"
              aria-hidden="true"
            />
          )}

          <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold leading-tight tracking-tight text-slate-900">
            {view === 'activity-all' ? 'Actividad' : 'Resumen del horario'}
          </h2>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Cerrar resumen del horario"
              data-autofocus={view === 'tabs' ? true : undefined}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <p className="mt-1 truncate text-[13px] leading-snug text-slate-500">{metaLine}</p>

        {view === 'tabs' && (
          <div
            className="mt-[18px] flex gap-5"
            role="tablist"
            aria-label="Secciones del resumen"
          >
            {tabs.map((tab, index) => {
              const selected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  id={`${tablistId}-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${tablistId}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`relative pb-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                    selected ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {view === 'activity-all' && (
          <div
            className="mt-[18px] flex gap-4"
            role="tablist"
            aria-label="Filtros de actividad"
          >
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'added', label: 'Agregados' },
                { id: 'changed', label: 'Cambios' },
                { id: 'removed', label: 'Eliminados' },
              ] as const
            ).map((filter) => {
              const selected = activityFilter === filter.id
              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActivityFilter(filter.id)}
                  className={`relative pb-2.5 text-[12px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    selected ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {filter.label}
                  {selected && (
                    <span
                      className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {view === 'activity-all' ? (
          <ActivityFullView
            changes={changes}
            filter={activityFilter}
            padX={padX}
          />
        ) : (
          <>
            <div
              id={`${tablistId}-panel-resumen`}
              role="tabpanel"
              hidden={activeTab !== 'resumen'}
              className={activeTab === 'resumen' ? '' : 'hidden'}
            >
              <ResumenTab
                activePeriod={activePeriod}
                selectedCareer={selectedCareer}
                selectedSections={selectedSections}
                coursesById={coursesById}
                lastUpdated={lastUpdated}
                padX={padX}
                onAddFirstCourse={onAddFirstCourse}
              />
            </div>
            <div
              id={`${tablistId}-panel-examenes`}
              role="tabpanel"
              hidden={activeTab !== 'examenes'}
              className={activeTab === 'examenes' ? '' : 'hidden'}
            >
              <ExamenesTab
                selectedSections={selectedSections}
                coursesById={coursesById}
                padX={padX}
                onNavigate={onClose}
              />
            </div>
            <div
              id={`${tablistId}-panel-actividad`}
              role="tabpanel"
              hidden={activeTab !== 'actividad'}
              className={activeTab === 'actividad' ? '' : 'hidden'}
            >
              <ActividadTab
                changes={changes}
                padX={padX}
                onSeeAll={() => setView('activity-all')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ResumenTab({
  activePeriod,
  selectedCareer,
  selectedSections,
  coursesById,
  lastUpdated,
  padX,
  onAddFirstCourse,
}: {
  activePeriod: AcademicPeriod | null
  selectedCareer: Career | undefined
  selectedSections: CourseSection[]
  coursesById: Map<string, { name: string; code: string | null }>
  lastUpdated: string | null
  padX: string
  onAddFirstCourse?: () => void
}) {
  const uniqueCourses = new Set(selectedSections.map((s) => s.courseId)).size
  const hours = weeklyHours(selectedSections)
  const nextClass = getNextClassLabel(selectedSections, coursesById)
  const trust = useDataTrustInfo()
  const updatedAt = lastUpdated ?? trust?.downloadedAt ?? null
  const isRecent = trust
    ? Date.now() - new Date(trust.downloadedAt).getTime() < 7 * 24 * 60 * 60 * 1000
    : Boolean(updatedAt)

  if (selectedSections.length === 0) {
    return (
      <div className={`${padX} py-6`}>
        <p className="text-[15px] font-semibold text-slate-900">Tu horario todavía está vacío</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Agregá materias para empezar a organizar tus clases y ver un resumen del semestre.
        </p>
        {onAddFirstCourse && (
          <button
            type="button"
            onClick={onAddFirstCourse}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-medium text-white transition hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Agregar primera materia
          </button>
        )}
      </div>
    )
  }

  const materiaLabel = uniqueCourses === 1 ? '1 materia' : `${uniqueCourses} materias`
  const hoursLabel = `${hours} h semanales`

  return (
    <div className={`${padX} space-y-3 py-4`}>
      <div className="rounded-xl bg-slate-50/90 px-3.5 py-2.5 text-[13px] font-medium text-slate-700">
        {materiaLabel} · {hoursLabel}
      </div>

      <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100/80">
        <SummaryRow label="Próxima clase" value={nextClass ?? 'Sin clases cargadas'} />
        <SummaryRow label="Periodo" value={activePeriod?.name ?? 'Sin periodo'} />
        <SummaryRow
          label="Carrera"
          value={
            selectedCareer
              ? selectedCareer.code
                ? `${selectedCareer.code} · ${selectedCareer.name}`
                : selectedCareer.name
              : 'Sin carrera'
          }
        />
      </dl>

      <section className="flex items-start gap-2 rounded-xl bg-slate-50/70 px-3 py-2.5">
        {isRecent ? (
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : (
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden="true" />
        )}
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-800">
            {isRecent ? 'Datos verificados' : 'Datos desactualizados'}
          </p>
          {updatedAt && (
            <p className="mt-0.5 text-[12px] text-slate-500">
              Actualizado el {formatUpdatedLong(updatedAt)}
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 px-3 py-2">
      <dt className="shrink-0 text-[12px] text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-medium leading-snug text-slate-800">
        {value}
      </dd>
    </div>
  )
}

function ExamenesTab({
  selectedSections,
  coursesById,
  padX,
  onNavigate,
}: {
  selectedSections: CourseSection[]
  coursesById: Map<string, { name: string; code: string | null }>
  padX: string
  onNavigate?: () => void
}) {
  const groups = useMemo(() => {
    const items = collectExamItems(selectedSections, coursesById)
    return groupUpcomingExamsByRecency(items)
  }, [selectedSections, coursesById])

  if (groups.length === 0) {
    return (
      <div className={`${padX} py-6`}>
        <p className="text-[15px] font-semibold text-slate-900">No tenés exámenes próximos</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Cuando agregues fechas de examen, van a aparecer acá.
        </p>
        <Link
          to={ROUTES.exams}
          onClick={onNavigate}
          className="mt-4 inline-flex text-[13px] font-medium text-primary transition hover:underline"
        >
          Ver todos →
        </Link>
      </div>
    )
  }

  return (
    <div className={`${padX} space-y-4 py-4`}>
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-1.5 text-[13px] font-semibold text-slate-900">{group.label}</h3>
          <ul className="space-y-1.5">
            {group.exams.map((exam) => (
              <li key={exam.id}>
                <ExamCompactCard exam={exam} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex justify-end">
        <Link
          to={ROUTES.exams}
          onClick={onNavigate}
          className="text-[13px] font-medium text-primary transition hover:underline"
        >
          Ver todos →
        </Link>
      </div>
    </div>
  )
}

function ExamCompactCard({ exam }: { exam: ExamItem }) {
  const time =
    exam.startTime && exam.endTime
      ? formatTimeRange(exam.startTime, exam.endTime)
      : exam.startTime ?? null

  return (
    <article className="flex max-h-[72px] flex-col justify-center rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[13px] font-semibold text-slate-900">{exam.courseName}</p>
        <span className="shrink-0 text-[11px] font-medium text-slate-500">
          {formatExamTypeLabel(exam.examType)}
        </span>
      </div>
      <p className="mt-0.5 truncate text-[12px] text-slate-500">
        {[
          exam.examDate
            ? new Date(`${exam.examDate}T12:00:00`).toLocaleDateString('es-PY', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })
            : null,
          time,
          exam.classroom,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
    </article>
  )
}

function ActividadTab({
  changes,
  padX,
  onSeeAll,
}: {
  changes: ScheduleChange[]
  padX: string
  onSeeAll: () => void
}) {
  const preview = changes.slice(0, 5)
  const groups = groupChangesByActivityRecency(preview)

  if (changes.length === 0) {
    return (
      <div className={`${padX} py-6`}>
        <p className="text-[15px] font-semibold text-slate-900">Sin actividad reciente</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
          Te avisaremos cuando haya actualizaciones en tus materias.
        </p>
      </div>
    )
  }

  return (
    <div className={`${padX} py-3`}>
      <ActivityList groups={groups} compact />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[13px] font-medium text-primary transition hover:underline"
        >
          Ver toda la actividad →
        </button>
      </div>
    </div>
  )
}

function ActivityFullView({
  changes,
  filter,
  padX,
}: {
  changes: ScheduleChange[]
  filter: ActivityKindFilter
  padX: string
}) {
  const filtered = filterActivityByKind(changes, filter)
  const groups = groupChangesByActivityRecency(filtered)

  if (filtered.length === 0) {
    return (
      <div className={`${padX} py-6`}>
        <p className="text-[15px] font-semibold text-slate-900">Sin actividad en este filtro</p>
        <p className="mt-1.5 text-[13px] text-slate-500">Probá con otro filtro para ver más registros.</p>
      </div>
    )
  }

  return (
    <div className={`${padX} py-3`}>
      <ActivityList groups={groups} compact />
    </div>
  )
}

function ActivityList({
  groups,
  compact = false,
}: {
  groups: Array<{ label: string; changes: ScheduleChange[] }>
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {groups.map((group) => (
        <section key={group.label}>
          <h3 className="mb-0.5 text-[13px] font-semibold text-slate-900">{group.label}</h3>
          <ul className="divide-y divide-slate-100">
            {group.changes.map((change) => (
              <li
                key={change.id}
                className={`flex items-start justify-between gap-3 ${compact ? 'py-1.5' : 'py-2'}`}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium leading-snug text-slate-800">
                    {getActivityHeadline(change)}
                  </p>
                  {getActivityDetail(change) && (
                    <p className="mt-px truncate text-[12px] text-slate-500">
                      {getActivityDetail(change)}
                    </p>
                  )}
                </div>
                <time
                  className="shrink-0 text-[11px] tabular-nums text-slate-400"
                  dateTime={change.detectedAt}
                >
                  {formatActivityTime(change.detectedAt)}
                </time>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
