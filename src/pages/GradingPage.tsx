import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Layers, TrendingUp } from 'lucide-react'
import { BuildPpCalculator } from '@/components/grading/BuildPpCalculator'
import { HavePpCalculator, ResultCard } from '@/components/grading/HavePpCalculator'
import { GradingScalePopover } from '@/components/grading/GradingScalePopover'
import { useGradingHistory } from '@/hooks/useGradingHistory'
import scaleJson from '@/data/grading-scales/fpuna-default-scale.json'
import type { GradingScale } from '@/utils/grading'
import {
  createWeightedEvaluation,
  calculateWeightedPp,
  getFinalGrade,
  type GradeResult,
  type WeightedEvaluation,
} from '@/utils/grading'
import { formatDateTime } from '@/utils/dates'

const scale = scaleJson as GradingScale

type CalculatorMode = 'select' | 'have-pp' | 'build-pp'

export function GradingPage() {
  const [mode, setMode] = useState<CalculatorMode>('select')
  const [pp, setPp] = useState('')
  const [ef, setEf] = useState('')
  const [targetGrade, setTargetGrade] = useState(4)
  const [evaluations, setEvaluations] = useState<WeightedEvaluation[]>([
    createWeightedEvaluation('Parcial 1'),
    createWeightedEvaluation('Parcial 2'),
  ])

  const { entries, saveEntry } = useGradingHistory()

  const finalResult = useMemo(() => {
    if (!pp.trim() || !ef.trim()) return null
    return getFinalGrade(scale, pp, ef)
  }, [pp, ef])

  const handleFinalResult = (result: GradeResult) => {
    if (result.status === 'success' && result.grade != null) {
      saveEntry({ pp: result.pp!, ef: result.ef, grade: result.grade })
    }
  }

  const handleUsePp = (calculatedPp: number) => {
    setPp(String(calculatedPp))
    setMode('have-pp')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-slate-100 px-4 py-4 md:px-8">
        <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">
          Calculadora de notas
        </h1>
        {mode === 'select' && (
          <p className="mt-1 text-sm text-muted">Elegí qué querés calcular</p>
        )}
        <div className="mt-2">
          <GradingScalePopover scale={scale} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 pb-28 md:px-8 md:pb-8">
          <div className="mx-auto max-w-lg">
            {mode === 'select' && (
              <ModeSelect
                onSelectHavePp={() => setMode('have-pp')}
                onSelectBuildPp={() => setMode('build-pp')}
              />
            )}

            {mode === 'have-pp' && (
              <HavePpCalculator
                scale={scale}
                pp={pp}
                ef={ef}
                targetGrade={targetGrade}
                onPpChange={setPp}
                onEfChange={setEf}
                onTargetGradeChange={setTargetGrade}
                onBack={() => setMode('select')}
                onResult={handleFinalResult}
              />
            )}

            {mode === 'build-pp' && (
              <BuildPpCalculator
                evaluations={evaluations}
                onChange={setEvaluations}
                onUsePp={handleUsePp}
                onBack={() => setMode('select')}
              />
            )}

            {entries.length > 0 && mode !== 'select' && (
              <RecentHistory entries={entries} onSelect={(entry) => {
                setPp(String(entry.pp))
                if (entry.ef != null) setEf(String(entry.ef))
                setMode('have-pp')
              }} />
            )}
          </div>
        </div>

        {mode === 'have-pp' && (
          <aside className="hidden w-[min(320px,30vw)] shrink-0 border-l border-slate-100 bg-surface p-6 md:block">
            <p className="text-sm font-medium text-muted">Resultado</p>
            <div className="mt-4">
              <ResultCard result={finalResult} pp={pp} ef={ef} />
            </div>
          </aside>
        )}
      </div>

      {mode === 'have-pp' && finalResult?.status === 'success' && finalResult.grade != null && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-slate-200 bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <div>
              <p className="text-xs text-muted">Nota estimada</p>
              <p className="text-2xl font-bold tabular-nums text-primary">{finalResult.grade}</p>
            </div>
            <p className="text-right text-xs text-muted">
              PP {finalResult.pp} · EF {finalResult.ef}
            </p>
          </div>
        </div>
      )}

      {mode === 'build-pp' && (
        <BuildPpStickyBar evaluations={evaluations} />
      )}
    </div>
  )
}

function ModeSelect({
  onSelectHavePp,
  onSelectBuildPp,
}: {
  onSelectHavePp: () => void
  onSelectBuildPp: () => void
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <ModeCard
        title="Ya tengo mi PP"
        description="Ingresá tu promedio ponderado y calculá tu nota final."
        icon={TrendingUp}
        onClick={onSelectHavePp}
      />
      <ModeCard
        title="Quiero calcular mi PP"
        description="Sumá parciales, trabajos y laboratorio."
        icon={Layers}
        onClick={onSelectBuildPp}
      />
    </div>
  )
}

function ModeCard({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-slate-100 bg-surface px-4 py-5 text-left shadow-sm transition hover:border-primary/20 hover:bg-primary/[0.02]"
    >
      <span className="inline-flex rounded-xl bg-primary/10 p-2 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="mt-3 block text-base font-semibold text-text">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-muted">{description}</span>
    </button>
  )
}

function RecentHistory({
  entries,
  onSelect,
}: {
  entries: Array<{ pp: number; ef: number | null; grade: number | null; savedAt: string }>
  onSelect: (entry: { pp: number; ef: number | null; grade: number | null }) => void
}) {
  return (
    <section className="mt-8 border-t border-slate-100 pt-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">Recientes</h3>
      <ul className="mt-2 space-y-1">
        {entries.map((entry) => (
          <li key={entry.savedAt}>
            <button
              type="button"
              onClick={() => onSelect(entry)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span>
                PP {entry.pp}
                {entry.ef != null && ` · EF ${entry.ef}`}
                {entry.grade != null && ` → ${entry.grade}`}
              </span>
              <span className="text-xs text-muted">{formatDateTime(entry.savedAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function BuildPpStickyBar({ evaluations }: { evaluations: WeightedEvaluation[] }) {
  const result = calculateWeightedPp(evaluations)

  if (result.status !== 'success' || result.pp == null) return null

  return (
    <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] z-30 border-t border-slate-200 bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
      <div className="mx-auto max-w-lg">
        <p className="text-xs text-muted">PP estimado</p>
        <p className="text-2xl font-bold tabular-nums text-primary">{result.pp}</p>
      </div>
    </div>
  )
}
