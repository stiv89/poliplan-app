import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useSchedule } from '@/hooks/useSchedule'
import { formatDate } from '@/utils/dates'
import { formatTimeRange } from '@/utils/times'

export function ExamsPage() {
  const { loading, selectedSections, coursesById } = useSchedule()

  const exams = selectedSections.flatMap((section) => {
    const course = coursesById.get(section.courseId)
    return section.exams.map((exam) => ({
      ...exam,
      courseName: course?.name ?? 'Materia',
      courseCode: course?.code ?? '',
      sectionCode: section.sectionCode,
    }))
  })

  exams.sort((left, right) => {
    const leftDate = left.examDate ?? '9999-12-31'
    const rightDate = right.examDate ?? '9999-12-31'
    return leftDate.localeCompare(rightDate)
  })

  if (loading) {
    return <LoadingState label="Cargando exámenes..." />
  }

  if (exams.length === 0) {
    return (
      <EmptyState
        title="No hay exámenes para mostrar"
        description="Seleccioná secciones con fechas de examen para verlas acá."
      />
    )
  }

  return (
    <div className="space-y-4">
      <Card title="Fechas de exámenes">
        <div className="space-y-3">
          {exams.map((exam) => (
            <article
              key={exam.id}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-text">
                    {exam.courseName} {exam.courseCode ? `(${exam.courseCode})` : ''}
                  </h3>
                  <p className="text-sm text-muted">
                    Sección {exam.sectionCode} · {exam.examType}
                  </p>
                </div>
                <p className="text-sm font-medium text-primary">{formatDate(exam.examDate)}</p>
              </div>
              <p className="mt-2 text-sm text-muted">
                {exam.startTime && exam.endTime
                  ? formatTimeRange(exam.startTime, exam.endTime)
                  : 'Horario por confirmar'}{' '}
                · {exam.classroom ?? 'Aula por confirmar'}
              </p>
            </article>
          ))}
        </div>
      </Card>
    </div>
  )
}
