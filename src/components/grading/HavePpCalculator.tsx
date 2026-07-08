import { useEffect, useMemo, useRef } from 'react'
import { Info } from 'lucide-react'
import type { GradingScale, GradeResult, MinimumEfResult } from '@/utils/grading'
import { getFinalGrade, getMinimumEfForGrade } from '@/utils/grading'

const TARGET_GRADES = [2, 3, 4, 5] as const

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
  targetGrade: number
  onPpChange: (value: string) => void
  onEfChange: (value: string) => void
  onTargetGradeChange: (value: number) => void
  onBack: () => void
  onResult?: (result: GradeResult) => void
}

export function HavePpCalculator({
  scale,
  pp,
  ef,
  targetGrade,
  onPpChange,
  onEfChange,
  onTargetGradeChange,
  onBack,
  onResult,
}: HavePpCalculatorProps) {
  const finalResult = useMemo(() => {
    if (!pp.trim() || !ef.trim()) return null
    return getFinalGrade(scale, pp, ef)
  }, [scale, pp, ef])

  const minimumResult = useMemo(() => {
    if (!pp.trim()) return null
    return getMinimumEfForGrade(scale, pp, targetGrade)
  }, [scale, pp, targetGrade])

  const lastSaved = useRef<string | null>(null)

  useEffect(() => {
    if (!finalResult || finalResult.status !== 'success' || finalResult.grade == null) return
    const key = `${finalResult.pp}:${finalResult.ef}:${finalResult.grade}`
    if (lastSaved.current === key) return
    lastSaved.current = key
    onResult?.(finalResult)
  }, [finalResult, onResult])

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
        <h2 className="text-lg font-semibold text-text">Ya tengo mi PP</h2>
        <p className="mt-1 text-sm text-muted">
          Ingresá tu promedio ponderado y calculá tu nota final.
        </p>
      </div>

      <div className="space-y-4">
        <ScoreField
          id="grading-pp"
          label="PP"
          hint="Promedio ponderado antes del examen final."
          value={pp}
          onChange={onPpChange}
          error={
            pp.trim() && finalResult?.status === 'invalid_input' && !ef.trim()
              ? finalResult.message
              : pp.trim() && (finalResult?.status === 'out_of_range' || finalResult?.status === 'invalid_input')
                ? finalResult.message
                : null
          }
        />
        <ScoreField
          id="grading-ef"
          label="EF"
          hint="Puntaje obtenido en el examen final."
          value={ef}
          onChange={onEfChange}
          error={
            ef.trim() && finalResult && finalResult.status !== 'success'
              ? finalResult.message
              : null
          }
        />
      </div>

      <ResultCard result={finalResult} pp={pp} ef={ef} />

      <section className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-4">
        <h3 className="text-sm font-semibold text-text">¿Qué necesito?</h3>
        <p className="mt-1 text-xs text-muted">
          Elegí una nota objetivo para ver el EF mínimo requerido.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {TARGET_GRADES.map((grade) => (
            <button
              key={grade}
              type="button"
              onClick={() => onTargetGradeChange(grade)}
              className={`min-w-[3rem] rounded-lg px-3 py-2 text-sm font-semibold transition ${
                targetGrade === grade
                  ? 'bg-primary text-white'
                  : 'bg-white text-text ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {grade}
            </button>
          ))}
        </div>
        <MinimumMessage pp={pp} result={minimumResult} targetGrade={targetGrade} />
      </section>
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
        placeholder={label === 'PP' ? 'Ej. 72' : 'Ej. 83'}
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
      <div className={`rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 ${compact ? 'py-3' : 'py-6'} text-center text-sm text-muted`}>
        Completá PP y EF para ver tu nota final.
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
      <p className="text-sm text-muted">Nota final</p>
      <p className={`font-bold tabular-nums text-primary ${compact ? 'text-3xl' : 'text-5xl'}`}>
        {result.grade}
      </p>
      <p className="mt-1 text-sm text-muted">
        PP {result.pp} · EF {result.ef}
        {result.grade != null && (
          <span className="text-muted/80"> · {GRADE_LABELS[result.grade] ?? ''}</span>
        )}
      </p>
    </div>
  )
}

function MinimumMessage({
  pp,
  result,
  targetGrade,
}: {
  pp: string
  result: MinimumEfResult | null
  targetGrade: number
}) {
  if (!pp.trim()) {
    return <p className="mt-3 text-xs text-muted">Ingresá tu PP para calcular el EF mínimo.</p>
  }

  if (!result) return null

  if (result.status === 'success' && result.minimumEf != null) {
    return (
      <p className="mt-3 text-sm text-text">
        Con PP {result.pp} necesitás como mínimo EF{' '}
        <strong className="tabular-nums">{result.minimumEf}</strong> para obtener nota{' '}
        {targetGrade}.
      </p>
    )
  }

  if (result.status === 'out_of_range') {
    return (
      <p className="mt-3 text-sm text-amber-800">
        No es posible alcanzar nota {targetGrade} dentro del rango publicado.
      </p>
    )
  }

  return <p className="mt-3 text-sm text-danger">{result.message}</p>
}
