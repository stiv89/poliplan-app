/**
 * SectionSearchPanel — Materias laterales (tarjetas estilo Coursicle)
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Search,
  Check,
  X,
  Plus,
  Minus,
  Clock,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { CourseFootnoteCardNote } from '@/components/schedule/CourseFootnoteNotice'
import { CompactCareerSelect } from '@/components/schedule/CompactCareerSelect'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
import { useSupportsHover } from '@/components/schedule/useClassBlockPopover'
import { resolveSectionShift } from '@/utils/sectionCode'
import { filterAndRankSections } from '@/utils/fuzzySearch'
import { formatScheduleCompact, getConflictClusterCourseIds, getSectionConflictMessages, groupSectionsByCourse, findCrossCourseConflictPreview, type SectionCourseInfo } from '@/utils/sectionDisplay'
import { ScheduleConflictBanner, ScheduleConflictNote } from '@/components/schedule/ScheduleConflictNote'
import { resolveSectionElectiveName } from '@/utils/electiveCourses'
import { sectionMatchesViewFilters } from '@/utils/scheduleFilters'
import type { Career, CourseSection, ScheduleConflict } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'

const OTHER_SEMESTER_KEY = 0
const HOVER_OPEN_DELAY_MS = 450
const HOVER_CLOSE_DELAY_MS = 120

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
  catalogLoading?: boolean
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
  catalogLoading = false,
  onCareerChange,
}: SectionSearchPanelProps) {
  const [search, setSearch] = useState(initialSearch)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(() => new Set())
  const [hoveredGroupKey, setHoveredGroupKey] = useState<string | null>(null)
  const hoverOpenTimeoutRef = useRef<number | null>(null)
  const hoverCloseTimeoutRef = useRef<number | null>(null)
  const supportsHover = useSupportsHover()

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
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

  const allSectionsById = useMemo(
    () => new Map(allSections.map((section) => [section.id, section])),
    [allSections],
  )

  const selectedSections = useMemo(
    () => allSections.filter((section) => isSectionSelected(section.id)),
    [allSections, isSectionSelected],
  )

  const searchMatches = useMemo(() => {
    if (!hasCareer) return []

    return filterAndRankSections(allSections, search, coursesById)
  }, [allSections, coursesById, hasCareer, search])

  const filteredSections = useMemo(() => {
    const results = searchMatches.filter((section) =>
      viewFilters ? sectionMatchesViewFilters(section, viewFilters) : true,
    )

    if (hasSearch) return results

    return [...results].sort((a, b) => {
      const aCourse = coursesById.get(a.courseId)?.name ?? ''
      const bCourse = coursesById.get(b.courseId)?.name ?? ''
      return aCourse.localeCompare(bCourse) || a.sectionCode.localeCompare(b.sectionCode)
    })
  }, [searchMatches, viewFilters, coursesById, hasSearch])

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

  const browseContextKey = `${selectedCareerId ?? ''}:${semesterBlocks.length}`

  useEffect(() => {
    if (hasSearch) {
      // En búsqueda, abrir la mejor coincidencia (ya viene rankeada arriba).
      const top = courseGroups[0]
      setExpandedGroups(top ? new Set([top.groupKey]) : new Set())
      return
    }
    setExpandedGroups(new Set())
  }, [browseContextKey, hasSearch, search, courseGroups])

  useEffect(() => {
    setExpandedSemesters((current) => {
      if (hasSearch) {
        return new Set()
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
  }, [browseContextKey, isMobileSheet, semesterBlocks, hasSearch])

  const toggleGroupExpanded = (groupKey: string) => {
    setHoveredGroupKey(null)
    setExpandedGroups((current) => {
      if (current.has(groupKey)) return new Set()
      if (isMobileSheet) return new Set([groupKey])
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

  const courseCountLabel = useMemo(() => {
    if (catalogLoading) return 'Cargando…'
    if (courseGroups.length === 0) return 'Sin resultados'
    if (hasSearch) {
      return `${courseGroups.length} materia${courseGroups.length !== 1 ? 's' : ''} encontrada${courseGroups.length !== 1 ? 's' : ''}`
    }
    return `${semesterBlocks.length} semestre${semesterBlocks.length !== 1 ? 's' : ''} · ${courseGroups.length} materia${courseGroups.length !== 1 ? 's' : ''}`
  }, [catalogLoading, courseGroups.length, hasSearch, semesterBlocks.length])

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
        hideSemesterMeta
        onToggleExpanded={() => toggleGroupExpanded(group.groupKey)}
        onHoverStart={() => handleGroupHoverStart(group.groupKey)}
        onHoverEnd={() => handleGroupHoverEnd(group.groupKey)}
        conflicts={conflicts}
        selectedSections={selectedSections}
        allSectionsById={allSectionsById}
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

              <div className="relative flex shrink-0 basis-[30%] items-stretch">
                <div className="flex w-full items-center px-2 sm:px-2.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                    <span className="min-w-0 truncate text-[11px] font-medium text-slate-700 sm:text-xs">
                      {hasSearch ? 'Por relevancia' : 'Por semestre'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

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
          ) : hasSearch ? (
            <div className={`course-explorer-list ${isMobileSheet ? 'space-y-2' : 'space-y-1.5'}`}>
              {courseGroups.map((group) => renderCourseGroup(group))}
            </div>
          ) : (
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
          )}
        </div>
      )}

      {isMobileSheet && onClose && (
        <div className="shrink-0 border-t border-slate-100 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-center text-[11px] leading-snug text-muted">
            Se guarda al tocar + · Listo para cerrar
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition hover:bg-primary/90 active:scale-[0.99]"
          >
            Listo
          </button>
        </div>
      )}
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
      className={`semester-group overflow-hidden rounded-xl border transition ${
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
  selectedSections,
  allSectionsById,
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
  selectedSections: CourseSection[]
  allSectionsById: Map<string, CourseSection>
  isSectionSelected: (id: string) => boolean
  toggleLoading: boolean
  onToggle: (section: CourseSection) => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
}) {
  const selectedInGroup = group.sections.filter((section) => isSectionSelected(section.id))
  const selectedCount = selectedInGroup.length
  const allSelected = selectedCount > 0 && selectedCount === group.sections.length
  const someSelected = selectedCount > 0 && !allSelected
  const conflictCluster = getConflictClusterCourseIds(
    group.courseId,
    selectedSections,
    conflicts,
  )
  const showConflictBanner = expanded && conflictCluster.size >= 2
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
      for (const section of selectedInGroup) {
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
      {showConflictBanner && (
        <li className="schedule-conflict-banner-wrap">
          <ScheduleConflictBanner
            courseCount={conflictCluster.size}
            onViewDetail={() => {
              const target = findCrossCourseConflictPreview(
                group.courseId,
                selectedSections,
                conflicts,
              )
              if (target) onPreview?.(target)
            }}
          />
        </li>
      )}
      {group.sections.map((section) => (
        <SectionGroupRow
          key={section.id}
          section={section}
          course={coursesById.get(section.courseId)}
          isFinalExamOnly={group.courseFootnote === 'final_exam_only'}
          selected={isSectionSelected(section.id)}
          conflicts={conflicts}
          selectedSections={selectedSections}
          allSectionsById={allSectionsById}
          coursesById={coursesById}
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
  selectedSections,
  allSectionsById,
  coursesById,
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
  selectedSections: CourseSection[]
  allSectionsById: Map<string, CourseSection>
  coursesById: Map<string, SectionCourseInfo>
  toggleLoading: boolean
  onToggle: () => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
  course?: SectionCourseInfo | null
  compact?: boolean
  dense?: boolean
}) {
  const conflictMessages = getSectionConflictMessages(
    section,
    selected,
    selectedSections,
    conflicts,
    coursesById,
    allSectionsById,
  )
  const hasConflict = conflictMessages.length > 0
  const isPreviewTarget = previewSectionId === section.id
  const shift = resolveSectionShift(section)
  const specificName = resolveSectionElectiveName(section, course)
  const sectionLabel = specificName ?? section.sectionCode

  const scheduleLabel = formatScheduleCompact(section.meetings, { isFinalExamOnly })
  const sectionTitle = [sectionLabel, shift].filter(Boolean).join(' · ')
  const overlapNote = conflictMessages[0]

  if (compact) {
    return (
      <li
        className={[
          'section-cell',
          dense ? 'section-cell--dense' : '',
          selected ? 'is-selected' : '',
          hasConflict ? 'is-conflict' : '',
          isPreviewTarget && !selected ? 'is-preview' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onMouseEnter={() => {
          onPreview?.(selected ? null : section)
        }}
        onMouseLeave={() => onPreview?.(null)}
      >
        <label className="section-cell-label">
          <input
            type="checkbox"
            className="section-cell-checkbox"
            checked={selected}
            disabled={toggleLoading}
            onChange={() => {
              onPreview?.(null)
              onToggle()
            }}
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
            </span>
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
            <span className="section-cell-schedule">{scheduleLabel}</span>
            {overlapNote && <ScheduleConflictNote message={overlapNote} />}
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
        onPreview?.(null)
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
    hasConflict ? 'is-conflict' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li
      className={rowClassName}
      onMouseEnter={() => {
        onPreview?.(selected ? null : section)
      }}
      onMouseLeave={() => onPreview?.(null)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-sm font-medium text-slate-800">{sectionTitle}</p>
        {toggleButton}
      </div>

      <div className="mt-1 min-w-0">
        {section.teacherName ? (
          <TeacherNameButton
            teacherId={section.teacherId}
            teacherName={section.teacherName}
            teacherEmail={section.teacherEmail}
            courseId={section.courseId}
            academicPeriodId={section.academicPeriodId}
            className="block max-w-full truncate text-left text-xs text-slate-500"
          />
        ) : (
          <span className="text-xs text-slate-400">Sin docente</span>
        )}
      </div>

      <p className="mt-1 flex items-center gap-1.5 text-xs font-normal text-slate-500">
        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="truncate">{scheduleLabel}</span>
      </p>

      {overlapNote && <ScheduleConflictNote message={overlapNote} className="mt-1.5" />}
    </li>
  )
}
