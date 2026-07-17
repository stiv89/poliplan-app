import {
  BookOpen,
  Calculator,
  ClipboardList,
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
  type ReactNode,
  type RefObject,
} from 'react'
import { NavLink, useLocation, useNavigate, matchPath } from 'react-router-dom'
import { ROUTES } from '@/config/constants'
import { SidebarThemeToggle } from '@/components/layout/SidebarThemeToggle'
import logoMark from '../../../logos/logo-sidebar.png'

const MAIN_NAV_ITEMS = [
  { to: ROUTES.home, label: 'Horario', icon: Home, end: true },
  { to: ROUTES.sections, label: 'Secciones', icon: BookOpen },
  { to: ROUTES.exams, label: 'Exámenes', icon: ClipboardList },
  { to: ROUTES.grading, label: 'Notas', icon: Calculator },
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

const SCRUB_DRAG_THRESHOLD_PX = 6

function findItemKeyAtPoint(
  x: number,
  y: number,
  itemRefs: Map<string, HTMLElement>,
  layout: 'vertical' | 'horizontal',
): string | null {
  for (const [key, el] of itemRefs) {
    const rect = el.getBoundingClientRect()
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return key
    }
  }

  let nearest: string | null = null
  let nearestDist = Infinity

  for (const [key, el] of itemRefs) {
    const rect = el.getBoundingClientRect()
    const center = layout === 'vertical' ? rect.top + rect.height / 2 : rect.left + rect.width / 2
    const point = layout === 'vertical' ? y : x
    const dist = Math.abs(point - center)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = key
    }
  }

  return nearest
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
  previewActive,
  previewMode,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
  onSuppressClick,
}: NavItemConfig & {
  itemRef?: (element: HTMLElement | null) => void
  previewActive?: boolean
  previewMode?: boolean
  onScrubStart?: (event: React.PointerEvent<HTMLAnchorElement>, key: string) => void
  onScrubMove?: (event: React.PointerEvent<HTMLAnchorElement>) => void
  onScrubEnd?: (event: React.PointerEvent<HTMLAnchorElement>) => void
  onSuppressClick?: () => boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      ref={itemRef}
      data-nav-key={to}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId)
        onScrubStart?.(event, to)
      }}
      onPointerMove={(event) => onScrubMove?.(event)}
      onPointerUp={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        onScrubEnd?.(event)
      }}
      onPointerCancel={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId)
        }
        onScrubEnd?.(event)
      }}
      onClick={(event) => {
        if (onSuppressClick?.()) {
          event.preventDefault()
        }
      }}
      className={({ isActive }) => {
        const active = previewMode ? previewActive : isActive
        return `group relative z-10 flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-[color,transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.96] ${
          active ? 'text-primary' : 'text-slate-500/90 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200'
        }`
      }}
      aria-label={badge > 0 ? `${label} (${badge} sin ver)` : label}
    >
      {({ isActive }) => {
        const active = previewMode ? previewActive : isActive

        return (
          <>
            <span className="relative">
              <Icon
                className={`h-[21px] w-[21px] transition-[stroke-width,color,opacity,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  active ? 'scale-105 stroke-[2.25]' : 'scale-100 stroke-[1.5]'
                }`}
                aria-hidden="true"
              />
              {badge > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-slate-50"
                  aria-hidden="true"
                >
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span
              className={`max-w-full truncate text-[10px] leading-none transition-[opacity,color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                active ? 'scale-100 font-semibold opacity-100' : 'scale-[0.98] font-normal opacity-90'
              }`}
            >
              {label}
            </span>
          </>
        )
      }}
    </NavLink>
  )
}

