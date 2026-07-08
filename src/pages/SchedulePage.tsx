import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { LoadingState } from '@/components/feedback/LoadingState'
import { DAYS_OF_WEEK, SCHEDULE_HOURS } from '@/config/constants'
import { useSchedule } from '@/hooks/useSchedule'
import { getDayLabel } from '@/utils/dates'
import { formatTimeRange, timeToMinutes } from '@/utils/times'

const hourSlots = Array.from(
  { length: SCHEDULE_HOURS.end - SCHEDULE_HOURS.start + 1 },
  (_, index) => SCHEDULE_HOURS.start + index,
)

export function SchedulePage() {
  const { loading, selectedSections, conflicts, coursesById } = useSchedule()
  const [mobileDay, setMobileDay] = useState<number>(1)

  const conflictSectionIds = useMemo(() => {
    const ids = new Set<string>()
    for (const conflict of conflicts) {
      ids.add(conflict.firstSectionId)
      ids.add(conflict.secondSectionId)
    }
    return ids
  }, [conflicts])

  const blocks = useMemo(() => {
    return selectedSections.flatMap((section) => {
      const course = coursesById.get(section.courseId)
      return section.meetings.map((meeting) => ({
        id: meeting.id,
        sectionId: section.id,
        dayOfWeek: meeting.dayOfWeek,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        title: course?.name ?? 'Materia',
        subtitle: `${course?.code ?? ''} · Sec. ${section.sectionCode}`.trim(),
        classroom: meeting.classroom,
        teacherName: section.teacherName,
        hasConflict: conflictSectionIds.has(section.id),
      }))
    })
  }, [conflictSectionIds, coursesById, selectedSections])

  if (loading) {
    return <LoadingState label="Cargando horario..." />
  }

  if (selectedSections.length === 0) {
    return (
      <EmptyState
        title="Tu horario está vacío"
        description="Elegí secciones desde el explorador para ver tu semana organizada."
      />
    )
  }

  return (
    <div className="space-y-5">
      <Card
        title="Horario semanal"
        action={
          conflicts.length > 0 ? (
            <Badge tone="danger">{conflicts.length} conflictos</Badge>
          ) : (
            <Badge tone="success">Sin conflictos</Badge>
          )
        }
      >
        <div className="md:hidden">
          <label className="mb-3 flex flex-col gap-1 text-sm">
            <span className="font-medium">Día</span>
            <select
              className="rounded-xl border border-slate-200 px-3 py-2"
              value={mobileDay}
              onChange={(event) => setMobileDay(Number(event.target.value))}
              aria-label="Seleccionar día"
            >
              {DAYS_OF_WEEK.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>

          <div className="space-y-3">
            {blocks
              .filter((block) => block.dayOfWeek === mobileDay)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((block) => (
                <article
                  key={block.id}
                  className={`rounded-2xl border p-4 ${
                    block.hasConflict
                      ? 'border-danger bg-danger/5'
                      : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{block.title}</h3>
                      <p className="text-sm text-muted">{block.subtitle}</p>
                    </div>
                    {block.hasConflict ? <Badge tone="danger">Conflicto</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm">
                    {formatTimeRange(block.startTime, block.endTime)}
                  </p>
                  <p className="text-sm text-muted">
                    {block.classroom ?? 'Aula por confirmar'} ·{' '}
                    {block.teacherName ?? 'Docente por confirmar'}
                  </p>
                </article>
              ))}
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <div
            className="grid min-w-[920px] gap-2"
            style={{
              gridTemplateColumns: `80px repeat(${DAYS_OF_WEEK.length}, minmax(120px, 1fr))`,
            }}
          >
            <div />
            {DAYS_OF_WEEK.map((day) => (
              <div key={day.value} className="text-center text-sm font-semibold">
                {day.label}
              </div>
            ))}

            <div className="relative col-span-full grid grid-cols-[80px_repeat(6,minmax(120px,1fr))]">
              {hourSlots.map((hour) => (
                <div key={hour} className="contents">
                  <div className="border-r border-slate-200 py-8 text-xs text-muted">
                    {String(hour).padStart(2, '0')}:00
                  </div>
                  {DAYS_OF_WEEK.map((day) => (
                    <div
                      key={`${day.value}-${hour}`}
                      className="relative border border-slate-100 bg-white/60"
                      style={{ minHeight: '64px' }}
                    >
                      {blocks
                        .filter(
                          (block) =>
                            block.dayOfWeek === day.value &&
                            timeToMinutes(block.startTime) < (hour + 1) * 60 &&
                            timeToMinutes(block.endTime) > hour * 60,
                        )
                        .map((block) => {
                          const start = timeToMinutes(block.startTime)
                          const end = timeToMinutes(block.endTime)
                          const top = ((start - hour * 60) / 60) * 64
                          const height = Math.max(28, ((end - start) / 60) * 64)

                          return (
                            <div
                              key={block.id}
                              className={`absolute inset-x-1 rounded-xl p-2 text-xs shadow-sm ${
                                block.hasConflict
                                  ? 'border border-danger bg-danger/10'
                                  : 'border border-primary/20 bg-primary/10'
                              }`}
                              style={{ top, height }}
                              aria-label={`${block.title} ${getDayLabel(block.dayOfWeek)}`}
                            >
                              <p className="font-semibold">{block.title}</p>
                              <p>{formatTimeRange(block.startTime, block.endTime)}</p>
                              <p className="text-muted">{block.classroom}</p>
                            </div>
                          )
                        })}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
