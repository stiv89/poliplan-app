import { useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  calculateWeightedPp,
  createWeightedEvaluation,
  getDuplicateEvaluationName,
  parseEvaluationScore,
  parseEvaluationWeight,
  type WeightedEvaluation,
  type WeightedPpResult,
} from '@/utils/grading'

interface BuildPpCalculatorProps {
  evaluations: WeightedEvaluation[]
  onChange: (evaluations: WeightedEvaluation[]) => void
  onUsePp: (pp: number) => void
  onBack: () => void
}

const EMPTY_RESULT: WeightedPpResult = {
  status: 'empty',
  totalWeight: 0,
  pp: null,
  rawAverage: null,
  message: 'Completá puntaje y peso de al menos una evaluación.',
}

export function BuildPpCalculator({
  evaluations,
  onChange,
  onUsePp,
  onBack,
}: BuildPpCalculatorProps) {
  const completeEvaluations = useMemo(
    () =>
      evaluations.filter(
        (evaluation) =>
          evaluation.name.trim() && evaluation.score.trim() && evaluation.weight.trim(),
      ),
    [evaluations],
  )

  const result = useMemo(() => {
    if (completeEvaluations.length === 0) return EMPTY_RESULT
    return calculateWeightedPp(completeEvaluations)
  }, [completeEvaluations])

  const updateEvaluation = (id: string, patch: Partial<WeightedEvaluation>) => {
    onChange(evaluations.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const removeEvaluation = (id: string) => {
    if (evaluations.length <= 1) return
    onChange(evaluations.filter((item) => item.id !== id))
  }

  const addEvaluation = () => {
    onChange([...evaluations, createWeightedEvaluation(`Evaluación ${evaluations.length + 1}`)])
  }

  const showProgress = result.totalWeight > 0

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
        <h2 className="text-lg font-semibold text-text">Calcular mi promedio</h2>
        <p className="mt-1 text-sm text-muted">
          Ingresá el puntaje y el peso de cada evaluación. Los pesos deben sumar 100%.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem_2rem] gap-2 border-b border-slate-100 bg-slate-50/80 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted sm:grid-cols-[minmax(0,1fr)_5rem_4rem_2rem]">
          <span>Evaluación</span>
          <span className="text-center">Puntaje</span>
          <span className="text-center">Peso</span>
          <span className="sr-only">Eliminar</span>
        </div>

        <div className="divide-y divide-slate-100">
          {evaluations.map((evaluation) => (
            <EvaluationRow
              key={evaluation.id}
              evaluation={evaluation}
              evaluations={evaluations}
              canRemove={evaluations.length > 1}
              onChange={(patch) => updateEvaluation(evaluation.id, patch)}
              onRemove={() => removeEvaluation(evaluation.id)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={addEvaluation}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-2.5 text-sm font-medium text-muted transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar evaluación
      </button>

      {showProgress && (
        <WeightProgress result={result} />
      )}

      {result.status === 'success' && result.pp != null && (
        <section
          className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 transition-all duration-300 ease-out"
          aria-live="polite"
        >
          <div>
            <p className="text-sm text-muted">Tu PP estimado es</p>
            <p className="text-4xl font-bold tabular-nums text-primary">{result.pp}</p>
            {result.rawAverage != null && result.pp !== result.rawAverage && (
              <p className="mt-1 text-xs text-muted">
                Promedio ponderado: {result.rawAverage.toFixed(1)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => onUsePp(result.pp!)}
            className="text-sm font-medium text-primary hover:underline"
          >
            Calcular mi nota final con este PP →
          </button>
        </section>
      )}
    </div>
  )
}

function EvaluationRow({
  evaluation,
  evaluations,
  canRemove,
  onChange,
  onRemove,
}: {
  evaluation: WeightedEvaluation
  evaluations: WeightedEvaluation[]
  canRemove: boolean
  onChange: (patch: Partial<WeightedEvaluation>) => void
  onRemove: () => void
}) {
  const touched = !!(evaluation.score.trim() || evaluation.weight.trim())
  const duplicateError = touched ? getDuplicateEvaluationName(evaluations, evaluation.id) : null
  const scoreError =
    touched && evaluation.score.trim()
      ? parseEvaluationScore(evaluation.score).error
      : null
  const weightError =
    touched && evaluation.weight.trim()
      ? parseEvaluationWeight(evaluation.weight).error
      : null
  const rowError = duplicateError ?? scoreError ?? weightError

  return (
    <div className="px-3 py-2.5">
      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_3.5rem_2rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_5rem_4rem_2rem]">
        <input
          value={evaluation.name}
          onChange={(event) => onChange({ name: event.target.value })}
          placeholder="Ej. Parcial 1"
          className="min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-2 text-sm text-text outline-none transition placeholder:text-muted/70 focus:border-slate-200 focus:bg-white"
          aria-label="Nombre de la evaluación"
        />
        <input
          value={evaluation.score}
          onChange={(event) => onChange({ score: event.target.value })}
          inputMode="numeric"
          placeholder="75"
          className={`rounded-lg border bg-white px-2 py-2 text-center text-sm tabular-nums outline-none transition focus:border-primary-light ${
            scoreError ? 'border-danger/40' : 'border-slate-200'
          }`}
          aria-label={`Puntaje de ${evaluation.name || 'evaluación'}`}
        />
        <input
          value={evaluation.weight}
          onChange={(event) => onChange({ weight: event.target.value })}
          inputMode="numeric"
          placeholder="30"
          className={`rounded-lg border bg-white px-2 py-2 text-center text-sm tabular-nums outline-none transition focus:border-primary-light ${
            weightError ? 'border-danger/40' : 'border-slate-200'
          }`}
          aria-label={`Peso de ${evaluation.name || 'evaluación'}`}
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-slate-100 disabled:opacity-20"
          aria-label={`Eliminar ${evaluation.name || 'evaluación'}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {rowError && (
        <p className="mt-1.5 text-[11px] text-danger">{rowError}</p>
      )}
    </div>
  )
}

function WeightProgress({ result }: { result: WeightedPpResult }) {
  const barColor =
    result.status === 'overflow'
      ? 'bg-danger'
      : result.status === 'success'
        ? 'bg-success'
        : 'bg-primary'

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Peso acumulado</span>
        <span className="font-semibold tabular-nums text-text">{result.totalWeight}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(result.totalWeight, 100)}%` }}
        />
      </div>
      <p
        className={`mt-2 text-xs ${
          result.status === 'overflow' ? 'text-danger' : 'text-muted'
        }`}
      >
        {result.message}
      </p>
    </div>
  )
}
