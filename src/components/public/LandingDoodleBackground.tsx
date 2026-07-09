const STROKE = '#0B3B8F'
const STROKE_LIGHT = '#2563EB'
const FILL_SOFT = '#BFDBFE'
const ACCENT = '#FBBF24'

function GradCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M32 6L4 18L32 30L60 18L32 6Z"
        stroke={STROKE}
        strokeWidth="2.2"
        strokeLinejoin="round"
        fill={FILL_SOFT}
        fillOpacity="0.35"
      />
      <path d="M14 22V34C14 38 22 42 32 42C42 42 50 38 50 34V22" stroke={STROKE} strokeWidth="2" strokeLinecap="round" />
      <path d="M58 20V32" stroke={STROKE_LIGHT} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="58" cy="34" r="2" fill={STROKE_LIGHT} opacity="0.5" />
    </svg>
  )
}

function OpenBook({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 44" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 8C6 8 14 6 28 12C42 6 50 8 50 8V36C50 36 42 34 28 38C14 34 6 36 6 36V8Z"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={FILL_SOFT}
        fillOpacity="0.25"
      />
      <path d="M28 12V38" stroke={STROKE_LIGHT} strokeWidth="1.6" opacity="0.45" />
      <path d="M14 18H22M34 18H42M14 24H20M34 24H40" stroke={STROKE_LIGHT} strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
    </svg>
  )
}

function Pencil({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 38L34 14L38 18L14 42L6 44L8 36L10 38Z"
        stroke={STROKE}
        strokeWidth="2"
        strokeLinejoin="round"
        fill={ACCENT}
        fillOpacity="0.35"
      />
      <path d="M34 14L38 18" stroke={STROKE} strokeWidth="2" />
      <path d="M6 44L14 42" stroke={STROKE_LIGHT} strokeWidth="1.6" opacity="0.5" />
    </svg>
  )
}

function MiniCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 52" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="12" width="36" height="32" rx="4" stroke={STROKE} strokeWidth="2" fill="white" fillOpacity="0.45" />
      <path d="M8 20H44" stroke={STROKE} strokeWidth="2" />
      <path d="M18 8V16M34 8V16" stroke={STROKE_LIGHT} strokeWidth="2" strokeLinecap="round" />
      <rect x="14" y="26" width="6" height="5" rx="1" fill={STROKE_LIGHT} fillOpacity="0.25" />
      <rect x="23" y="26" width="6" height="5" rx="1" fill={STROKE} fillOpacity="0.18" />
      <rect x="32" y="26" width="6" height="5" rx="1" fill={ACCENT} fillOpacity="0.35" />
      <rect x="14" y="34" width="6" height="5" rx="1" fill={ACCENT} fillOpacity="0.25" />
      <rect x="23" y="34" width="6" height="5" rx="1" fill={STROKE_LIGHT} fillOpacity="0.2" />
    </svg>
  )
}

function Calculator({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 56" fill="none" className={className} aria-hidden="true">
      <rect x="6" y="4" width="32" height="48" rx="5" stroke={STROKE} strokeWidth="2" fill={FILL_SOFT} fillOpacity="0.3" />
      <rect x="10" y="10" width="24" height="10" rx="2" stroke={STROKE_LIGHT} strokeWidth="1.5" fill="white" fillOpacity="0.5" />
      <circle cx="14" cy="30" r="2.5" fill={STROKE_LIGHT} fillOpacity="0.35" />
      <circle cx="22" cy="30" r="2.5" fill={STROKE_LIGHT} fillOpacity="0.35" />
      <circle cx="30" cy="30" r="2.5" fill={STROKE_LIGHT} fillOpacity="0.35" />
      <circle cx="14" cy="40" r="2.5" fill={STROKE} fillOpacity="0.25" />
      <circle cx="22" cy="40" r="2.5" fill={STROKE} fillOpacity="0.25" />
      <circle cx="30" cy="40" r="2.5" fill={ACCENT} fillOpacity="0.45" />
    </svg>
  )
}

function Clock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="18" stroke={STROKE} strokeWidth="2" fill={FILL_SOFT} fillOpacity="0.22" />
      <path d="M24 14V24L30 28" stroke={STROKE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="24" r="2" fill={STROKE} />
    </svg>
  )
}

function Laptop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 44" fill="none" className={className} aria-hidden="true">
      <rect x="10" y="8" width="44" height="26" rx="3" stroke={STROKE} strokeWidth="2" fill={FILL_SOFT} fillOpacity="0.28" />
      <path d="M4 34H60L54 40H10L4 34Z" stroke={STROKE} strokeWidth="2" strokeLinejoin="round" fill="white" fillOpacity="0.35" />
      <path d="M18 18H46M18 24H38" stroke={STROKE_LIGHT} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 2L14 8.5L21 9.2L15.5 13.8L17 21L12 17.5L7 21L8.5 13.8L3 9.2L10 8.5L12 2Z"
        stroke={STROKE}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={ACCENT}
        fillOpacity="0.35"
      />
    </svg>
  )
}

