import type { AcademicPeriod, Career } from '@/types/academic'
import type { SchedulePickerPanelProps } from '@/components/schedule/SchedulePickerSheet'
import {
  ScheduleContextSelector,
  buildContextPillLabel,
} from '@/components/schedule/ScheduleContextSelector'

export { buildContextPillLabel }

interface ScheduleContextBarProps {
  scheduleName: string
  periodName: string | null
  academicPeriods: AcademicPeriod[]
  selectedPeriodId: string | null
  onPeriodChange: (periodId: string) => void
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  scheduleCareers: Career[]
  schedulePicker: Omit<SchedulePickerPanelProps, 'open' | 'onClose' | 'periodName'>
  titleClassName?: string
  compact?: boolean
  onShareSchedule?: () => void
}

/** Desktop schedule context entry — unified two-line selector. */
export function ScheduleContextBar({
  scheduleName,
  periodName,
  academicPeriods,
  selectedPeriodId,
  onPeriodChange,
  careers,
  selectedCareerId,
  onCareerChange,
  scheduleCareers,
  schedulePicker,
  onShareSchedule,
}: ScheduleContextBarProps) {
  return (
    <div className="min-w-0 flex-1">
      <ScheduleContextSelector
        presentation="popover"
        scheduleName={scheduleName}
        periodName={periodName}
        academicPeriods={academicPeriods}
        selectedPeriodId={selectedPeriodId}
        onPeriodChange={onPeriodChange}
        careers={careers}
        selectedCareerId={selectedCareerId}
        onCareerChange={onCareerChange}
        schedulePicker={schedulePicker}
        onShareSchedule={onShareSchedule}
      />

      {scheduleCareers.length > 1 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[10px] text-muted/70">En tu horario</span>
          {scheduleCareers.map((career) => {
            const active = career.id === selectedCareerId
            return (
              <button
                key={career.id}
                type="button"
                onClick={() => onCareerChange(career.id)}
                aria-pressed={active}
                className={`rounded-full border px-2 py-0.5 text-[11px] font-medium transition ${
                  active
                    ? 'border-slate-300 bg-slate-100 text-slate-700'
                    : 'border-transparent bg-slate-100/80 text-slate-500 hover:border-slate-200 hover:bg-slate-100'
                }`}
              >
                {career.code ?? career.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
