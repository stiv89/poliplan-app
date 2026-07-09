import scheduleEmptyIllustration from '../../../logos/schedule-empty-illustration.webp'

const MOCK_BLOCKS = [
  { day: 1, start: 2, span: 2, color: 'bg-sky-100 border-sky-200' },
  { day: 2, start: 4, span: 2, color: 'bg-emerald-100 border-emerald-200' },
  { day: 3, start: 1, span: 3, color: 'bg-violet-100 border-violet-200' },
  { day: 4, start: 5, span: 2, color: 'bg-amber-100 border-amber-200' },
  { day: 5, start: 3, span: 2, color: 'bg-rose-100 border-rose-200' },
] as const

const MOCK_COURSES = [
  { code: 'INF 101', name: 'Introducción a la Informática', time: 'Lun · Mié 08:00' },
  { code: 'MAT 110', name: 'Matemática I', time: 'Mar · Jue 10:00' },
  { code: 'FIS 120', name: 'Física General', time: 'Vie 14:00' },
] as const

export function LandingAppPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-[720px] select-none rounded-[28px] border border-slate-200/80 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-4"
      aria-hidden="true"
    >
      <div className="overflow-hidden rounded-[20px] border border-slate-200/70 bg-slate-50/80">
        <div className="flex min-h-[420px] sm:min-h-[480px]">
          <aside className="hidden w-[148px] shrink-0 border-r border-slate-200/70 bg-white sm:block">
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="h-2.5 w-16 rounded-full bg-slate-200" />
              <div className="mt-2 h-7 rounded-lg bg-slate-100" />
            </div>
            <div className="space-y-2 p-2">
              {MOCK_COURSES.map((course) => (
                <div key={course.code} className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                  <p className="text-[10px] font-semibold text-[#0B3B8F]">{course.code}</p>
                  <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-600">
                    {course.name}
                  </p>
                  <p className="mt-1 text-[8px] text-slate-400">{course.time}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center justify-between border-b border-slate-200/70 bg-white px-4 py-3">
              <div className="h-2.5 w-24 rounded-full bg-slate-200" />
              <div className="h-7 w-20 rounded-lg bg-[#0B3B8F]/10" />
            </div>

            <div className="relative flex-1 p-3 sm:p-4">
              <div className="grid grid-cols-6 gap-1.5">
                {['L', 'M', 'X', 'J', 'V', 'S'].map((day) => (
                  <div
                    key={day}
                    className="rounded-md bg-white py-1 text-center text-[9px] font-medium text-slate-400"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="relative mt-2 grid grid-cols-6 gap-1.5">
                {Array.from({ length: 36 }).map((_, index) => (
                  <div key={index} className="h-8 rounded-md bg-white/70" />
                ))}

                {MOCK_BLOCKS.map((block, index) => (
                  <div
                    key={index}
                    className={`absolute rounded-lg border px-1 py-1 ${block.color}`}
                    style={{
                      left: `calc(${(block.day / 6) * 100}% + ${block.day * 2}px)`,
                      top: `${block.start * 36 + 8}px`,
                      width: 'calc(16.666% - 8px)',
                      height: `${block.span * 36 - 4}px`,
                    }}
                  >
                    <div className="h-1.5 w-8 rounded-full bg-current opacity-20" />
                  </div>
                ))}
              </div>

              <img
                src={scheduleEmptyIllustration}
                alt=""
                className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto max-h-[42%] w-[58%] object-contain opacity-[0.18]"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
