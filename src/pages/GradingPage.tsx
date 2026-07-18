import { useMemo, useState } from 'react'
import { BuildPpCalculator } from '@/components/grading/BuildPpCalculator'
import { HavePpCalculator, ResultCard } from '@/components/grading/HavePpCalculator'
import { GradingScalePopover } from '@/components/grading/GradingScalePopover'
import { LandingDoodleBackground } from '@/components/public/LandingDoodleBackground'
import { useGradingHistory } from '@/hooks/useGradingHistory'
import scaleJson from '@/data/grading-scales/fpuna-default-scale.json'
import havePpIllustration from '../../logos/PP.png'
import buildPpIllustration from '../../logos/armarpp.png'
import type { GradingScale } from '@/utils/grading'
import {
  createWeightedEvaluation,
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
  const [evaluations, setEvaluations] = useState<WeightedEvaluation[]>([
    createWeightedEvaluation('Parcial 1'),
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
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <LandingDoodleBackground className="opacity-70 dark:opacity-45" />

      <header className="relative z-10 shrink-0 border-b border-slate-200/40 bg-surface/80 px-4 py-2 backdrop-blur-md md:px-6 dark:border-[var(--app-border-subtle)] dark:bg-[color-mix(in_srgb,var(--app-surface)_82%,transparent)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight text-text md:text-lg">
              Calculadora de notas
            </h1>
            {mode === 'select' && (
              <p className="text-xs text-muted">Elegí qué querés calcular</p>
            )}
          </div>
          <GradingScalePopover scale={scale} />
        </div>
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-28 md:px-6 md:py-5 md:pb-8">
          <div className={`mx-auto max-w-2xl ${mode === 'select' ? 'flex min-h-full items-center justify-center py-6' : ''}`}>
            {mode === 'select' && (
              <ModeSelect
                onSelectHavePp={() => setMode('have-pp')}
                onSelectBuildPp={() => setMode('build-pp')}
              />
            )}

            {mode === 'have-pp' && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/88 p-4 backdrop-blur-sm sm:p-5">
                <HavePpCalculator
                scale={scale}
                pp={pp}
                ef={ef}
                onPpChange={setPp}
                onEfChange={setEf}
                onBack={() => setMode('select')}
                onResult={handleFinalResult}
                />
              </div>
            )}

            {mode === 'build-pp' && (
              <div className="rounded-2xl border border-slate-200/60 bg-white/88 p-4 backdrop-blur-sm sm:p-5">
                <BuildPpCalculator
                evaluations={evaluations}
                onChange={setEvaluations}
                onUsePp={handleUsePp}
                onBack={() => setMode('select')}
                />
              </div>
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

        {mode === 'have-pp' && ef.trim() && (
          <aside className="relative z-10 hidden w-[min(320px,30vw)] shrink-0 border-l border-slate-200/40 bg-white/80 p-6 backdrop-blur-md md:block">
            <p className="text-sm font-medium text-muted">Resultado</p>
            <div className="mt-4">
              <ResultCard result={finalResult} pp={pp} ef={ef} />
            </div>
          </aside>
        )}
      </div>

      {mode === 'have-pp' && finalResult?.status === 'success' && finalResult.grade != null && (
        <div className="bottom-above-dock fixed inset-x-0 z-30 border-t border-slate-200 bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
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
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch sm:justify-center sm:gap-6">
      <ModeCard
        title="Calcular mi nota final"
        description="Ya conozco mi promedio ponderado."
        illustration={havePpIllustration}
        illustrationAlt="Promedio ponderado que lleva a una calificación final"
        onClick={onSelectHavePp}
      />
      <ModeCard
        title="Calcular mi promedio"
        description="Sumá parciales, trabajos y laboratorio."
        illustration={buildPpIllustration}
        illustrationAlt="Varias evaluaciones que se combinan en un promedio"
        onClick={onSelectBuildPp}
      />
    </div>
  )
}

function ModeCard({
  title,
  description,
  illustration,
  illustrationAlt,
  onClick,
}: {
  title: string
  description: string
  illustration: string
  illustrationAlt: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[15.5rem] w-full max-w-[19.5rem] flex-col items-center rounded-2xl border border-slate-200/70 bg-white/90 px-6 pb-6 pt-5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-primary/20 hover:bg-white hover:shadow-[0_10px_28px_rgba(11,59,143,0.08)] active:translate-y-0"
    >
      <span className="flex h-[7.5rem] w-[7.5rem] items-center justify-center">
        <img
          src={illustration}
          alt={illustrationAlt}
          width={120}
          height={120}
          className="h-[7.25rem] w-[7.25rem] object-contain transition duration-200 group-hover:scale-[1.03]"
          draggable={false}
        />
      </span>
      <span className="mt-1 block text-[15px] font-semibold leading-snug text-text">{title}</span>
      <span className="mt-1.5 block max-w-[14rem] text-sm leading-snug text-muted">{description}</span>
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
