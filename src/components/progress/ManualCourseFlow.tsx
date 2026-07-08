import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CurriculumCourse } from '@/types/academicHistory'
import { deriveAttemptStatus } from '@/utils/academicApproval'
import { normalizeCourseName } from '@/utils/courseMatching'

interface ManualCourseFlowProps {
  catalog: CurriculumCourse[]
  onConfirm: (input: {
    courseId: string
    originalCourseName: string
    status: 'passed' | 'failed' | 'in_progress'
    finalGrade?: number | null
    examDate?: string | null
  }) => void
  onCancel: () => void
}

export function ManualCourseFlow({ catalog, onConfirm, onCancel }: ManualCourseFlowProps) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [status, setStatus] = useState<'passed' | 'failed' | 'in_progress'>('passed')
  const [grade, setGrade] = useState<string>('')
  const [examDate, setExamDate] = useState('')

  const filtered = useMemo(() => {
    const q = normalizeCourseName(query)
    if (!q) return catalog.filter((c) => c.type !== 'extension').slice(0, 20)
    return catalog
      .filter((c) => c.type !== 'extension')
      .filter(
        (c) =>
          normalizeCourseName(c.name).includes(q) ||
          normalizeCourseName(c.code).includes(q) ||
          String(c.semesterNumber).includes(q),
      )
      .slice(0, 30)
  }, [catalog, query])

  const selected = catalog.find((c) => c.id === selectedId)

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por código, nombre o semestre"
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
      />

      <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
        {filtered.map((course) => (
          <button
            key={course.id}
            type="button"
            onClick={() => setSelectedId(course.id)}
            className={`flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm ${
              selectedId === course.id ? 'bg-primary/5' : 'hover:bg-slate-50'
            }`}
          >
            <span className="text-text">{course.name}</span>
            <span className="shrink-0 text-xs text-muted">{course.semesterNumber}.º</span>
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-xs text-muted">
            Estado
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            >
              <option value="passed">Aprobada</option>
              <option value="failed">Reprobada</option>
              <option value="in_progress">En curso</option>
            </select>
          </label>
          <label className="text-xs text-muted">
            Nota (opcional)
            <input
              type="number"
              min={1}
              max={5}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs text-muted">
            Fecha (opcional)
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
            />
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          disabled={!selected}
          onClick={() => {
            if (!selected) return
            const finalGrade = grade ? Number(grade) : null
            onConfirm({
              courseId: selected.id,
              originalCourseName: selected.name,
              status: finalGrade != null ? deriveAttemptStatus(finalGrade) === 'passed' ? 'passed' : 'failed' : status,
              finalGrade,
              examDate: examDate || null,
            })
          }}
        >
          Agregar materia
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
