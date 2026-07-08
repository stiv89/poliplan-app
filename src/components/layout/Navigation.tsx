import {
  Bell,
  BookOpen,
  Calculator,
  ClipboardList,
  GraduationCap,
  Home,
  Settings,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MutableRefObject,
  type RefObject,
} from 'react'
import { NavLink, useLocation, matchPath } from 'react-router-dom'
import { countUnseenChanges } from '@/services/changeDetectionService'
import { ROUTES } from '@/config/constants'
import logoMark from '../../../logos/logo-sidebar.png'

function useUnseenCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const n = await countUnseenChanges()
        if (!cancelled) setCount(n)
      } catch {
        // IndexedDB puede no estar lista todavía
      }
    }

    void load()
    const onChangesUpdated = () => void load()
    window.addEventListener('poliplan:changes-updated', onChangesUpdated)
    const id = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(id)
      window.removeEventListener('poliplan:changes-updated', onChangesUpdated)
    }
  }, [])

  return count
}

const MAIN_NAV_ITEMS = [
  { to: ROUTES.home, label: 'Horario', icon: Home, end: true },
  { to: ROUTES.sections, label: 'Secciones', icon: BookOpen },
  { to: ROUTES.exams, label: 'Exámenes', icon: ClipboardList },
  { to: ROUTES.grading, label: 'Notas', icon: Calculator },
  { to: ROUTES.progress, label: 'Progreso', icon: GraduationCap },
  { to: ROUTES.changes, label: 'Novedades', icon: Bell, showBadge: true },
] as const

const SETTINGS_ITEM = {
  to: ROUTES.settings,
  label: 'Ajustes',
  icon: Settings,
} as const

type NavItemConfig = {
  to: string
  label: string
  icon: typeof Home
  badge?: number
  end?: boolean
}

interface IndicatorRect {
  top: number
  left: number
  width: number
  height: number
}

function isNavItemActive(pathname: string, to: string, end = false): boolean {
  return matchPath({ path: to, end }, pathname) != null
}

function useSlidingIndicator(
  containerRef: RefObject<HTMLElement | null>,
  itemRefs: MutableRefObject<Map<string, HTMLElement>>,
  activeKey: string | null,
) {
  const [indicator, setIndicator] = useState<IndicatorRect | null>(null)

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    const activeEl = activeKey ? itemRefs.current.get(activeKey) : null
    if (!container || !activeEl) {
      setIndicator(null)
      return
    }

    const containerRect = container.getBoundingClientRect()
    const activeRect = activeEl.getBoundingClientRect()

    setIndicator({
      top: activeRect.top - containerRect.top,
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
      height: activeRect.height,
    })
  }, [activeKey, containerRef, itemRefs])

  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(container)

    window.addEventListener('resize', updateIndicator)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateIndicator)
    }
  }, [containerRef, updateIndicator])

  return { indicator, updateIndicator }
}

function RailNavItem({
  to,
  label,
  icon: Icon,
  badge = 0,
  end = false,
  itemRef,
}: NavItemConfig & {
  itemRef?: (element: HTMLElement | null) => void
}) {
  return (
    <NavLink
      to={to}
      end={end}
      ref={itemRef}
      className={({ isActive }) =>
        `group relative z-10 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-[color,transform] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.92] ${
          isActive
            ? 'text-primary'
            : 'text-slate-400 hover:text-slate-600'
        }`
      }
      aria-label={badge > 0 ? `${label} (${badge} sin ver)` : label}
    >
      <span className="relative">
        <Icon className="h-[22px] w-[22px] stroke-[1.75]" aria-hidden="true" />
        {badge > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-surface"
            aria-hidden="true"
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="max-w-full truncate text-[10px] font-medium leading-none">{label}</span>
    </NavLink>
  )
}

function NavRail({
  items,
  layout,
  className = '',
  footerItems,
}: {
  items: NavItemConfig[]
  layout: 'vertical' | 'horizontal'
  className?: string
  footerItems?: NavItemConfig[]
}) {
  const { pathname } = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  const allItems = footerItems ? [...items, ...footerItems] : items
  const activeKey =
    allItems.find((item) => isNavItemActive(pathname, item.to, item.end))?.to ?? null

  const { indicator, updateIndicator } = useSlidingIndicator(containerRef, itemRefs, activeKey)
  const updateIndicatorRef = useRef(updateIndicator)
  updateIndicatorRef.current = updateIndicator

  const setItemRef = useCallback((key: string) => {
    return (element: HTMLElement | null) => {
      if (element) {
        itemRefs.current.set(key, element)
      } else {
        itemRefs.current.delete(key)
      }
      requestAnimationFrame(() => updateIndicatorRef.current())
    }
  }, [itemRefs])

  const renderItem = (item: NavItemConfig) => (
    <RailNavItem key={item.to} {...item} itemRef={setItemRef(item.to)} />
  )

  return (
    <div
      ref={containerRef}
      className={`relative ${
        layout === 'vertical' && footerItems ? 'flex min-h-0 flex-1 flex-col' : ''
      } ${className}`}
    >
      {indicator && (
        <span
          className="nav-rail-indicator"
          style={{
            top: indicator.top,
            left: indicator.left,
            width: indicator.width,
            height: indicator.height,
          }}
          aria-hidden="true"
        />
      )}
      {layout === 'horizontal' ? (
        <div className="grid grid-cols-5 gap-0.5">{allItems.map(renderItem)}</div>
      ) : footerItems ? (
        <>
          <div className="flex flex-col items-center gap-0.5">{items.map(renderItem)}</div>
          <div className="mt-auto flex flex-col items-center pt-2">{footerItems.map(renderItem)}</div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5">{items.map(renderItem)}</div>
      )}
    </div>
  )
}

export function SidebarNav() {
  const unseenCount = useUnseenCount()

  const mainItems: NavItemConfig[] = MAIN_NAV_ITEMS.map((item) => ({
    ...item,
    badge: 'showBadge' in item && item.showBadge ? unseenCount : 0,
  }))

  return (
    <aside className="hidden h-full w-[72px] shrink-0 flex-col rounded-2xl bg-surface py-4 shadow-sm ring-1 ring-slate-100/80 md:flex">
      <NavLink
        to={ROUTES.home}
        end
        className="mb-6 flex shrink-0 justify-center px-2"
        aria-label="PoliPlan inicio"
      >
        <img
          src={logoMark}
          alt=""
          className="h-10 w-10 select-none rounded-xl object-contain"
          draggable={false}
        />
      </NavLink>

      <div className="flex min-h-0 flex-1 flex-col px-2">
        <nav className="min-h-0 flex-1" aria-label="Navegación principal" data-tour="app-nav">
          <NavRail
            items={mainItems}
            footerItems={[SETTINGS_ITEM]}
            layout="vertical"
            className="h-full"
          />
        </nav>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const unseenCount = useUnseenCount()

  const mobileItems: NavItemConfig[] = [
    {
      ...MAIN_NAV_ITEMS[0],
      end: true,
    },
    MAIN_NAV_ITEMS[2],
    MAIN_NAV_ITEMS[3],
    {
      ...MAIN_NAV_ITEMS[4],
      badge: unseenCount,
    },
    SETTINGS_ITEM,
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-surface/95 backdrop-blur md:hidden"
      aria-label="Navegación móvil"
      data-tour="app-nav"
    >
      <div className="mx-auto max-w-lg px-1 py-1">
        <NavRail items={mobileItems} layout="horizontal" />
      </div>
    </nav>
  )
}
