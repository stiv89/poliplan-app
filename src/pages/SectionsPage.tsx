import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/feedback/LoadingState'
import { useSchedule } from '@/hooks/useSchedule'
import type { CourseSection } from '@/types/academic'
import { getDayLabel } from '@/utils/dates'
import { formatTimeRange } from '@/utils/times'
import { getConflictsForSection } from '@/utils/conflicts'

export function SectionsPage() {
  const {
    loading,
    allSections,
    coursesById,
    toggleSection,
    isSectionSelected,
    selectedSections,
    conflicts,
  } = useSchedule()

  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [shiftFilter, setShiftFilter] = useState('all')
  const [teacherFilter, setTeacherFilter] = useState('')

  const groupedSections = useMemo(() => {
    const filtered = allSections.filter((section) => {
      const course = coursesById.get(section.courseId)
      const haystack = `${course?.name ?? ''} ${course?.code ?? ''} ${section.sectionCode} ${section.teacherName ?? ''}`.toLowerCase()
      const matchesSearch = haystack.includes(search.toLowerCase())
      const matchesLevel =
        levelFilter === 'all' || String(course?.level ?? '') === levelFilter
      const matchesShift = shiftFilter === 'all' || section.shift === shiftFilter
      const matchesTeacher =
        teacherFilter.trim().length === 0 ||
        (section.teacherName ?? '').toLowerCase().includes(teacherFilter.toLowerCase())

      return matchesSearch && matchesLevel && matchesShift && matchesTeacher
    })

    const groups = new Map<string, CourseSection[]>()
    for (const section of filtered) {
      const current = groups.get(section.courseId) ?? []
      current.push(section)
      groups.set(section.courseId, current)
    }

    return [...groups.entries()].sort(([leftId], [rightId]) => {
      const left = coursesById.get(leftId)?.name ?? leftId
      const right = coursesById.get(rightId)?.name ?? rightId
      return left.localeCompare(right)
    })
  }, [allSections, coursesById, levelFilter, search, shiftFilter, teacherFilter])

  const selectedCourseIds = new Set(selectedSections.map((section) => section.courseId))

  if (loading) {
    return <LoadingState label="Cargando secciones..." />
  }

  if (allSections.length === 0) {
    return (
      <EmptyState
        title="No hay secciones disponibles"
        description="Activá datos de muestra o sincronizá con Supabase para explorar materias."
      />
    )
  }

  return (
    <div className="space-y-5">
      <Card title="Explorador de secciones">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Input
            label="Buscar materia o código"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Ej: Programación, INF101"
          />
          <Select
            label="Nivel"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: '1', label: 'Nivel 1' },
              { value: '2', label: 'Nivel 2' },
              { value: '3', label: 'Nivel 3' },
            ]}
          />
          <Select
            label="Turno"
            value={shiftFilter}
            onChange={(event) => setShiftFilter(event.target.value)}
            options={[
              { value: 'all', label: 'Todos' },
              { value: 'Mañana', label: 'Mañana' },
              { value: 'Tarde', label: 'Tarde' },
              { value: 'Noche', label: 'Noche' },
            ]}
          />
          <Input
            label="Docente"
            value={teacherFilter}
            onChange={(event) => setTeacherFilter(event.target.value)}
            placeholder="Nombre del docente"
          />
        </div>
      </Card>

      <div className="space-y-4">
        {groupedSections.map(([courseId, sections]) => {
          const course = coursesById.get(courseId)
          const hasSelectedCourse = selectedCourseIds.has(courseId)

          return (
            <Card
              key={courseId}
              title={`${course?.name ?? 'Materia'} ${course?.code ? `(${course.code})` : ''}`}
              action={
                hasSelectedCourse ? <Badge tone="info">Materia en tu horario</Badge> : null
              }
            >
              <div className="space-y-3">
                {sections.map((section) => {
                  const selected = isSectionSelected(section.id)
                  const sectionConflicts = getConflictsForSection(section.id, conflicts)
                  const duplicateCourseWarning =
                    !selected && hasSelectedCourse
                      ? 'Ya tenés otra sección de esta materia seleccionada.'
                      : null

                  return (
                    <article
                      key={section.id}
                      className={`rounded-2xl border p-4 ${
                        sectionConflicts.length > 0
                          ? 'border-danger/40 bg-danger/5'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-text">
                              Sección {section.sectionCode}
                            </h3>
                            {section.shift ? <Badge>{section.shift}</Badge> : null}
                            {selected ? (
                              <Badge tone="success">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Seleccionada
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            Docente: {section.teacherName ?? 'Sin asignar'}
                          </p>
                          <ul className="mt-3 space-y-1 text-sm">
                            {section.meetings.map((meeting) => (
                              <li key={meeting.id}>
                                {getDayLabel(meeting.dayOfWeek)} ·{' '}
                                {formatTimeRange(meeting.startTime, meeting.endTime)} ·{' '}
                                {meeting.classroom ?? 'Aula por confirmar'}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                          variant={selected ? 'danger' : 'primary'}
                          onClick={() => void toggleSection(section)}
                          aria-label={
                            selected
                              ? `Quitar sección ${section.sectionCode}`
                              : `Agregar sección ${section.sectionCode}`
                          }
                        >
                          {selected ? 'Quitar' : 'Agregar'}
                        </Button>
                      </div>

                      {duplicateCourseWarning ? (
                        <p className="mt-3 flex items-center gap-2 text-sm text-warning">
                          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                          {duplicateCourseWarning}
                        </p>
                      ) : null}

                      {sectionConflicts.length > 0 ? (
                        <div className="mt-3 rounded-xl border border-danger/30 bg-white p-3 text-sm text-danger">
                          <p className="font-medium">Conflicto detectado</p>
                          {sectionConflicts.map((conflict) => (
                            <p key={conflict.id} className="mt-1">
                              {getDayLabel(conflict.dayOfWeek)} ·{' '}
                              {formatTimeRange(conflict.overlapStart, conflict.overlapEnd)} ·{' '}
                              {conflict.type}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
