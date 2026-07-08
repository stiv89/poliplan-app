/**
 * SectionSearchPanel — Materias laterales (tarjetas estilo Coursicle)
 */
import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  AlertTriangle,
  Check,
  X,
  GraduationCap,
  Clock,
  ChevronDown,
} from 'lucide-react'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { CourseFootnoteNotice } from '@/components/schedule/CourseFootnoteNotice'
import { SectionExplorerFilterMenu } from '@/components/schedule/SectionExplorerFilterMenu'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
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
import { sectionMatchesViewFilters } from '@/utils/scheduleFilters'
import type { AcademicPeriod, Career, CourseSection, ScheduleConflict } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'

const SHIFT_ORDER = ['Mañana', 'Tarde', 'Noche'] as const
const GROUP_COLLAPSE_THRESHOLD = 3

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
}

export function SectionSearchPanel({
  careers: _careers,
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
}: SectionSearchPanelProps) {
  const [search, setSearch] = useState(initialSearch)
  const [shiftFilter, setShiftFilter] = useState<string | null>(null)
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setShiftFilter(null)
    setSemesterFilter(null)
  }, [selectedCareerId])

  const hasCareer = Boolean(selectedCareerId)
  const hasSearch = search.trim().length > 0

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

  const browseContextKey = `${selectedCareerId ?? ''}:${semesterFilter ?? 'all'}:${shiftFilter ?? 'all'}`

  useEffect(() => {
    if (hasSearch) return

    const next = new Set<string>()
    for (const group of courseGroups) {
      if (group.sections.length <= 2) {
        next.add(group.groupKey)
      }
    }
    setExpandedGroups(next)
  }, [browseContextKey, hasSearch, courseGroups])

  useEffect(() => {
    if (hasSearch) return

    const selectedIds = new Set(selectedSectionIds)
    setExpandedGroups((current) => {
      const next = new Set(current)
      let changed = false

      for (const group of courseGroups) {
        if (group.sections.some((section) => selectedIds.has(section.id))) {
          if (!next.has(group.groupKey)) {
            next.add(group.groupKey)
            changed = true
          }
        }
      }

      return changed ? next : current
    })
  }, [courseGroups, hasSearch, selectedSectionIds])

  const toggleGroupExpanded = (courseId: string) => {
    setExpandedGroups((current) => {
      const next = new Set(current)
      if (next.has(courseId)) {
        next.delete(courseId)
      } else {
        next.add(courseId)
      }
      return next
    })
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

  const sectionCountLabel = useMemo(() => {
    if (catalogLoading) return 'Cargando materias…'
    if (filteredSections.length === 0) return 'Sin resultados'
    return `${filteredSections.length} sección${filteredSections.length !== 1 ? 'es' : ''}`
  }, [catalogLoading, filteredSections.length])

  function handleClearFilters() {
    if (onViewFiltersChange && viewFilters) {
      clearSectionExplorerFilters(setSemesterFilter, setShiftFilter, onViewFiltersChange)
      return
    }
    setSemesterFilter(null)
    setShiftFilter(null)
  }

  return (
    <div className="flex h-full flex-col bg-slate-50/60">
      {hasCareer && (
        <div className="shrink-0 border-b border-slate-100 px-3 py-2">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            )}
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar materia…"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white py-0 pl-9 pr-3 text-sm placeholder-muted focus:border-primary-light focus:outline-none"
                aria-label="Buscar materias o secciones"
              />
            </div>
            {onViewFiltersChange && viewFilters && (
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
                align="left"
              />
            )}
          </div>

          <div className="mt-1.5 flex min-h-6 items-center gap-2">
            {activeFilterCount === 0 ? (
              <p className="text-xs text-muted">{sectionCountLabel}</p>
            ) : (
              <>
                <div className="-mx-1 flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-0.5">
                  {activeFilterChips.map((chip) => (
                    <ActiveFilterChip key={chip.id} label={chip.label} onRemove={chip.onRemove} />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="shrink-0 text-xs font-medium text-muted transition hover:text-text"
                >
                  Limpiar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {!hasCareer ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="rounded-full bg-primary/8 p-4">
            <GraduationCap className="h-8 w-8 text-primary/70" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-medium text-text">Elegí tu carrera</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Elegí carrera y semestre arriba en el header, o usá los filtros de semestre acá.
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-2 overflow-y-auto px-2.5 py-2.5">
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
            ) : (
              courseGroups.map((group) => {
                const collapsible = !hasSearch && group.sections.length >= GROUP_COLLAPSE_THRESHOLD
                const expanded = expandedGroups.has(group.groupKey)
                const showSections = hasSearch || !collapsible || expanded

                return (
                  <CourseGroupCard
                    key={group.groupKey}
                    group={group}
                    coursesById={coursesById}
                    expanded={showSections}
                    collapsible={collapsible}
                    onToggleExpanded={() => toggleGroupExpanded(group.groupKey)}
                    conflicts={conflicts}
                    isSectionSelected={isSectionSelected}
                    toggleLoading={toggleLoading}
                    onToggle={onToggle}
                    onPreview={onPreviewSection}
                    previewSectionId={previewSectionId}
                  />
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ActiveFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded text-slate-500 transition hover:text-slate-800"
        aria-label={`Quitar filtro ${label}`}
      >
        ×
      </button>
    </span>
  )
}

function getGroupShifts(sections: CourseSection[]): string[] {
  const shifts = new Set<string>()
  for (const section of sections) {
    const shift = resolveSectionShift(section)
    if (shift) shifts.add(shift)
  }
  return SHIFT_ORDER.filter((shift) => shifts.has(shift))
}

function CourseGroupCard({
  group,
  coursesById,
  expanded,
  collapsible,
  onToggleExpanded,
  conflicts,
  isSectionSelected,
  toggleLoading,
  onToggle,
  onPreview,
  previewSectionId,
}: {
  group: ReturnType<typeof groupSectionsByCourse>[number]
  coursesById: Map<string, SectionCourseInfo>
  expanded: boolean
  collapsible: boolean
  onToggleExpanded: () => void
  conflicts: ScheduleConflict[]
  isSectionSelected: (id: string) => boolean
  toggleLoading: boolean
  onToggle: (section: CourseSection) => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
}) {
  const shifts = getGroupShifts(group.sections)
  const selectedCount = group.sections.filter((section) => isSectionSelected(section.id)).length
  const chipClass = expanded
    ? 'inline-flex rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/70'
    : 'inline-flex rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600'

  const headerContent = (
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-slate-900">
          {group.courseDisplayName}
          {group.courseFootnote === 'final_exam_only' && (
            <span className="ml-1 text-sm font-bold text-amber-700" aria-hidden="true">
              *
            </span>
          )}
        </h3>
        {collapsible && (
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        )}
      </div>

      {group.courseCode && (
        <p className="mt-0.5 text-xs font-medium text-slate-400">{group.courseCode}</p>
      )}

      {group.courseFootnote && (
        <div className="mt-2">
          <CourseFootnoteNotice kind={group.courseFootnote} compact />
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {group.courseSemester && (
          <span className={chipClass}>
            {group.courseSemester}º semestre
          </span>
        )}
        <span className={chipClass}>
          {group.sections.length} sección{group.sections.length !== 1 ? 'es' : ''}
        </span>
        {selectedCount > 0 && (
          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
            {selectedCount} en tu horario
          </span>
        )}
        {!expanded &&
          shifts.map((shift) => (
            <span key={shift} className={chipClass}>
              {shift}
            </span>
          ))}
      </div>

      {collapsible && !expanded && (
        <p className="mt-1.5 text-[11px] font-medium text-primary-light/90">
          Tocá para elegir sección
        </p>
      )}
    </div>
  )

  return (
    <article
      className={`overflow-hidden rounded-xl ring-1 shadow-[0_1px_3px_rgba(15,23,42,0.06)] ${
        expanded
          ? 'bg-slate-100/75 ring-slate-200/80'
          : 'bg-white ring-slate-100/90'
      }`}
    >
      {collapsible ? (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className={`flex w-full items-start gap-2 px-3.5 py-3 text-left transition ${
            expanded
              ? 'border-b border-slate-200/70 bg-slate-100/90'
              : 'hover:bg-slate-50/80'
          }`}
        >
          {headerContent}
        </button>
      ) : (
        <div
          className={`flex w-full items-start gap-2 px-3.5 py-3 ${
            expanded ? 'border-b border-slate-200/70 bg-slate-100/90' : ''
          }`}
        >
          {headerContent}
        </div>
      )}

      {expanded && (
        <ul className="space-y-1.5 px-2 py-2">
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
            />
          ))}
        </ul>
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
}) {
  const sectionConflicts = getConflictsForSection(section.id, conflicts)
  const hasConflict = sectionConflicts.length > 0
  const isPreviewTarget = previewSectionId === section.id
  const shift = resolveSectionShift(section)
  const specificName = resolveSectionElectiveName(section, course)
  const sectionLabel = specificName ?? section.sectionCode

  return (
    <li
      className={`rounded-lg border px-2.5 py-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all duration-200 ${
        isPreviewTarget
          ? 'border-primary-light/35 bg-white ring-1 ring-primary-light/25'
          : selected
            ? 'border-emerald-200/90 bg-white'
            : hasConflict
              ? 'border-amber-200/80 bg-white'
              : 'border-slate-200/80 bg-white hover:border-slate-300/80'
      } ${hasConflict ? 'border-l-[3px] border-l-amber-400 pl-2' : ''}`}
      onMouseEnter={() => {
        if (!selected) onPreview?.(section)
      }}
      onMouseLeave={() => onPreview?.(null)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-slate-900">{sectionLabel}</span>
            {specificName && (
              <span className="text-[11px] font-medium text-slate-500">Sec. {section.sectionCode}</span>
            )}
            {shift && (
              <span className="text-[11px] font-medium text-slate-500">{shift}</span>
            )}
          </div>

          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="truncate">{formatScheduleCompact(section.meetings, { isFinalExamOnly })}</span>
          </p>

          <div className="mt-1 min-w-0">
            {section.teacherName ? (
              <TeacherNameButton
                teacherId={section.teacherId}
                teacherName={section.teacherName}
                teacherEmail={section.teacherEmail}
                courseId={section.courseId}
                academicPeriodId={section.academicPeriodId}
                className="block max-w-full truncate text-left text-xs font-normal text-primary-light hover:text-primary"
              />
            ) : (
              <span className="text-xs text-slate-400">Sin docente</span>
            )}
          </div>

          {hasConflict && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-normal text-amber-700/90">
              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
              Conflicto de horario
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          disabled={toggleLoading}
          aria-pressed={selected}
          aria-label={
            selected
              ? `Quitar sección ${section.sectionCode}`
              : `Agregar sección ${section.sectionCode}`
          }
          className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
            selected
              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
              : 'bg-primary-light text-white shadow-sm hover:bg-primary-light/90'
          }`}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
          {selected ? 'Agregada' : 'Agregar'}
        </button>
      </div>
    </li>
  )
}
