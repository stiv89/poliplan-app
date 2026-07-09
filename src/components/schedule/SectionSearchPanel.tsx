/**
 * SectionSearchPanel — Materias laterales (tarjetas estilo Coursicle)
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Search,
  AlertTriangle,
  Check,
  X,
  Plus,
  Minus,
  Clock,
  ChevronDown,
  Layers,
  List,
  type LucideIcon,
} from 'lucide-react'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { CourseFootnoteCardNote } from '@/components/schedule/CourseFootnoteNotice'
import { SectionExplorerFilterMenu } from '@/components/schedule/SectionExplorerFilterMenu'
import { CompactCareerSelect } from '@/components/schedule/CompactCareerSelect'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { useSupportsHover } from '@/components/schedule/useClassBlockPopover'
import { resolveSectionShift } from '@/utils/sectionCode'
import { getConflictsForSection } from '@/utils/conflicts'
import { filterAndRankSections } from '@/utils/fuzzySearch'
import { formatScheduleCompact, getCourseSemesterNumber, groupSectionsByCourse, type SectionCourseInfo } from '@/utils/sectionDisplay'
import { resolveSectionElectiveName } from '@/utils/electiveCourses'
import {
  buildActiveExplorerFilterChips,
  clearSectionExplorerFilters,
  countSectionExplorerFilters,
} from '@/utils/sectionExplorerFilters'
import {
  readExplorerBrowseMode,
  writeExplorerBrowseMode,
  type ExplorerBrowseMode,
} from '@/utils/explorerBrowseMode'
import { sectionMatchesViewFilters } from '@/utils/scheduleFilters'
import type { AcademicPeriod, Career, CourseSection, ScheduleConflict } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'

const OTHER_SEMESTER_KEY = 0
const HOVER_OPEN_DELAY_MS = 450
const HOVER_CLOSE_DELAY_MS = 120

const BROWSE_MODE_OPTIONS: {
  id: ExplorerBrowseMode
  label: string
  compactLabel: string
  Icon: LucideIcon
}[] = [
  { id: 'semester', label: 'Por semestre', compactLabel: 'Semestre', Icon: Layers },
  { id: 'all', label: 'Todas las materias', compactLabel: 'Todas', Icon: List },
]

interface SectionSearchPanelProps {
  careers: Career[]
  selectedCareerId: string | null
  allSections: CourseSection[]
  coursesById: Map<string, SectionCourseInfo>
  conflicts: ScheduleConflict[]
  isSectionSelected: (id: string) => boolean
  onToggle: (section: CourseSection) => void
  toggleLoading: boolean
  initialSearch?: string
  onClose?: () => void
  onPreviewSection?: (section: CourseSection | null) => void
  previewSectionId?: string | null
  viewFilters?: ScheduleViewFilters
  academicPeriods?: AcademicPeriod[]
  selectedPeriodId?: string | null
  onPeriodChange?: (periodId: string) => void
  onViewFiltersChange?: (filters: ScheduleViewFilters) => void
  catalogLoading?: boolean
  selectedSectionIds?: string[]
  onCareerChange?: (careerId: string | null) => void
}

export function SectionSearchPanel({
  careers,
  selectedCareerId,
  allSections,
  coursesById,
  conflicts,
  isSectionSelected,
  onToggle,
  toggleLoading,
  initialSearch = '',
  onClose,
  onPreviewSection,
  previewSectionId = null,
  viewFilters,
  academicPeriods = [],
  selectedPeriodId = null,
  onPeriodChange,
  onViewFiltersChange,
  catalogLoading = false,
  selectedSectionIds = [],
  onCareerChange,
}: SectionSearchPanelProps) {
  const [search, setSearch] = useState(initialSearch)
  const [shiftFilter, setShiftFilter] = useState<string | null>(null)
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(() => new Set())
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null)
  const hoverOpenTimeoutRef = useRef<number | null>(null)
  const hoverCloseTimeoutRef = useRef<number | null>(null)
  const supportsHover = useSupportsHover()
  const [browseMode, setBrowseMode] = useState<ExplorerBrowseMode>(() => readExplorerBrowseMode())

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setShiftFilter(null)
    setSemesterFilter(null)
    setExpandedSemesters(new Set())
  }, [selectedCareerId])

  useEffect(() => {
    return () => {
      if (hoverOpenTimeoutRef.current != null) {
        window.clearTimeout(hoverOpenTimeoutRef.current)
      }
      if (hoverCloseTimeoutRef.current != null) {
        window.clearTimeout(hoverCloseTimeoutRef.current)
      }
    }
  }, [])

  const hasCareer = Boolean(selectedCareerId)
  const hasSearch = search.trim().length > 0
  const isMobileSheet = Boolean(onClose)
  const isSemesterMode = browseMode === 'semester'
  /** Semester mode always groups (including search results) */
  const showSemesterBlocks = isSemesterMode
  const showFullList = browseMode === 'all'

  const searchMatches = useMemo(() => {
    if (!hasCareer) return []

    return filterAndRankSections(allSections, search, coursesById)
  }, [allSections, coursesById, hasCareer, search])

  const availableSemesters = useMemo(() => {
    const semesters = new Set<number>()
    for (const section of allSections) {
      const course = coursesById.get(section.courseId)
      const semester = course ? getCourseSemesterNumber(course) : null
      if (semester) semesters.add(semester)
    }
    return [...semesters].sort((a, b) => a - b)
  }, [allSections, coursesById])

  const filteredSections = useMemo(() => {
    const results = (shiftFilter
      ? searchMatches.filter((section) => resolveSectionShift(section) === shiftFilter)
      : searchMatches
    )
      .filter((section) => {
        if (semesterFilter == null) return true
        const course = coursesById.get(section.courseId)
        return course ? getCourseSemesterNumber(course) === semesterFilter : false
      })
      .filter((section) =>
      viewFilters ? sectionMatchesViewFilters(section, viewFilters) : true,
    )

    if (hasSearch) return results

    return [...results].sort((a, b) => {
      const aCourse = coursesById.get(a.courseId)?.name ?? ''
      const bCourse = coursesById.get(b.courseId)?.name ?? ''
      return aCourse.localeCompare(bCourse) || a.sectionCode.localeCompare(b.sectionCode)
    })
  }, [searchMatches, shiftFilter, semesterFilter, coursesById, viewFilters, hasSearch])

  const courseGroups = useMemo(
    () => groupSectionsByCourse(filteredSections, coursesById, { preserveOrder: hasSearch }),
    [filteredSections, coursesById, hasSearch],
  )

  const semesterBlocks = useMemo(() => {
    const bySemester = new Map<number, typeof courseGroups>()
    for (const group of courseGroups) {
      const key = group.courseSemester ?? OTHER_SEMESTER_KEY
      const list = bySemester.get(key) ?? []
      list.push(group)
      bySemester.set(key, list)
    }

    return [...bySemester.entries()]
      .sort(([a], [b]) => {
        if (a === OTHER_SEMESTER_KEY) return 1
        if (b === OTHER_SEMESTER_KEY) return -1
        return a - b
      })
      .map(([semester, groups]) => ({
        semester,
        groups,
        courseCount: groups.length,
        selectedCourseCount: groups.filter((group) =>
          group.sections.some((section) => isSectionSelected(section.id)),
        ).length,
      }))
  }, [courseGroups, isSectionSelected])

  const browseContextKey = `${selectedCareerId ?? ''}:${browseMode}:${semesterFilter ?? 'all'}:${shiftFilter ?? 'all'}`

  useEffect(() => {
    if (hasSearch || showSemesterBlocks) {
      setExpandedGroups(new Set())
      return
    }

    const selectedIds = new Set(selectedSectionIds)
    const next = new Set<string>()
    for (const group of courseGroups) {
      if (group.sections.some((section) => selectedIds.has(section.id))) {
        next.add(group.groupKey)
        if (isMobileSheet) break
      }
    }
    setExpandedGroups(next)
  }, [browseContextKey, hasSearch, showSemesterBlocks, isMobileSheet])

  useEffect(() => {
    if (hasSearch || isMobileSheet || showSemesterBlocks) return

    setExpandedGroups((current) => {
      const selectedIds = new Set(selectedSectionIds)
      const next = new Set(current)
      let changed = false

      for (const group of courseGroups) {
        if (
          group.sections.some((section) => selectedIds.has(section.id)) &&
          !next.has(group.groupKey)
        ) {
          next.add(group.groupKey)
          changed = true
        }
      }

      return changed ? next : current
    })
  }, [selectedSectionIds, hasSearch, isMobileSheet, showSemesterBlocks])

  useEffect(() => {
    if (!showSemesterBlocks) return

    setExpandedSemesters((current) => {
      if (hasSearch) {
        return new Set(semesterBlocks.map((block) => block.semester))
      }
      if (current.size > 0) return current
      const next = new Set<number>()
      for (const block of semesterBlocks) {
        if (block.selectedCourseCount > 0) {
          next.add(block.semester)
          if (isMobileSheet) break
        }
      }
      if (next.size === 0) {
        const first = semesterBlocks[0]
        if (first) next.add(first.semester)
      }
      return next
    })
  }, [browseContextKey, showSemesterBlocks, isMobileSheet, semesterBlocks, hasSearch])

  const toggleGroupExpanded = (groupKey: string) => {
    setHoveredGroupKey(null)
    setExpandedGroups((current) => {
      if (current.has(groupKey)) return new Set()
      if (isMobileSheet || showSemesterBlocks) return new Set([groupKey])
      const next = new Set(current)
      next.add(groupKey)
      return next
    })
  }

  const clearHoverOpenTimeout = () => {
    if (hoverOpenTimeoutRef.current != null) {
      window.clearTimeout(hoverOpenTimeoutRef.current)
      hoverOpenTimeoutRef.current = null
    }
  }

  const clearHoverCloseTimeout = () => {
    if (hoverCloseTimeoutRef.current != null) {
      window.clearTimeout(hoverCloseTimeoutRef.current)
      hoverCloseTimeoutRef.current = null
    }
  }

  const clearHoverPreview = () => {
    clearHoverOpenTimeout()
    clearHoverCloseTimeout()
    setHoveredGroupKey(null)
  }

  const handleGroupHoverStart = (groupKey: string) => {
    if (!supportsHover || isMobileSheet) return
    clearHoverCloseTimeout()
    clearHoverOpenTimeout()
    hoverOpenTimeoutRef.current = window.setTimeout(() => {
      setHoveredGroupKey(groupKey)
    }, HOVER_OPEN_DELAY_MS)
  }

  const handleGroupHoverEnd = (groupKey: string) => {
    if (!supportsHover || isMobileSheet) return
    clearHoverOpenTimeout()
    clearHoverCloseTimeout()
    hoverCloseTimeoutRef.current = window.setTimeout(() => {
      setHoveredGroupKey((current) => (current === groupKey ? null : current))
    }, HOVER_CLOSE_DELAY_MS)
  }

  const handleExplorerScroll = () => {
    if (!supportsHover || isMobileSheet) return
    clearHoverPreview()
  }

  const toggleSemesterExpanded = (semester: number) => {
    setExpandedSemesters((current) => {
      if (current.has(semester)) {
        const next = new Set(current)
        next.delete(semester)
        return next
      }
      if (isMobileSheet) return new Set([semester])
      const next = new Set(current)
      next.add(semester)
      return next
    })
  }

  function handleBrowseModeChange(mode: ExplorerBrowseMode) {
    setBrowseMode(mode)
    writeExplorerBrowseMode(mode)
    setExpandedGroups(new Set())
    if (mode === 'semester') {
      setSemesterFilter(null)
      setShiftFilter(null)
      if (onViewFiltersChange && viewFilters) {
        clearSectionExplorerFilters(setSemesterFilter, setShiftFilter, onViewFiltersChange)
      }
      setExpandedSemesters(new Set())
    }
  }

  const activeFilterChips = useMemo(() => {
    if (!onViewFiltersChange || !viewFilters) return []

    return buildActiveExplorerFilterChips({
      semesterFilter,
      shiftFilter,
      viewFilters,
      onSemesterChange: setSemesterFilter,
      onShiftChange: setShiftFilter,
      onViewFiltersChange,
    })
  }, [onViewFiltersChange, semesterFilter, shiftFilter, viewFilters])

  const activeFilterCount = useMemo(
    () =>
      viewFilters
        ? countSectionExplorerFilters({ semesterFilter, shiftFilter, viewFilters })
        : Number(semesterFilter != null) + Number(shiftFilter != null),
    [semesterFilter, shiftFilter, viewFilters],
  )

  const courseCountLabel = useMemo(() => {
    if (catalogLoading) return 'Cargando…'
    if (courseGroups.length === 0) return 'Sin resultados'
    if (showSemesterBlocks) {
      return `${semesterBlocks.length} semestre${semesterBlocks.length !== 1 ? 's' : ''} · ${courseGroups.length} materia${courseGroups.length !== 1 ? 's' : ''}`
    }
    return `${courseGroups.length} materia${courseGroups.length !== 1 ? 's' : ''}`
  }, [
    catalogLoading,
    courseGroups.length,
    showSemesterBlocks,
    semesterBlocks.length,
  ])

  function handleClearFilters() {
    if (onViewFiltersChange && viewFilters) {
      clearSectionExplorerFilters(setSemesterFilter, setShiftFilter, onViewFiltersChange)
      return
    }
    setSemesterFilter(null)
    setShiftFilter(null)
  }

  function renderCourseGroup(group: (typeof courseGroups)[number]) {
    const pinned = expandedGroups.has(group.groupKey)
    const expanded = pinned || hoveredGroupKey === group.groupKey

    return (
      <CourseGroupCard
        key={group.groupKey}
        group={group}
        coursesById={coursesById}
        expanded={expanded}
        collapsible
        listMode
        dense={!isMobileSheet}
        hideSemesterMeta={showSemesterBlocks}
        onToggleExpanded={() => toggleGroupExpanded(group.groupKey)}
        onHoverStart={() => handleGroupHoverStart(group.groupKey)}
        onHoverEnd={() => handleGroupHoverEnd(group.groupKey)}
        conflicts={conflicts}
        isSectionSelected={isSectionSelected}
        toggleLoading={toggleLoading}
        onToggle={onToggle}
        onPreview={onPreviewSection}
        previewSectionId={previewSectionId}
      />
    )
  }

  return (
    <div className={`flex h-full flex-col bg-white ${isMobileSheet ? '' : 'explorer-panel--desktop'}`}>
      {hasCareer && (
        <div className={`shrink-0 border-b border-slate-200/50 ${isMobileSheet ? 'px-3 py-2' : 'px-3 py-1.5'}`}>
          <div className="flex items-center gap-1.5">
            {!isMobileSheet && onClose && (
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            )}

            <div className="explorer-toolbar flex h-10 min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border border-slate-200/80 bg-white">
              <div className="relative min-w-0 flex-[7]">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar materia…"
                  className="h-full w-full border-0 bg-transparent py-0 pl-8 pr-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  aria-label="Buscar materias o secciones"
                />
              </div>

              <div className="my-1.5 w-px shrink-0 bg-slate-200/80" aria-hidden="true" />

              <BrowseModeMenu
                value={browseMode}
                onChange={handleBrowseModeChange}
                compactLabel={isMobileSheet}
              />
            </div>

            {showFullList && onViewFiltersChange && viewFilters && (
              <SectionExplorerFilterMenu
                periods={academicPeriods}
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={(periodId) => onPeriodChange?.(periodId)}
                viewFilters={viewFilters}
                onViewFiltersChange={onViewFiltersChange}
                semesterFilter={semesterFilter}
                onSemesterFilterChange={setSemesterFilter}
                availableSemesters={availableSemesters}
                shiftFilter={shiftFilter}
                onShiftFilterChange={setShiftFilter}
                resultCount={filteredSections.length}
                align="right"
                presentation={isMobileSheet ? 'sheet' : 'popover'}
              />
            )}
          </div>

          {showFullList && activeFilterCount > 0 && (
            <div className="mt-2 flex min-h-5 items-center gap-2">
              <div className="-mx-1 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1 pb-0.5">
                {activeFilterChips.map((chip) => (
                  <ActiveFilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
                ))}
              </div>
              <button
                type="button"
                onClick={handleClearFilters}
                className="shrink-0 text-[11px] text-slate-400 transition hover:text-slate-600"
              >
                Limpiar
              </button>
            </div>
          )}

          <p className="mt-1 text-[10px] leading-tight text-slate-400">{courseCountLabel}</p>
        </div>
      )}

      {!hasCareer ? (
        <CareerRequiredPrompt
          careers={careers}
          selectedCareerId={selectedCareerId}
          onCareerChange={onCareerChange}
          isMobileSheet={Boolean(onClose)}
        />
      ) : (
        <div
          className={`explorer-scroll flex-1 overflow-y-auto ${
            isMobileSheet ? 'px-3 py-2' : 'px-2.5 py-1.5'
          } course-explorer-list`}
          onScroll={handleExplorerScroll}
        >
          {catalogLoading ? (
            <SectionListSkeleton />
          ) : filteredSections.length === 0 ? (
            <div className="px-2 py-8 text-center">
              <p className="text-sm text-muted">
                {allSections.length === 0
                  ? 'No hay materias cargadas para esta carrera.'
                  : 'No se encontraron resultados.'}
              </p>
            </div>
          ) : showSemesterBlocks ? (
            <div className={isMobileSheet ? 'space-y-2' : 'space-y-1.5'}>
              {semesterBlocks.map((block) => {
                const expanded = expandedSemesters.has(block.semester)
                return (
                  <SemesterBlock
                    key={block.semester}
                    semester={block.semester}
                    courseCount={block.courseCount}
                    selectedCourseCount={block.selectedCourseCount}
                    expanded={expanded}
                    compact={!isMobileSheet}
                    onToggle={() => toggleSemesterExpanded(block.semester)}
                  >
                    {expanded && (
                      <div className="course-explorer-list">
                        {block.groups.map((group) => renderCourseGroup(group))}
                      </div>
                    )}
                  </SemesterBlock>
                )
              })}
            </div>
          ) : (
            <>{courseGroups.map((group) => renderCourseGroup(group))}</>
          )}
        </div>
      )}
    </div>
  )
}