function NavRail({
  items,
  layout,
  className = '',
  footerItems,
  footerLeading,
}: {
  items: NavItemConfig[]
  layout: 'vertical' | 'horizontal'
  className?: string
  footerItems?: NavItemConfig[]
  footerLeading?: ReactNode
}) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const isScrubbingRef = useRef(false)
  const suppressClickRef = useRef(false)
  const [scrubKey, setScrubKey] = useState<string | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  const allItems = footerItems ? [...items, ...footerItems] : items
  const activeKey =
    allItems.find((item) => isNavItemActive(pathname, item.to, item.end))?.to ?? null
  const previewKey = scrubKey ?? pendingKey
  const indicatorKey = previewKey ?? activeKey

  useEffect(() => {
    if (pendingKey && activeKey === pendingKey) {
      setPendingKey(null)
    }
  }, [activeKey, pendingKey])

  const resolveKeyAtPoint = useCallback(
    (x: number, y: number) => findItemKeyAtPoint(x, y, itemRefs.current, layout),
    [layout],
  )

  const handleScrubStart = useCallback((_event: React.PointerEvent, key: string) => {
    dragStartRef.current = { x: _event.clientX, y: _event.clientY }
    isScrubbingRef.current = false
    setIsScrubbing(false)
    setScrubKey(key)
    setPendingKey(key)
  }, [])

  const handleScrubMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragStartRef.current || event.buttons === 0) return

      const dx = event.clientX - dragStartRef.current.x
      const dy = event.clientY - dragStartRef.current.y
      if (!isScrubbingRef.current && Math.hypot(dx, dy) > SCRUB_DRAG_THRESHOLD_PX) {
        isScrubbingRef.current = true
        setIsScrubbing(true)
      }

      const key = resolveKeyAtPoint(event.clientX, event.clientY)
      if (key) {
        setScrubKey(key)
        setPendingKey(key)
      }
    },
    [resolveKeyAtPoint],
  )

  const handleScrubEnd = useCallback(
    (event: React.PointerEvent) => {
      const key =
        resolveKeyAtPoint(event.clientX, event.clientY) ?? scrubKey ?? pendingKey
      const wasScrubbing = isScrubbingRef.current

      dragStartRef.current = null
      isScrubbingRef.current = false
      setIsScrubbing(false)
      setScrubKey(null)

      if (wasScrubbing && key) {
        suppressClickRef.current = true
        const item = allItems.find((entry) => entry.to === key)
        if (item && !isNavItemActive(pathname, key, item.end)) {
          navigate(key)
        } else {
          setPendingKey(null)
        }
      }
    },
    [allItems, navigate, pathname, pendingKey, resolveKeyAtPoint, scrubKey],
  )

  const handleSuppressClick = useCallback(() => {
    if (!suppressClickRef.current) return false
    suppressClickRef.current = false
    return true
  }, [])

  const { indicator, updateIndicator } = useSlidingIndicator(containerRef, itemRefs, indicatorKey)
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
    <RailNavItem
      key={item.to}
      {...item}
      itemRef={setItemRef(item.to)}
      previewActive={previewKey === item.to}
      previewMode={previewKey != null}
      onScrubStart={handleScrubStart}
      onScrubMove={handleScrubMove}
      onScrubEnd={handleScrubEnd}
      onSuppressClick={handleSuppressClick}
    />
  )

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${
        layout === 'vertical' && footerItems ? 'flex min-h-0 flex-1 flex-col' : ''
      } ${isScrubbing ? 'nav-rail-scrubbing' : ''} ${className}`}
    >
      {indicator && (
        <span
          className={`nav-rail-indicator${
            isScrubbing ? ' nav-rail-indicator-scrubbing' : ''
          }${previewKey ? ' nav-rail-indicator-moving' : ''}`}
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
        <div
          className={`grid gap-0.5 ${
            allItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
          }`}
        >
          {allItems.map(renderItem)}
        </div>
      ) : footerItems ? (
        <>
          <div className="flex flex-col items-center gap-0.5">{items.map(renderItem)}</div>
          <div className="mt-auto flex flex-col items-center gap-1 pt-2">
            {footerLeading}
            {footerItems.map(renderItem)}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-0.5">{items.map(renderItem)}</div>
      )}
    </div>
  )
}

export function SidebarNav() {
  const mainItems: NavItemConfig[] = [...MAIN_NAV_ITEMS]

  return (
    <aside className="liquid-glass-sidebar hidden h-full w-[76px] shrink-0 flex-col overflow-hidden py-4 md:rounded-l-[24px] lg:w-20 md:flex">
      <NavLink
        to={ROUTES.home}
        end
        className="mb-6 flex shrink-0 justify-center px-2"
        aria-label="PoliPlan inicio"
      >
        <img
          src={logoMark}
          alt=""
          className="h-9 w-9 select-none rounded-lg object-contain opacity-90"
          draggable={false}
        />
      </NavLink>

      <div className="flex min-h-0 flex-1 flex-col px-2">
        <nav className="min-h-0 flex-1" aria-label="Navegación principal" data-tour="app-nav">
          <NavRail
            items={mainItems}
            footerItems={[SETTINGS_ITEM]}
            footerLeading={<SidebarThemeToggle />}
            layout="vertical"
            className="h-full"
          />
        </nav>
      </div>
    </aside>
  )
}

export function BottomNav() {
  const mobileItems: NavItemConfig[] = [
    {
      ...MAIN_NAV_ITEMS[0],
      end: true,
    },
    MAIN_NAV_ITEMS[1],
    MAIN_NAV_ITEMS[2],
    MAIN_NAV_ITEMS[3],
    SETTINGS_ITEM,
  ]

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden"
      aria-label="Navegación móvil"
      data-tour="app-nav"
    >
      <div className="liquid-glass-dock pointer-events-auto w-full max-w-md px-1.5 py-1.5">
        <NavRail items={mobileItems} layout="horizontal" />
      </div>
    </nav>
  )
}
