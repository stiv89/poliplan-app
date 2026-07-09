import type { ReactNode } from 'react'

export function ExplorerFilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">{title}</p>
      {children}
    </div>
  )
}

export function ExplorerFilterChip({
  selected,
  subtleSelected = false,
  onClick,
  disabled = false,
  children,
}: {
  selected: boolean
  subtleSelected?: boolean
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  const selectedClass = subtleSelected
    ? 'border-slate-300 bg-slate-50 text-slate-700'
    : 'border-slate-400/70 bg-white text-slate-800'

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-8 items-center rounded-full border px-2.5 text-xs font-normal transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${
        selected
          ? selectedClass
          : 'border-transparent bg-slate-100/70 text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export function DualRangeSlider({
  min,
  max,
  step,
  start,
  end,
  onChange,
}: {
  min: number
  max: number
  step: number
  start: number
  end: number
  onChange: (start: number, end: number) => void
}) {
  const range = max - min
  const startPct = ((start - min) / range) * 100
  const endPct = ((end - min) / range) * 100

  return (
    <div className="relative h-8">
      <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-200/80" />
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-slate-400/70"
        style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={start}
        onChange={(event) => {
          const nextStart = Number(event.target.value)
          onChange(Math.min(nextStart, end - step), end)
        }}
        className="range-thumb absolute inset-0 z-20 w-full appearance-none bg-transparent"
        aria-label="Hora de inicio"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={end}
        onChange={(event) => {
          const nextEnd = Number(event.target.value)
          onChange(start, Math.max(nextEnd, start + step))
        }}
        className="range-thumb absolute inset-0 z-30 w-full appearance-none bg-transparent"
        aria-label="Hora de fin"
      />
      <style>{`
        .range-thumb { height: 100%; background: transparent; }
        .range-thumb::-webkit-slider-runnable-track { appearance: none; background: transparent; }
        .range-thumb::-moz-range-track { background: transparent; }
        .range-thumb::-webkit-slider-thumb {
          appearance: none; height: 16px; width: 16px; margin-top: -6px;
          border-radius: 9999px; background: white; border: 1.5px solid #94A3B8;
          box-shadow: none; cursor: pointer;
        }
        .range-thumb::-moz-range-thumb {
          height: 16px; width: 16px; border-radius: 9999px; background: white;
          border: 1.5px solid #94A3B8; box-shadow: none; cursor: pointer;
        }
      `}</style>
    </div>
  )
}
