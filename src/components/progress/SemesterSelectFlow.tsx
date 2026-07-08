import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { Curriculum, StudentCourseStatus } from '@/types/academicHistory'
import { isSemesterComplete } from '@/utils/progress'

interface SemesterSelectFlowProps {
  curriculum: Curriculum
  statuses: StudentCourseStatus[]
  onConfirm: (courseIds: string[]) => void
  onCancel: () => void
}

function semesterLabel(n: number): string {
  const labels = ['', '1.er', '2.do', '3.er', '4.to', '5.to', '6.to', '7.mo', '8.vo', '9.no']
  return `${labels[n] ?? `${n}.º`} semestre`
}

export function SemesterSelectFlow({
  curriculum,
  statuses,
  onConfirm,
  onCancel,
}: SemesterSelectFlowProps) {
  const semesters = useMemo(() => {
    const nums = [
      ...new Set(
        curriculum.courses
          .filter((c) => c.type !== 'extension' && c.semesterNumber > 0)
          .map((c) => c.semesterNumber),
      ),
    ].sort((a, b) => a - b)

    return nums.map((semesterNumber) => ({
      semesterNumber,
      courses: curriculum.courses.filter(
        (c) => c.semesterNumber === semesterNumber && c.type !== 'extension',
      ),
      complete: isSemesterComplete(semesterNumber, curriculum, statuses),
    }))
  }, [curriculum, statuses])

  const [selectedSemester, setSelectedSemester] = useState(semesters[0]?.semesterNumber ?? 1)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const current = semesters.find((s) => s.semesterNumber === selectedSemester)

  const toggleAll = () => {
    if (!current) return
    const allIds = current.courses.map((c) => c.id)
    const allSelected = allIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        for (const id of allIds) next.delete(id)
      } else {
        for (const id of allIds) next.add(id)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Elegí un semestre y marcá las materias aprobadas. No inventamos notas: podés completarlas
        después.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {semesters.map((semester) => (
          <button
            key={semester.semesterNumber}
            type="button"
            onClick={() => setSelectedSemester(semester.semesterNumber)}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-medium ${
              selectedSemester === semester.semesterNumber
                ? 'bg-primary text-white'
                : 'bg-slate-100 text-muted'
            }`}
          >
            {semesterLabel(semester.semesterNumber)}
          </button>
        ))}
      </div>

      {current && (
        <div className="rounded-xl border border-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="text-sm font-medium text-text">
              {semesterLabel(current.semesterNumber)}
              {current.complete && (
                <span className="ml-2 text-xs font-normal text-emerald-700">Completo</span>
              )}
            </p>
            <button type="button" onClick={toggleAll} className="text-xs text-primary hover:underline">
              Seleccionar todas
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {current.courses.map((course) => (
              <li key={course.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.has(course.id)}
                    onChange={() => {
                      setSelected((prev) => {
                        const next = new Set(prev)
                        if (next.has(course.id)) next.delete(course.id)
                        else next.add(course.id)
                        return next
                      })
                    }}
                  />
                  <span className="text-text">{course.name}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          disabled={selected.size === 0}
          onClick={() => onConfirm([...selected])}
        >
          Agregar {selected.size} materia{selected.size === 1 ? '' : 's'}
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