function BrowseModeMenu({
  value,
  onChange,
  compactLabel = false,
}: {
  value: ExplorerBrowseMode
  onChange: (mode: ExplorerBrowseMode) => void
  compactLabel?: boolean
}) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const activeOption =
    BROWSE_MODE_OPTIONS.find((option) => option.id === value) ?? BROWSE_MODE_OPTIONS[0]!
  const ActiveIcon = activeOption.Icon
  const label = compactLabel ? activeOption.compactLabel : activeOption.label

  return (
    <div className="relative flex shrink-0 basis-[30%] items-stretch">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Vista de materias"
        className="flex w-full items-center justify-between gap-0.5 px-2 text-left transition hover:bg-slate-50/80 sm:px-2.5"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <ActiveIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
          <span className="min-w-0 truncate text-[11px] font-medium text-slate-700 sm:text-xs">
            {label}
          </span>
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align="right"
        offset={6}
        className="w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg"
      >
        <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
          Vista de materias
        </p>
        {BROWSE_MODE_OPTIONS.map((option) => {
          const selected = value === option.id
          const OptionIcon = option.Icon
          return (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={selected}
              onClick={() => {
                onChange(option.id)
                setOpen(false)
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                selected ? 'bg-primary/[0.04] text-slate-900' : 'text-slate-600'
              }`}
            >
              <OptionIcon
                className={`h-4 w-4 shrink-0 ${selected ? 'text-primary' : 'text-slate-400'}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">{option.label}</span>
              {selected && (
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </AnimatedPopover>
    </div>
  )
}

function SemesterBlock({
  semester,
  courseCount,
  selectedCourseCount,
  expanded,
  onToggle,
  children,
  compact = false,
}: {
  semester: number
  courseCount: number
  selectedCourseCount: number
  expanded: boolean
  onToggle: () => void
  children: ReactNode
  compact?: boolean
}) {
  const title =
    semester === OTHER_SEMESTER_KEY ? 'Sin semestre' : `Semestre ${semester}`
  const meta = [
    `${courseCount} materia${courseCount !== 1 ? 's' : ''}`,
    selectedCourseCount > 0 ? `${selectedCourseCount} en horario` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section
      className={`overflow-hidden rounded-xl border transition ${
        expanded
          ? 'border-slate-200 bg-white'
          : 'border-slate-200/80 bg-slate-50/60 hover:border-slate-300/70'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-2.5 text-left ${
          compact ? 'px-3 py-2.5' : 'gap-3 px-3.5 py-3.5'
        }`}
      >
        <span
          className={`flex shrink-0 items-center justify-center rounded-lg ${
            compact ? 'h-7 w-7' : 'h-9 w-9 rounded-xl'
          } ${expanded ? 'bg-primary/8 text-primary' : 'bg-white text-slate-500'}`}
          aria-hidden="true"
        >
          <Layers className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block font-bold tracking-tight text-slate-900 ${
              compact ? 'text-[13px]' : 'text-[15px]'
            }`}
          >
            {title}
          </span>
          <span className="mt-0.5 block text-[11px] font-normal text-slate-500">{meta}</span>
        </span>
        <span
          className={`flex shrink-0 items-center justify-center rounded-full border ${
            compact ? 'h-6 w-6' : 'h-7 w-7'
          } ${
            expanded
              ? 'border-slate-300 bg-white text-slate-700'
              : 'border-slate-200 bg-white/70 text-slate-500'
          }`}
          aria-hidden="true"
        >
          {expanded ? (
            <Minus className="h-3 w-3" strokeWidth={2.25} />
          ) : (
            <Plus className="h-3 w-3" strokeWidth={2.25} />
          )}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 bg-white px-1 pb-1 pt-0.5">{children}</div>
      )}
    </section>
  )
}

function CareerRequiredPrompt({
  careers,
  selectedCareerId,
  onCareerChange,
  isMobileSheet,
}: {
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange?: (careerId: string | null) => void
  isMobileSheet: boolean
}) {
  const canPickCareer = Boolean(onCareerChange) && careers.length > 0

  return (
    <div
      className={`flex flex-1 flex-col px-5 py-8 ${
        isMobileSheet ? 'items-center text-center' : 'text-left'
      }`}
    >
      <h2 className="text-base font-semibold tracking-tight text-text">
        Agregá materias a tu horario
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Elegí una carrera para explorar sus materias. Podés combinar materias de distintas carreras.
      </p>

      {canPickCareer ? (
        isMobileSheet ? (
          <div className="mt-6 w-full max-w-sm text-left">
            <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wide text-muted">
              Seleccionar carrera
            </p>
            <ul className="max-h-[min(18rem,42vh)] space-y-2 overflow-y-auto">
              {careers.map((career) => {
                const selected = career.id === selectedCareerId
                return (
                  <li key={career.id}>
                    <button
                      type="button"
                      onClick={() => onCareerChange?.(career.id)}
                      aria-pressed={selected}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition active:scale-[0.99] ${
                        selected
                          ? 'border-primary/30 bg-primary/[0.06]'
                          : 'border-slate-200/80 bg-white hover:border-primary/20 hover:bg-primary/[0.03]'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-text">
                          {career.code ?? career.name}
                        </span>
                        {career.code && (
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            {career.name}
                          </span>
                        )}
                      </span>
                      {selected && (
                        <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <div className="mt-5 max-w-sm">
            <CompactCareerSelect
              careers={careers}
              selectedCareerId={selectedCareerId}
              onCareerChange={(careerId) => onCareerChange?.(careerId)}
              prominent
              placeholder="Seleccionar carrera"
              className="w-full"
            />
          </div>
        )
      ) : (
        <p className="mt-4 text-xs text-muted">No hay carreras disponibles todavía.</p>
      )}
    </div>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-slate-200/80 bg-white px-2 py-0.5 text-[10px] font-normal text-slate-500">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-slate-400 transition hover:text-slate-600"
        aria-label={`Quitar filtro ${label}`}
      >
        ×
      </button>
    </span>
  )
}

function CourseGroupCard({
  group,
  coursesById,
  expanded,
  collapsible,
  listMode = false,
  dense = false,
  hideSemesterMeta = false,
  onToggleExpanded,
  conflicts,
  isSectionSelected,
  toggleLoading,
  onToggle,
  onPreview,
  previewSectionId,
  onHoverStart,
  onHoverEnd,
}: {
  group: ReturnType<typeof groupSectionsByCourse>[number]
  coursesById: Map<string, SectionCourseInfo>
  expanded: boolean
  collapsible: boolean
  listMode?: boolean
  dense?: boolean
  hideSemesterMeta?: boolean
  onToggleExpanded: () => void
  onHoverStart?: () => void
  onHoverEnd?: () => void
  conflicts: ScheduleConflict[]
  isSectionSelected: (id: string) => boolean
  toggleLoading: boolean
  onToggle: (section: CourseSection) => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
}) {
  const selectedSections = group.sections.filter((section) => isSectionSelected(section.id))
  const selectedCount = selectedSections.length
  const allSelected = selectedCount > 0 && selectedCount === group.sections.length
  const someSelected = selectedCount > 0 && !allSelected
  const semesterLabel =
    !hideSemesterMeta && group.courseSemester ? `${group.courseSemester}.º` : null
  const sectionCountLabel = `${group.sections.length} sección${group.sections.length !== 1 ? 'es' : ''}`
  const metaLine = [
    semesterLabel,
    sectionCountLabel,
    selectedCount > 0 ? `${selectedCount} en horario` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  function handleCourseCheckboxChange() {
    const onlySection = group.sections[0]
    if (group.sections.length === 1 && onlySection) {
      onToggle(onlySection)
      return
    }

    if (selectedCount > 0) {
      for (const section of selectedSections) {
        onToggle(section)
      }
      return
    }

    if (collapsible && !expanded) {
      onToggleExpanded()
    }
  }

  const headerContent = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-3">
        <h3
          className={`min-w-0 font-semibold leading-snug tracking-tight text-slate-800 ${
            dense ? 'text-[13px]' : 'text-[14px]'
          }`}
        >
          {group.courseDisplayName}
          {group.courseFootnote === 'final_exam_only' && (
            <span className="ml-1 text-sm font-semibold text-amber-700/90" aria-hidden="true">
              *
            </span>
          )}
        </h3>
        {collapsible && (
          <ChevronDown
            className="course-card-chevron mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
            aria-hidden="true"
          />
        )}
      </div>

      {metaLine && (
        <p className="mt-0.5 text-[11px] font-normal text-slate-400">{metaLine}</p>
      )}

      {group.courseFootnote && expanded && (
        <div className="mt-1.5">
          <CourseFootnoteCardNote kind={group.courseFootnote} />
        </div>
      )}
    </div>
  )

  const courseCheckbox = (
    <label className="course-card-checkbox-wrap">
      <input
        type="checkbox"
        className="section-cell-checkbox"
        checked={allSelected || someSelected}
        ref={(node) => {
          if (node) node.indeterminate = someSelected
        }}
        disabled={toggleLoading}
        onChange={handleCourseCheckboxChange}
        onClick={(event) => event.stopPropagation()}
        aria-label={
          selectedCount > 0
            ? `Quitar ${group.courseDisplayName} del horario`
            : group.sections.length === 1
              ? `Agregar ${group.courseDisplayName} al horario`
              : `Elegir sección de ${group.courseDisplayName}`
        }
      />
    </label>
  )

  const useScroll = dense && group.sections.length > 5

  const sectionsList = (
    <ul
      className={`course-card-sections ${
        listMode
          ? `space-y-0 px-0 pb-1.5 pt-0.5 ${useScroll ? 'sections-scroll-desktop' : ''}`
          : 'space-y-2 px-3 pb-3'
      }`}
    >
      {group.sections.map((section) => (
        <SectionGroupRow
          key={section.id}
          section={section}
          course={coursesById.get(section.courseId)}
          isFinalExamOnly={group.courseFootnote === 'final_exam_only'}
          selected={isSectionSelected(section.id)}
          conflicts={conflicts}
          toggleLoading={toggleLoading}
          onToggle={() => onToggle(section)}
          onPreview={onPreview}
          previewSectionId={previewSectionId}
          compact
          dense={dense}
        />
      ))}
    </ul>
  )

  const isOpen = collapsible && expanded
  const surfaceClass = `course-card-surface course-card-list ${isOpen ? 'is-open' : ''} ${
    dense ? 'course-card-list--dense' : ''
  } ${selectedCount > 0 ? 'has-selected' : ''}`

  return (
    <article
      className={`${surfaceClass} overflow-hidden`}
      data-open={isOpen ? 'true' : 'false'}
      data-collapsible={collapsible ? 'true' : 'false'}
      onMouseEnter={collapsible ? onHoverStart : undefined}
      onMouseLeave={collapsible ? onHoverEnd : undefined}
    >
      {collapsible ? (
        <div
          className={`course-card-header-row flex w-full items-start gap-2.5 ${
            !isOpen ? 'course-list-row-btn' : ''
          }`}
        >
          {courseCheckbox}
          <button
            type="button"
            onClick={onToggleExpanded}
            aria-expanded={expanded}
            className="course-card-header-btn flex min-w-0 flex-1 items-start text-left"
          >
            {headerContent}
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 px-0 py-2">
          {courseCheckbox}
          {headerContent}
        </div>
      )}

      {collapsible ? (
        <div className="course-card-details" aria-hidden={!expanded}>
          <div className="course-card-details-inner">{sectionsList}</div>
        </div>
      ) : (
        sectionsList
      )}
    </article>
  )
}

function SectionGroupRow({
  section,
  isFinalExamOnly,
  selected,
  conflicts,
  toggleLoading,
  onToggle,
  onPreview,
  previewSectionId,
  course,
  compact = false,
  dense = false,
}: {
  section: CourseSection
  isFinalExamOnly: boolean
  selected: boolean
  conflicts: ScheduleConflict[]
  toggleLoading: boolean
  onToggle: () => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
  course?: SectionCourseInfo | null
  compact?: boolean
  dense?: boolean
}) {
  const sectionConflicts = getConflictsForSection(section.id, conflicts)
  const hasConflict = sectionConflicts.length > 0
  const isPreviewTarget = previewSectionId === section.id
  const shift = resolveSectionShift(section)
  const specificName = resolveSectionElectiveName(section, course)
  const sectionLabel = specificName ?? section.sectionCode

  const scheduleLabel = formatScheduleCompact(section.meetings, { isFinalExamOnly })
  const sectionTitle = [sectionLabel, shift].filter(Boolean).join(' · ')

  if (compact) {
    return (
      <li
        className={[
          'section-cell',
          dense ? 'section-cell--dense' : '',
          selected ? 'is-selected' : '',
          hasConflict && !selected ? 'is-conflict' : '',
          isPreviewTarget && !selected ? 'is-preview' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseEnter={() => {
          if (!selected) onPreview?.(section)
        }}
        onMouseLeave={() => onPreview?.(null)}
      >
        <label className="section-cell-label">
          <input
            type="checkbox"
            className="section-cell-checkbox"
            checked={selected}
            disabled={toggleLoading}
            onChange={() => onToggle()}
            aria-label={
              selected
                ? `Quitar sección ${section.sectionCode}`
                : `Agregar sección ${section.sectionCode}`
            }
          />
          <span className="section-cell-body">
            <span className="section-cell-top">
              <span className="section-cell-code">{sectionLabel}</span>
              {shift && <span className="section-cell-shift">{shift}</span>}
              {hasConflict && (
                <span className="section-cell-conflict">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  Conflicto
                </span>
              )}
            </span>
            <span className="section-cell-schedule">{scheduleLabel}</span>
            <span className="section-cell-teacher">
              {section.teacherName ? (
                <TeacherNameButton
                  teacherId={section.teacherId}
                  teacherName={section.teacherName}
                  teacherEmail={section.teacherEmail}
                  courseId={section.courseId}
                  academicPeriodId={section.academicPeriodId}
                  className="section-cell-teacher-btn"
                />
              ) : (
                <span className="text-slate-400">Sin docente</span>
              )}
            </span>
          </span>
        </label>
      </li>
    )
  }

  const toggleButton = (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      disabled={toggleLoading}
      aria-pressed={selected}
      aria-label={
        selected
          ? `Quitar sección ${section.sectionCode}`
          : `Agregar sección ${section.sectionCode}`
      }
      title={selected ? 'Quitar del horario' : 'Agregar al horario'}
      className={`add-section-btn ${selected ? 'is-added' : ''}`}
    >
      {selected ? (
        <Check className="check-pop h-3.5 w-3.5" strokeWidth={2.5} aria-hidden="true" />
      ) : (
        <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
      )}
    </button>
  )

  const rowClassName = [
    'section-row-surface',
    selected ? 'is-selected' : '',
    isPreviewTarget && !selected ? 'is-preview' : '',
    hasConflict && !selected ? 'is-conflict' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={rowClassName}
      onMouseEnter={() => {
        if (!selected) onPreview?.(section)
      }}
      onMouseLeave={() => onPreview?.(null)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-slate-800">{sectionTitle}</p>
        {toggleButton}
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs font-normal text-slate-500">
        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="truncate">{scheduleLabel}</span>
      </p>

      <div className="mt-1 min-w-0">
        {section.teacherName ? (
          <TeacherNameButton
            teacherId={section.teacherId}
            teacherName={section.teacherName}
            teacherEmail={section.teacherEmail}
            courseId={section.courseId}
            academicPeriodId={section.academicPeriodId}
            className="block max-w-full truncate text-left text-xs"
          />
        ) : (
          <span className="text-xs text-slate-400">Sin docente</span>
        )}
      </div>

      {hasConflict && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] font-normal text-amber-700/85">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Conflicto de horario
        </p>
      )}
    </li>
  )
}
