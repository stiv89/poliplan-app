import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import type { GradingScale, GradeResult, MinimumEfResult } from '@/utils/grading'
import { getFinalGrade, getGradeScenarios, getMinimumEfForGrade } from '@/utils/grading'

const TARGET_GRADES = [5, 4, 3, 2] as const

const GRADE_LABELS: Record<number, string> = {
  2: 'Suficiente',
  3: 'Bueno',
  4: 'Muy bueno',
  5: 'Sobresaliente',
}

interface HavePpCalculatorProps {
  scale: GradingScale
  pp: string
  ef: string
  onPpChange: (value: string) => void
  onEfChange: (value: string) => void
  onBack: () => void
  onResult?: (result: GradeResult) => void
}

export function HavePpCalculator({
  scale,
  pp,
  ef,
  onPpChange,
  onEfChange,
  onBack,
  onResult,
}: HavePpCalculatorProps) {
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null)
  const [efExpanded, setEfExpanded] = useState(false)

  const finalResult = useMemo(() => {
    if (!pp.trim() || !ef.trim()) return null
    return getFinalGrade(scale, pp, ef)
  }, [scale, pp, ef])

  const ppIsValid = useMemo(() => {
    if (!pp.trim()) return false
    return getGradeScenarios(scale, pp).length > 0
  }, [scale, pp])

  const minimumRows = useMemo(() => {
    if (!ppIsValid) return null
    return TARGET_GRADES.map((grade) => ({
      grade,
      result: getMinimumEfForGrade(scale, pp, grade),
    }))
  }, [scale, pp, ppIsValid])

  const ppError = useMemo(() => {
    if (!pp.trim() || ppIsValid) return null
    return getMinimumEfForGrade(scale, pp, 2).message
  }, [scale, pp, ppIsValid])

  const lastSaved = useRef<string | null>(null)

  useEffect(() => {
    if (!finalResult || finalResult.status !== 'success' || finalResult.grade == null) return
    const key = `${finalResult.pp}:${finalResult.ef}:${finalResult.grade}`
    if (lastSaved.current === key) return
    lastSaved.current = key
    onResult?.(finalResult)
  }, [finalResult, onResult])

  useEffect(() => {
    if (ef.trim()) setEfExpanded(true)
  }, [ef])

  useEffect(() => {
    setSelectedGrade(null)
  }, [pp])

  const selectedRow = minimumRows?.find((row) => row.grade === selectedGrade) ?? null

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-primary hover:underline"
      >
        ← Elegir otro camino
      </button>

      <div>
        <h2 className="text-lg font-semibold text-text">Calcular con mi PP</h2>
        <p className="mt-1 text-sm text-muted">
          Ingresá tu promedio ponderado para conocer qué necesitás en el examen final.
        </p>
      </div>

      <ScoreField
        id="grading-pp"
        label="Promedio ponderado (PP)"
        hint="Promedio ponderado antes del examen final."
        value={pp}
        onChange={onPpChange}
        error={ppError}
      />

      {minimumRows && (
        <section
          className="space-y-3 transition-all duration-300 ease-out"
          aria-live="polite"
        >
          <div>
            <h3 className="text-sm font-semibold text-text">Puntajes mínimos requeridos</h3>
            <p className="mt-1 text-xs text-muted">
              Con tu PP, estos son los puntajes mínimos que necesitás en el examen final.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
            <table className="w-full text-sm">
              <tbody>
                {minimumRows.map(({ grade, result }) => (
                  <MinimumTableRow
                    key={grade}
                    grade={grade}
                    result={result}
                    selected={selectedGrade === grade}
                    onSelect={() => setSelectedGrade(grade)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {selectedRow && (
            <p className="text-sm text-text transition-opacity duration-200">
              <MinimumRowDetail grade={selectedRow.grade} result={selectedRow.result} />
            </p>
          )}
        </section>
      )}

      <section className="rounded-xl border border-slate-100 bg-slate-50/60">
        <button
          type="button"
          onClick={() => setEfExpanded((open) => !open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={efExpanded}
        >
          <span className="text-sm font-medium text-text">Ya rendí el examen final</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
              efExpanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {efExpanded && (
          <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-3 transition-all duration-200 ease-out">
            <p className="text-xs text-muted">
              Ingresá tu puntaje para calcular la nota obtenida.
            </p>
            <ScoreField
              id="grading-ef"
              label="Puntaje del examen final (EF)"
              hint="Puntaje obtenido en el examen final."
              value={ef}
              onChange={onEfChange}
              error={
                ef.trim() && finalResult && finalResult.status !== 'success'
                  ? finalResult.message
                  : null
              }
            />
            <FinalGradeResult result={finalResult} pp={pp} ef={ef} />
          </div>
        )}
      </section>
    </div>
  )
}

function MinimumTableRow({
  grade,
  result,
  selected,
  onSelect,
}: {
  grade: number
  result: MinimumEfResult
  selected: boolean
  onSelect: () => void
}) {
  const valueLabel = formatMinimumEfLabel(result)

  return (
    <tr>
      <td colSpan={2} className="p-0">
        <button
          type="button"
          onClick={onSelect}
          className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
            selected ? 'bg-primary/5' : 'hover:bg-slate-50'
          }`}
        >
          <span className={`font-medium ${selected ? 'text-primary' : 'text-text'}`}>
            Nota {grade}
          </span>
          <span
            className={`tabular-nums ${
              valueLabel.unreachable
                ? 'text-xs text-muted'
                : selected
                  ? 'font-semibold text-primary'
                  : 'text-text'
            }`}
          >
            {valueLabel.text}
          </span>
        </button>
      </td>
    </tr>
  )
}

function formatMinimumEfLabel(result: MinimumEfResult): { text: string; unreachable: boolean } {
  if (result.status === 'success' && result.minimumEf != null) {
    return { text: `${result.minimumEf} puntos`, unreachable: false }
  }
  return { text: 'No alcanzable con este PP', unreachable: true }
}

function MinimumRowDetail({ grade, result }: { grade: number; result: MinimumEfResult }) {
  if (result.status === 'success' && result.minimumEf != null) {
    return (
      <>
        <span className="font-medium">Nota objetivo: {grade}</span>
        <br />
        Necesitás obtener al menos{' '}
        <strong className="tabular-nums">{result.minimumEf}</strong> puntos en el examen final.
      </>
    )
  }

  return (
    <>
      <span className="font-medium">Nota objetivo: {grade}</span>
      <br />
      No es posible alcanzar esta nota con tu PP actual.
    </>
  )
}

function FinalGradeResult({
  result,
  pp,
  ef,
}: {
  result: GradeResult | null
  pp: string
  ef: string
}) {
  if (!pp.trim() || !ef.trim()) return null

  if (!result || result.status !== 'success' || result.grade == null) {
    if (result && result.status !== 'success') {
      return (
        <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3">
          <p className="text-sm text-danger">{result.message}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
      <p className="text-sm text-muted">Tu nota final es {result.grade}</p>
      <p className="text-4xl font-bold tabular-nums text-primary">{result.grade}</p>
      {GRADE_LABELS[result.grade] && (
        <p className="mt-1 text-sm text-muted">{GRADE_LABELS[result.grade]}</p>
      )}
    </div>
  )
}

function ScoreField({
  id,
  label,
  hint,
  value,
  onChange,
  error,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  error: string | null
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="flex items-center gap-1 text-sm font-medium text-text">
        {label}
        <span className="text-muted" title={hint}>
          <Info className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </span>
      <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode="numeric"
        placeholder={id === 'grading-pp' ? 'Ej. 72' : 'Ej. 83'}
        className={`mt-2 w-full rounded-xl border bg-white px-4 py-3 text-lg font-medium tabular-nums outline-none transition focus:border-primary-light ${
          error ? 'border-danger/40' : 'border-slate-200'
        }`}
      />
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

export function ResultCard({
  result,
  pp,
  ef,
  compact = false,
}: {
  result: GradeResult | null
  pp: string
  ef: string
  compact?: boolean
}) {
  if (!result || !pp.trim() || !ef.trim()) {
    return (
      <div
        className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 ${compact ? 'py-3' : 'py-6'} text-center text-sm text-muted`}
      >
        Ingresá tu EF para ver tu nota final.
      </div>
    )
  }

  if (result.status !== 'success' || result.grade == null) {
    return (
      <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-4">
        <p className="text-sm font-medium text-danger">No se pudo calcular</p>
        <p className="mt-1 text-sm text-muted">{result.message}</p>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border border-primary/20 bg-primary/5 px-4 ${compact ? 'py-3' : 'py-5'}`}>
      <p className="text-sm text-muted">Tu nota final es {result.grade}</p>
      <p className={`font-bold tabular-nums text-primary ${compact ? 'text-3xl' : 'text-5xl'}`}>
        {result.grade}
      </p>
      {GRADE_LABELS[result.grade] && (
        <p className="mt-1 text-sm text-muted">{GRADE_LABELS[result.grade]}</p>
      )}
    </div>
  )
}
