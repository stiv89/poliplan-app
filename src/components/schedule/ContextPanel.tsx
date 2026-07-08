/**
 * ContextPanel — Resumen, exámenes y cambios (drawer bajo demanda)
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Calendar, X } from 'lucide-react'
import { DataTrustFooter } from '@/components/ui/DataTrustBanner'
import { ROUTES } from '@/config/constants'
import { useChanges } from '@/hooks/useChanges'
import { formatDate } from '@/utils/dates'
import { formatTimeRange } from '@/utils/times'
import type {
  AcademicPeriod,
  Career,
  CourseSection,
  Exam,
  ScheduleConflict,
} from '@/types/academic'

type PanelTab = 'resumen' | 'examenes' | 'cambios'

interface ContextPanelProps {
  activePeriod: AcademicPeriod | null
  selectedCareer: Career | undefined
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  coursesById: Map<string, { name: string; code: string | null }>
  lastUpdated: string | null
  onClose?: () => void
}

type ExamItem = Exam & {
  courseName: string
  sectionCode: string
}

function collectExams(
  selectedSections: CourseSection[],
  coursesById: Map<string, { name: string; code: string | null }>,
): ExamItem[] {
  return selectedSections
    .flatMap((section) => {
      const course = coursesById.get(section.courseId)
      return section.exams.map((exam) => ({
        ...exam,
        courseName: course?.name ?? 'Materia',
        sectionCode: section.sectionCode,
      }))
    })
    .filter((exam) => exam.examDate)
    .sort((a, b) => (a.examDate ?? '').localeCompare(b.examDate ?? ''))
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
        return mAcc + (end - start)
      }, 0)
    )
  }, 0)
  return Math.round(minutes / 60)
}

export function ContextPanel({
  activePeriod,
  selectedCareer,
  selectedSections,
  conflicts,
  coursesById,
  lastUpdated,
  onClose,
}: ContextPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('resumen')
  const { changes, unseenCount } = useChanges()

  const tabs: { id: PanelTab; label: string; badge?: number }[] = [
    { id: 'resumen', label: 'Resumen' },
    { id: 'examenes', label: 'Exámenes' },
    { id: 'cambios', label: 'Cambios', badge: unseenCount },
  ]

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="shrink-0 px-3 pt-2 pb-2">
        {onClose && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-muted transition hover:bg-slate-100 hover:text-text"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div
          className="flex gap-0.5 rounded-lg bg-slate-100/80 p-0.5"
          role="tablist"
          aria-label="Secciones del resumen"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              className={`relative flex-1 rounded-md py-1.5 text-[11px] font-medium transition ${
                activeTab === tab.id
                  ? 'bg-white text-text shadow-sm'
                  : 'text-muted hover:text-slate-700'
              }`}
            >
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-500 px-0.5 text-[8px] font-bold text-white">
                  {tab.badge > 9 ? '9+' : tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'resumen' && (
          <ResumenTab
            activePeriod={activePeriod}
            selectedCareer={selectedCareer}
            selectedSections={selectedSections}
            conflicts={conflicts}
            coursesById={coursesById}
            lastUpdated={lastUpdated}
          />
        )}
        {activeTab === 'examenes' && (
          <ExamenesTab selectedSections={selectedSections} coursesById={coursesById} />
        )}
        {activeTab === 'cambios' && <CambiosTab changes={changes} />}
      </div>
    </div>
  )
}

function CompactStat({
  value,
  label,
  highlight,
}: {
  value: string | number
  label: string
  highlight?: 'danger' | 'success'
}) {
  return (
    <div className="flex-1 text-center">
      <p
        className={`text-sm font-semibold tabular-nums ${
          highlight === 'danger'
            ? 'text-danger'
            : highlight === 'success'
              ? 'text-emerald-600'
              : 'text-text'
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-muted">{label}</p>
    </div>
  )
}

function ExamCard({ exam, compact = false }: { exam: ExamItem; compact?: boolean }) {
  return (
    <article className={compact ? 'py-1' : 'rounded-xl bg-slate-50/80 px-3 py-2.5'}>
      <p className="truncate text-sm font-medium text-text">{exam.courseName}</p>
      <p className="mt-0.5 text-xs text-muted">
        {formatDate(exam.examDate)}
        {exam.startTime && exam.endTime
          ? ` · ${formatTimeRange(exam.startTime, exam.endTime)}`
          : ''}
      </p>
      {(exam.classroom || exam.examType) && (
        <p className="mt-0.5 text-xs text-muted">
          {[exam.examType, exam.classroom].filter(Boolean).join(' · ')}
        </p>
      )}
    </article>
  )
}

function ResumenTab({
  activePeriod,
  selectedCareer,
  selectedSections,
  conflicts,
  coursesById,
  lastUpdated,
}: Omit<ContextPanelProps, 'onClose'>) {
  const uniqueCourses = new Set(selectedSections.map((s) => s.courseId))
  const hours = weeklyHours(selectedSections)
  const exams = collectExams(selectedSections, coursesById)
  const nextExam = exams[0]

  return (
    <div className="space-y-4 px-4 pb-4 pt-1">
      {(activePeriod || selectedCareer) && (
        <div className="space-y-0.5">
          {activePeriod && (
            <p className="text-sm font-medium text-text">{activePeriod.name}</p>
          )}
          {selectedCareer && <p className="text-xs text-muted">{selectedCareer.name}</p>}
        </div>
      )}

      {selectedSections.length > 0 ? (
        <div className="flex divide-x divide-slate-100 rounded-xl bg-slate-50/60 py-2.5">
          <CompactStat value={uniqueCourses.size} label="materias" />
          <CompactStat value={selectedSections.length} label="secciones" />
          <CompactStat value={`${hours}h`} label="semanales" />
          <CompactStat
            value={conflicts.length > 0 ? conflicts.length : 'Sin'}
            label="conflictos"
            highlight={conflicts.length > 0 ? 'danger' : 'success'}
          />
        </div>
      ) : (
        <p className="text-sm text-muted">Todavía no agregaste materias a tu horario.</p>
      )}

      {nextExam ? (
        <section>
          <p className="mb-1.5 text-xs text-muted">Próximo examen</p>
          <ExamCard exam={nextExam} />
        </section>
      ) : selectedSections.length > 0 ? (
        <p className="text-xs text-muted">Sin exámenes próximos cargados.</p>
      ) : null}

      <DataTrustFooter lastUpdated={lastUpdated} />
    </div>
  )
}

function ExamenesTab({
  selectedSections,
  coursesById,
}: {
  selectedSections: CourseSection[]
  coursesById: Map<string, { name: string; code: string | null }>
}) {
  const exams = collectExams(selectedSections, coursesById)
  const [nextExam, ...rest] = exams

  if (exams.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-10 text-center">
        <Calendar className="mb-2 h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="text-sm text-muted">Sin exámenes próximos</p>
        <Link
          to={ROUTES.exams}
          className="mt-3 text-xs text-primary-light hover:underline"
        >
          Ver todos los exámenes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 pb-4 pt-1">
      {nextExam && (
        <section>
          <p className="mb-1.5 text-xs text-muted">Próximo</p>
          <ExamCard exam={nextExam} />
        </section>
      )}

      {rest.length > 0 && (
        <section className="space-y-2">
          {rest.map((exam) => (
            <ExamCard key={exam.id} exam={exam} compact />
          ))}
        </section>
      )}

      <Link
        to={ROUTES.exams}
        className="block pt-1 text-center text-xs text-muted transition hover:text-primary-light hover:underline"
      >
        Ver todos los exámenes
      </Link>
    </div>
  )
}

function CambiosTab({ changes }: { changes: ReturnType<typeof useChanges>['changes'] }) {
  const recent = changes.slice(0, 8)

  if (recent.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <Bell className="mb-3 h-8 w-8 text-slate-300" aria-hidden="true" />
        <p className="text-sm font-medium text-text">Sin cambios recientes</p>
        <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-muted">
          Te avisaremos cuando haya actualizaciones en tus materias.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 px-4 pb-4 pt-1">
      {recent.map((change) => (
        <article
          key={change.id}
          className={`rounded-lg px-3 py-2 ${
            change.severity === 'critical'
              ? 'bg-red-50/80 text-red-800'
              : change.severity === 'important'
                ? 'bg-amber-50/80 text-amber-900'
                : 'bg-slate-50/60 text-slate-700'
          }`}
        >
          <p className="truncate text-xs font-medium">{change.courseName}</p>
          <p className="text-[11px] opacity-75">
            {change.field} · v{change.versionFrom}→{change.versionTo}
          </p>
        </article>
      ))}
      <Link
        to={ROUTES.changes}
        className="block pt-1 text-center text-xs text-muted transition hover:text-primary-light hover:underline"
      >
        Ver todos los cambios
      </Link>
    </div>
  )
}
