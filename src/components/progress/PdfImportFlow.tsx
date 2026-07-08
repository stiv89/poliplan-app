import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CurriculumCourse, TranscriptParseRow } from '@/types/academicHistory'
import { extractTextFromPdfFile, parseTranscriptText } from '@/utils/transcriptParser'

interface PdfImportFlowProps {
  catalog: CurriculumCourse[]
  onConfirm: (rows: TranscriptParseRow[], meta: { fileName: string; gpa?: number | null }) => void
  onCancel: () => void
}

const CONFIDENCE_LABELS: Record<string, string> = {
  exact: 'Coincidencia exacta',
  probable: 'Coincidencia probable',
  none: 'Sin coincidencia',
  duplicate: 'Duplicado',
  repeated_attempt: 'Intento repetido',
}

export function PdfImportFlow({ catalog, onConfirm, onCancel }: PdfImportFlowProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload')
  const [fileName, setFileName] = useState('')
  const [rows, setRows] = useState<TranscriptParseRow[]>([])
  const [gpa, setGpa] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const activeRows = useMemo(() => rows.filter((r) => !r.ignored), [rows])

  const handleFile = async (file: File) => {
    setProcessing(true)
    setError(null)
    try {
      const text = await extractTextFromPdfFile(file)
      const parsed = parseTranscriptText(text, catalog)
      if (parsed.rows.length === 0) {
        setError('No se detectaron filas de materias. Verificá que el PDF tenga texto seleccionable.')
        return
      }
      setFileName(file.name)
      setRows(parsed.rows)
      setGpa(parsed.gpa)
      setStep('review')
    } catch {
      setError('No se pudo leer el PDF. Intentá con otro archivo.')
    } finally {
      setProcessing(false)
    }
  }

  const updateRow = (index: number, patch: Partial<TranscriptParseRow>) => {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    )
  }

  const remapCourse = (index: number, courseId: string) => {
    updateRow(index, {
      matchedCourseId: courseId,
      matchConfidence: 'exact',
      warnings: [],
    })
  }

  if (step === 'upload') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Subí tu PDF de notas finales. El archivo se procesa en este dispositivo y no se guarda
          permanentemente. No almacenamos tu cédula.
        </p>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-8 text-center">
          <span className="text-sm font-medium text-text">Seleccionar PDF</span>
          <span className="mt-1 text-xs text-muted">Notas finales de la Facultad</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void handleFile(file)
            }}
          />
        </label>
        {processing && <p className="text-sm text-muted">Extrayendo datos…</p>}
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text">Revisá la importación</p>
          <p className="text-xs text-muted">
            {fileName} · {activeRows.length} filas ·{' '}
            {gpa != null ? `Promedio detectado: ${gpa.toFixed(2)}` : 'Sin promedio detectado'}
          </p>
        </div>
      </div>

      <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
        {rows.map((row, index) => (
          <div
            key={`${row.rowIndex}-${index}`}
            className={`rounded-xl border px-3 py-3 ${row.ignored ? 'opacity-50' : 'border-slate-100'}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">{row.originalCourseName}</p>
                <p className="text-xs text-muted">
                  {row.semesterNumber ? `${row.semesterNumber}.º semestre` : row.semesterLabel ?? '—'}
                  {row.examDate ? ` · ${row.examDate}` : ''}
                  {row.recordNumber ? ` · Acta ${row.recordNumber}` : ''}
                </p>
              </div>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                {CONFIDENCE_LABELS[row.matchConfidence] ?? row.matchConfidence}
              </span>
            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <label className="text-xs text-muted">
                Nota
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={row.finalGrade ?? ''}
                  onChange={(e) => {
                    const grade = e.target.value ? Number(e.target.value) : null
                    updateRow(index, {
                      finalGrade: grade,
                      status: grade != null && grade >= 2 ? 'passed' : grade === 1 ? 'failed' : 'pending_review',
                    })
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs text-muted sm:col-span-2">
                Materia del plan
                <select
                  value={row.matchedCourseId ?? ''}
                  onChange={(e) => remapCourse(index, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  <option value="">Sin coincidencia</option>
                  {catalog.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {row.warnings.length > 0 && (
              <p className="mt-2 text-xs text-amber-700">{row.warnings.join(' · ')}</p>
            )}

            <button
              type="button"
              onClick={() => updateRow(index, { ignored: !row.ignored })}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {row.ignored ? 'Incluir fila' : 'Ignorar fila'}
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          onClick={() => onConfirm(rows, { fileName, gpa })}
        >
          Confirmar importación
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={() => setStep('upload')}>
          Volver
        </Button>
      </div>
    </div>
  )
}
