import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  calculateWeightedPp,
  createWeightedEvaluation,
  getDuplicateEvaluationName,
  parseEvaluationScore,
  parseEvaluationWeight,
  type WeightedEvaluation,
} from '@/utils/grading'

interface BuildPpCalculatorProps {
  evaluations: WeightedEvaluation[]
  onChange: (evaluations: WeightedEvaluation[]) => void
  onUsePp: (pp: number) => void
  onBack: () => void
}

export function BuildPpCalculator({
  evaluations,
  onChange,
  onUsePp,
  onBack,
}: BuildPpCalculatorProps) {
  const result = calculateWeightedPp(evaluations)

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
        <h2 className="text-lg font-semibold text-text">Calcular mi PP</h2>
        <p className="mt-1 text-sm text-muted">
          Sumá parciales, trabajos y laboratorio con sus pesos.
        </p>
      </div>

      <div className="space-y-3">
        {evaluations.map((evaluation) => {
          const nameError = !evaluation.name.trim() ? 'Nombre requerido' : null
          const duplicateError = getDuplicateEvaluationName(evaluations, evaluation.id)
          const scoreError = evaluation.score
            ? parseEvaluationScore(evaluation.score).error
            : null
          const weightError = evaluation.weight
            ? parseEvaluationWeight(evaluation.weight).error
            : null

          return (
            <div
              key={evaluation.id}
              className="rounded-xl border border-slate-100 bg-surface px-3 py-3"
            >
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <Field
                    label="Nombre"
                    value={evaluation.name}
                    onChange={(value) => updateEvaluation(evaluation.id, { name: value })}
                    error={duplicateError ?? nameError}
                    placeholder="Ej. Parcial 1"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Field
                      label="Puntaje"
                      value={evaluation.score}
                      onChange={(value) => updateEvaluation(evaluation.id, { score: value })}
                      error={scoreError}
                      inputMode="numeric"
                      placeholder="75"
                    />
                    <Field
                      label="Peso %"
                      value={evaluation.weight}
                      onChange={(value) => updateEvaluation(evaluation.id, { weight: value })}
                      error={weightError}
                      inputMode="numeric"
                      placeholder="30"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeEvaluation(evaluation.id)}
                  disabled={evaluations.length <= 1}
                  className="rounded-lg p-2 text-muted hover:bg-slate-100 disabled:opacity-30"
                  aria-label={`Eliminar ${evaluation.name || 'evaluación'}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Button variant="secondary" className="w-full justify-center gap-2" onClick={addEvaluation}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Agregar evaluación
      </Button>

      <WeightSummary totalWeight={result.totalWeight} message={result.message} status={result.status} />

      {result.status === 'success' && result.pp != null && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
          <p className="text-sm text-muted">Tu PP estimado es</p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-primary">{result.pp}</p>
          {result.rawAverage != null && result.pp !== result.rawAverage && (
            <p className="mt-1 text-xs text-muted">
              Promedio ponderado: {result.rawAverage.toFixed(1)}
            </p>
          )}
          <Button className="mt-4 w-full justify-center" onClick={() => onUsePp(result.pp!)}>
            Usar este PP para calcular mi nota final
          </Button>
        </div>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  placeholder?: string
  inputMode?: 'numeric' | 'text'
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={`mt-1 w-full rounded-lg border bg-white px-3 py-2.5 text-base outline-none transition focus:border-primary-light ${
          error ? 'border-danger/40' : 'border-slate-200'
        }`}
      />
      {error && <span className="mt-1 block text-[11px] text-danger">{error}</span>}
    </label>
  )
}

function WeightSummary({
  totalWeight,
  message,
  status,
}: {
  totalWeight: number
  message: string
  status: string
}) {
  const barColor =
    status === 'overflow'
      ? 'bg-danger'
      : status === 'success'
        ? 'bg-success'
        : 'bg-primary'

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text">Peso acumulado</span>
        <span className="font-semibold tabular-nums text-text">{totalWeight}% de 100%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(totalWeight, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{message}</p>
    </div>
  )
}
