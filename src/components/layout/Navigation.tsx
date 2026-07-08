import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Home,
  Settings,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { ROUTES } from '@/config/constants'

const navItems = [
  { to: ROUTES.home, label: 'Inicio', icon: Home },
  { to: ROUTES.sections, label: 'Secciones', icon: BookOpen },
  { to: ROUTES.schedule, label: 'Horario', icon: CalendarDays },
  { to: ROUTES.exams, label: 'Exámenes', icon: ClipboardList },
  { to: ROUTES.settings, label: 'Configuración', icon: Settings },
]

function NavItem({
  to,
  label,
  icon: Icon,
  compact = false,
}: {
  to: string
  label: string
  icon: typeof Home
  compact?: boolean
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          isActive ? 'bg-primary text-white' : 'text-muted hover:bg-slate-100 hover:text-text'
        } ${compact ? 'flex-col gap-1 px-2 py-2 text-xs' : ''}`
      }
      aria-label={label}
    >
      <Icon className={compact ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
      <span>{label}</span>
    </NavLink>
  )
}

export function SidebarNav() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-surface p-4 md:block">
      <div className="mb-6 flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
          PP
        </div>
        <div>
          <p className="font-semibold text-text">PoliPlan</p>
          <p className="text-xs text-muted">Horarios universitarios</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Navegación principal">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
      <div className="mt-8 rounded-2xl bg-primary/5 p-4 text-xs text-muted">
        <GraduationCap className="mb-2 h-4 w-4 text-primary" />
        Reemplazá los íconos temporales en <code>public/icons/</code> por el logo definitivo.
      </div>
    </aside>
  )
}

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface/95 backdrop-blur md:hidden"
      aria-label="Navegación móvil"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} compact />
        ))}
      </div>
    </nav>
  )
}