function Scribble({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 16C14 6 24 20 36 10C48 2 58 18 70 8"
        stroke={STROKE_LIGHT}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.35"
      />
    </svg>
  )
}

function PlusEquals({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <path d="M12 10V22M6 16H18" stroke={STROKE} strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      <path d="M26 22H38M28 18H36M28 26H36" stroke={STROKE_LIGHT} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    </svg>
  )
}

function Coffee({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 44" fill="none" className={className} aria-hidden="true">
      <path
        d="M10 14H30V28C30 32 26 34 20 34C14 34 10 32 10 28V14Z"
        stroke={STROKE}
        strokeWidth="2"
        fill={FILL_SOFT}
        fillOpacity="0.25"
      />
      <path d="M30 18H34C37 18 38 21 38 23C38 25 37 27 34 27H30" stroke={STROKE_LIGHT} strokeWidth="1.8" />
      <path d="M8 36H32" stroke={STROKE} strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <path d="M14 8C15 10 17 10 18 8" stroke={STROKE_LIGHT} strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
    </svg>
  )
}

function BrushBlob({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      <path
        d="M18 42C10 28 22 12 44 10C66 8 88 18 96 34C104 50 88 66 62 68C36 70 26 56 18 42Z"
        fill="#0B3B8F"
        fillOpacity="0.06"
      />
      <path
        d="M28 40C22 30 32 18 48 17C64 16 78 24 82 36C86 48 74 56 58 57C42 58 34 50 28 40Z"
        fill="#2563EB"
        fillOpacity="0.05"
      />
    </svg>
  )
}

export function LandingDoodleBackground({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(11,59,143,0.05),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(37,99,235,0.05),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.06),transparent_40%)]" />

      <BrushBlob className="absolute -left-8 top-[12%] h-32 w-48 rotate-[-18deg] opacity-90" />
      <BrushBlob className="absolute -right-10 top-[38%] h-36 w-52 rotate-[24deg] opacity-80" />
      <BrushBlob className="absolute bottom-[18%] left-[8%] h-28 w-40 rotate-[12deg] opacity-70" />

      <GradCap className="absolute left-[4%] top-[8%] h-16 w-20 rotate-[-12deg] opacity-[0.42] sm:h-20 sm:w-24" />
      <OpenBook className="absolute right-[5%] top-[14%] h-14 w-[4.5rem] rotate-[10deg] opacity-[0.38] sm:h-16 sm:w-20" />
      <Pencil className="absolute right-[12%] top-[42%] h-12 w-12 rotate-[35deg] opacity-[0.4]" />
      <MiniCalendar className="absolute left-[6%] top-[46%] h-14 w-14 rotate-[-8deg] opacity-[0.36] sm:h-16 sm:w-16" />
      <Calculator className="absolute right-[3%] bottom-[28%] h-16 w-12 rotate-[-6deg] opacity-[0.34]" />
      <Clock className="absolute left-[10%] bottom-[22%] h-14 w-14 rotate-[8deg] opacity-[0.32]" />
      <Laptop className="absolute right-[18%] bottom-[10%] hidden h-16 w-24 rotate-[-14deg] opacity-[0.34] md:block" />
      <Coffee className="absolute bottom-[12%] right-[8%] h-12 w-12 rotate-[16deg] opacity-[0.36] md:hidden" />

      <Star className="absolute left-[22%] top-[22%] h-6 w-6 rotate-[12deg] opacity-[0.45]" />
      <Star className="absolute right-[28%] top-[8%] h-5 w-5 rotate-[-18deg] opacity-[0.35]" />
      <Star className="absolute bottom-[34%] left-[18%] h-5 w-5 rotate-[6deg] opacity-[0.3]" />
      <Star className="absolute bottom-[16%] right-[24%] h-6 w-6 rotate-[-10deg] opacity-[0.38]" />

      <PlusEquals className="absolute left-[3%] top-[32%] h-10 w-10 rotate-[-20deg] opacity-[0.55]" />
      <PlusEquals className="absolute right-[6%] top-[58%] h-9 w-9 rotate-[14deg] opacity-[0.45]" />

      <Scribble className="absolute left-[14%] top-[62%] w-24 rotate-[-4deg] opacity-80" />
      <Scribble className="absolute right-[10%] top-[28%] w-28 rotate-[8deg] opacity-70" />
      <Scribble className="absolute bottom-[8%] left-[32%] w-20 rotate-[-12deg] opacity-60" />

      <svg className="absolute left-[38%] top-[6%] h-8 w-8 opacity-[0.28]" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <circle cx="16" cy="16" r="10" stroke={STROKE_LIGHT} strokeWidth="1.8" strokeDasharray="3 4" />
      </svg>
      <svg className="absolute bottom-[42%] right-[32%] h-10 w-10 rotate-[20deg] opacity-[0.22]" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M8 20H32M20 8V32" stroke={STROKE} strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
      </svg>
      <svg className="absolute left-[42%] bottom-[6%] hidden h-12 w-12 opacity-[0.25] sm:block" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M10 34L18 10L28 28L38 14" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
