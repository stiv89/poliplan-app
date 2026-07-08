import { useMemo, useState } from 'react'
import { FileUp, ListChecks, Plus, Search } from 'lucide-react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
import { ManualCourseFlow } from '@/components/progress/ManualCourseFlow'
import { PdfImportFlow } from '@/components/progress/PdfImportFlow'
import { ProgressDisclaimer } from '@/components/progress/ProgressDisclaimer'
import { SemesterSelectFlow } from '@/components/progress/SemesterSelectFlow'
import { useAcademicHistory } from '@/hooks/useAcademicHistory'
import type { AcademicAttempt, CurriculumCourse } from '@/types/academicHistory'
import { normalizeCourseName } from '@/utils/courseMatching'
import { getPassedCourseIds, isSemesterComplete } from '@/utils/progress'

type TabId = 'summary' | 'semesters' | 'passed' | 'pending' | 'attempts'
type AddMode = 'menu' | 'pdf' | 'semester' | 'manual' | null

function semesterLabel(n: number): string {
  const labels = ['', '1.er', '2.do', '3.er', '4.to', '5.to', '6.to', '7.mo', '8.vo', '9.no']
  return `${labels[n] ?? `${n}.º`} semestre`
}

export function ProgressPage() {
  const {
    loading,
    curriculum,
    statuses,
    summary,
    pendingCourses,
    attemptsByCourse,
    confirmImport,
    addManual,
    addSemester,
  } = useAcademicHistory()

  const [tab, setTab] = useState<TabId>('summary')
  const [addMode, setAddMode] = useState<AddMode>(null)

  const passedIds = useMemo(() => getPassedCourseIds(statuses), [statuses])

  const passedCourses = useMemo(() => {
    if (!curriculum) return []
    return curriculum.courses.filter((c) => passedIds.has(c.id))
  }, [curriculum, passedIds])

  const semesters = useMemo(() => {
    if (!curriculum) return []
    return [
      ...new Set(
        curriculum.courses
          .filter((c) => c.semesterNumber > 0 && c.type !== 'extension')
          .map((c) => c.semesterNumber),
      ),
    ].sort((a, b) => a - b)
  }, [curriculum])

  if (loading && !curriculum) {
    return <LoadingState label="Cargando tu progreso…" />
  }

  if (!curriculum || !summary) {
    return <LoadingState label="Preparando plan de estudios…" />
  }

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: 'summary', label: 'Resumen' },
    { id: 'semesters', label: 'Por semestre' },
    { id: 'passed', label: 'Aprobadas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'attempts', label: 'Intentos' },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-3xl items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">Mi progreso</h1>
            <p className="mt-0.5 text-sm text-muted">{summary.careerName}</p>
          </div>
          <Button
            variant="secondary"
            className="text-xs"
            onClick={() => setAddMode(addMode ? null : 'menu')}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Agregar historial
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-8">
        <div className="mx-auto max-w-3xl space-y-5">
          <ProgressDisclaimer />

          {addMode === 'menu' && (
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-medium text-text">¿Cómo querés cargarlo?</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <AddOption icon={FileUp} label="Subir notas finales" onClick={() => setAddMode('pdf')} />
                <AddOption
                  icon={ListChecks}
                  label="Elegir semestre completo"
                  onClick={() => setAddMode('semester')}
                />
                <AddOption
                  icon={Search}
                  label="Seleccionar materias"
                  onClick={() => setAddMode('manual')}
                />
              </div>
            </div>
          )}

          {addMode === 'pdf' && (
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <PdfImportFlow
                catalog={curriculum.courses}
                onConfirm={async (rows, meta) => {
                  await confirmImport(rows, meta)
                  setAddMode(null)
                }}
                onCancel={() => setAddMode(null)}
              />
            </div>
          )}

          {addMode === 'semester' && (
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <SemesterSelectFlow
                curriculum={curriculum}
                statuses={statuses}
                onConfirm={async (courseIds) => {
                  await addSemester(courseIds)
                  setAddMode(null)
                }}
                onCancel={() => setAddMode(null)}
              />
            </div>
          )}

          {addMode === 'manual' && (
            <div className="rounded-xl border border-slate-100 bg-white p-4">
              <ManualCourseFlow
                catalog={curriculum.courses}
                onConfirm={async (input) => {
                  await addManual({
                    courseId: input.courseId,
                    matchedCourseId: input.courseId,
                    originalCourseName: input.originalCourseName,
                    normalizedCourseName: normalizeCourseName(input.originalCourseName),
                    matchConfidence: 'exact',
                    semesterNumber: curriculum.courses.find((c) => c.id === input.courseId)
                      ?.semesterNumber,
                    finalGrade: input.finalGrade,
                    examDate: input.examDate,
                    status: input.status,
                    source: 'manual',
                  })
                  setAddMode(null)
                }}
                onCancel={() => setAddMode(null)}
              />
            </div>
          )}

          <div className="-mx-1 overflow-x-auto px-1">
            <div className="inline-flex gap-1 rounded-lg bg-slate-100 p-0.5">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium ${
                    tab === item.id ? 'bg-white text-text shadow-sm' : 'text-muted'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'summary' && (
            <section className="grid gap-3 sm:grid-cols-2">
              <StatCard
                title="Materias"
                value={`${summary.passedCourses} de ${summary.totalCourses}`}
                percent={summary.coursePercent}
              />
              <StatCard
                title="Créditos"
                value={`${summary.earnedCredits} de ${summary.totalCredits}`}
                percent={summary.creditPercent}
              />
              <StatCard
                title="Promedio"
                value={summary.gpa != null ? summary.gpa.toFixed(2).replace('.', ',') : '—'}
              />
              <StatCard
                title="Semestres completos"
                value={`${summary.completedSemesters} de ${summary.totalSemesters}`}
              />
              <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 sm:col-span-2">
                <p className="text-xs text-muted">Extensión universitaria</p>
                <p className="mt-1 text-sm font-medium text-text">
                  {summary.extensionStatus === 'complete'
                    ? 'Completo'
                    : summary.extensionStatus === 'incomplete'
                      ? 'Incompleto'
                      : 'No registrado'}
                </p>
              </div>
            </section>
          )}

          {tab === 'semesters' && (
            <section className="space-y-4">
              {semesters.map((semesterNumber) => {
                const courses = curriculum.courses.filter(
                  (c) => c.semesterNumber === semesterNumber && c.type !== 'extension',
                )
                const complete = isSemesterComplete(semesterNumber, curriculum, statuses)
                return (
                  <div key={semesterNumber} className="rounded-xl border border-slate-100 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                      <h2 className="text-sm font-semibold text-text">
                        {semesterLabel(semesterNumber)}
                      </h2>
                      <span className="text-xs text-muted">
                        {complete ? 'Completo' : 'Incompleto'}
                      </span>
                    </div>
                    <ul className="divide-y divide-slate-100">
                      {courses.map((course) => {
                        const status = statuses.find((s) => s.courseId === course.id)
                        const passed = status?.status === 'passed'
                        return (
                          <li
                            key={course.id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                          >
                            <span className={passed ? 'text-text' : 'text-muted'}>
                              {passed ? '✓ ' : '○ '}
                              {course.name}
                            </span>
                            {passed && status?.bestGrade != null && (
                              <span className="text-xs text-muted">Nota {status.bestGrade}</span>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </section>
          )}

          {tab === 'passed' && (
            <CourseList
              empty="Todavía no registraste materias aprobadas."
              courses={passedCourses}
              statuses={statuses}
              attemptsByCourse={attemptsByCourse}
            />
          )}

          {tab === 'pending' && (
            <CourseList
              empty="No hay materias pendientes según tu plan e historial."
              courses={pendingCourses}
              statuses={statuses}
              attemptsByCourse={attemptsByCourse}
              pending
            />
          )}

          {tab === 'attempts' && (
            <section className="space-y-3">
              {[...attemptsByCourse.values()].map(({ course, attempts: courseAttempts }) => {
                const status = statuses.find((s) => s.courseId === course.id)
                const specific = courseAttempts.find(
                  (a: AcademicAttempt) => a.specificElectiveName,
                )?.specificElectiveName
                return (
                  <div
                    key={course.id}
                    className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-text">
                      {specific ? `${course.name} (${specific})` : course.name}
                    </p>
                    <p className="text-xs text-muted">
                      {status?.status === 'passed' ? 'Aprobada' : 'Con intentos'} ·{' '}
                      {status?.bestGrade != null ? `Nota ${status.bestGrade}` : 'Sin nota'}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {courseAttempts.map((attempt: AcademicAttempt) => (
                        <li key={attempt.id} className="text-xs text-muted">
                          {attempt.examDate ?? 'Sin fecha'} · Nota {attempt.finalGrade ?? '—'} ·{' '}
                          {attempt.status === 'passed' ? 'Aprobada' : 'Reprobada'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
              {attemptsByCourse.size === 0 && (
                <p className="py-8 text-center text-sm text-muted">Sin intentos registrados.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function AddOption({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof FileUp
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-4 text-center text-sm font-medium text-text hover:bg-slate-50"
    >
      <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
      {label}
    </button>
  )
}

function StatCard({
  title,
  value,
  percent,
}: {
  title: string
  value: string
  percent?: number
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <p className="text-xs text-muted">{title}</p>
      <p className="mt-1 text-lg font-semibold text-text">{value}</p>
      {percent != null && <p className="text-sm text-primary">{percent}%</p>}
    </div>
  )
}

function CourseList({
  courses,
  statuses,
  attemptsByCourse,
  empty,
  pending = false,
}: {
  courses: CurriculumCourse[]
  statuses: ReturnType<typeof useAcademicHistory>['statuses']
  attemptsByCourse: ReturnType<typeof useAcademicHistory>['attemptsByCourse']
  empty: string
  pending?: boolean
}) {
  if (courses.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">{empty}</p>
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
      {courses.map((course) => {
        const status = statuses.find((s) => s.courseId === course.id)
        const entry = attemptsByCourse.get(course.id)
        return (
          <li key={course.id} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">{course.name}</p>
                <p className="text-xs text-muted">
                  {semesterLabel(course.semesterNumber)}
                  {course.credits != null ? ` · ${course.credits} créditos` : ''}
                </p>
              </div>
              {!pending && status?.bestGrade != null && (
                <span className="text-sm text-muted">Nota {status.bestGrade}</span>
              )}
              {pending && <span className="text-xs text-muted">Pendiente</span>}
            </div>
            {entry && entry.attempts.length > 1 && (
              <p className="mt-1 text-xs text-muted">{entry.attempts.length} intentos registrados</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
