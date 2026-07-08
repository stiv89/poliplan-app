/**
 * SectionSearchPanel — Materias laterales (tarjetas estilo Coursicle)
 */
import { useEffect, useMemo, useRef, useState } from 'react'
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
import { ScheduleFilterMenu } from '@/components/schedule/ScheduleFilterPopover'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
import { AnimatedPopover } from '@/components/ui/AnimatedPopover'
import { resolveSectionShift } from '@/utils/sectionCode'
import { getConflictsForSection } from '@/utils/conflicts'
import { buildSectionSearchText, filterAndRankByFuzzySearch } from '@/utils/fuzzySearch'
import { formatScheduleCompact, getCourseSemesterNumber, type SectionCourseInfo } from '@/utils/sectionDisplay'
import { sectionMatchesViewFilters } from '@/utils/scheduleFilters'
import type { AcademicPeriod, Career, CourseSection, ScheduleConflict } from '@/types/academic'
import type { ScheduleViewFilters } from '@/types/scheduleFilters'

const SHIFT_ORDER = ['Mañana', 'Tarde', 'Noche'] as const

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
}: SectionSearchPanelProps) {
  const [search, setSearch] = useState(initialSearch)
  const [shiftFilter, setShiftFilter] = useState<string | null>(null)
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null)

  useEffect(() => {
    setSearch(initialSearch)
  }, [initialSearch])

  useEffect(() => {
    setShiftFilter(null)
    setSemesterFilter(null)
  }, [search, selectedCareerId])

  const hasCareer = Boolean(selectedCareerId)
  const hasSearch = search.trim().length > 0

  const searchMatches = useMemo(() => {
    if (!hasCareer) return []

    return filterAndRankByFuzzySearch(allSections, search, (section) =>
      buildSectionSearchText(section, coursesById.get(section.courseId)),
    )
  }, [allSections, coursesById, hasCareer, search])

  const availableShifts = useMemo(() => {
    const shifts = new Set<string>()
    for (const section of searchMatches) {
      const shift = resolveSectionShift(section)
      if (shift) shifts.add(shift)
    }
    return SHIFT_ORDER.filter((shift) => shifts.has(shift))
  }, [searchMatches])

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

  return (
    <div className="flex h-full flex-col bg-slate-50/60">
      {hasCareer && (
        <div className="shrink-0 border-b border-slate-100 px-3 py-2">
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 hover:bg-slate-100"
                aria-label="Cerrar búsqueda"
              >
                <X className="h-4 w-4 text-muted" />
              </button>
            )}
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Buscar materia…`}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm placeholder-muted focus:border-primary-light focus:outline-none"
                aria-label="Buscar materias o secciones"
              />
            </div>
            {onViewFiltersChange && viewFilters && (
              <ScheduleFilterMenu
                periods={academicPeriods}
                selectedPeriodId={selectedPeriodId}
                onPeriodChange={(periodId) => onPeriodChange?.(periodId)}
                filters={viewFilters}
                onFiltersChange={onViewFiltersChange}
                align="left"
              />
            )}
          </div>

          {availableSemesters.length > 0 && !catalogLoading && (
            <SemesterFilterRow
              availableSemesters={availableSemesters}
              semesterFilter={semesterFilter}
              onSemesterFilterChange={setSemesterFilter}
            />
          )}

          {hasSearch && availableShifts.length > 1 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {availableShifts.length > 1 && (
                <FilterChip
                  label="Todos"
                  active={shiftFilter === null}
                  onClick={() => setShiftFilter(null)}
                />
              )}
              {availableShifts.map((shift) => (
                <FilterChip
                  key={shift}
                  label={shift}
                  active={shiftFilter === shift}
                  onClick={() => setShiftFilter(shift)}
                />
              ))}
            </div>
          )}
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
          <div className="shrink-0 border-b border-slate-100 px-3 py-1.5">
            <p className="text-xs text-muted">
              {catalogLoading
                ? 'Cargando materias…'
                : filteredSections.length === 0
                  ? 'Sin resultados'
                  : `${filteredSections.length} sección${filteredSections.length !== 1 ? 'es' : ''}`}
              {!catalogLoading && search.trim() && ` · "${search}"`}
            </p>
          </div>

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
              filteredSections.map((section) => {
                const course = coursesById.get(section.courseId)
                return (
                  <SectionCard
                    key={section.id}
                    section={section}
                    courseName={course?.name ?? 'Materia'}
                    courseCode={course?.code ?? null}
                    selected={isSectionSelected(section.id)}
                    conflicts={conflicts}
                    toggleLoading={toggleLoading}
                    onToggle={() => onToggle(section)}
                    onPreview={onPreviewSection}
                    previewSectionId={previewSectionId}
                    courseSemester={
                      course ? getCourseSemesterNumber(course) : null
                    }
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

function SemesterFilterRow({
  availableSemesters,
  semesterFilter,
  onSemesterFilterChange,
}: {
  availableSemesters: number[]
  semesterFilter: number | null
  onSemesterFilterChange: (semester: number | null) => void
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

  const semesterLabel =
    semesterFilter != null ? `Semestre: ${semesterFilter}.º` : 'Semestre'

  return (
    <div className="relative mt-1.5 flex items-center gap-1">
      <FilterChip
        label="Todos"
        active={semesterFilter === null}
        onClick={() => onSemesterFilterChange(null)}
      />

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-medium transition ${
          semesterFilter != null
            ? 'bg-primary-light text-white'
            : 'bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50'
        }`}
      >
        <span>{semesterLabel}</span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
        {semesterFilter != null && (
          <span
            onClick={(event) => {
              event.stopPropagation()
              onSemesterFilterChange(null)
            }}
            className="ml-0.5 rounded-full px-0.5 leading-none text-white/90 hover:text-white"
            aria-hidden="true"
          >
            ×
          </span>
        )}
      </button>

      <AnimatedPopover
        open={open}
        anchorRef={buttonRef}
        popoverRef={popoverRef}
        align="left"
        className="w-44 rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg"
      >
        <ul role="listbox" aria-label="Semestres">
          {availableSemesters.map((semester) => (
            <li key={semester}>
              <button
                type="button"
                role="option"
                aria-selected={semesterFilter === semester}
                onClick={() => {
                  onSemesterFilterChange(semester)
                  setOpen(false)
                }}
                className={`flex w-full px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
                  semesterFilter === semester ? 'font-medium text-primary' : 'text-text'
                }`}
              >
                {semester}.º semestre
              </button>
            </li>
          ))}
        </ul>
      </AnimatedPopover>
    </div>
  )
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium transition ${
        active
          ? 'bg-primary-light text-white'
          : 'bg-white text-slate-600 ring-1 ring-slate-200/80 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function SectionCard({
  section,
  courseName,
  courseCode,
  courseSemester,
  selected,
  conflicts,
  toggleLoading,
  onToggle,
  onPreview,
  previewSectionId,
}: {
  section: CourseSection
  courseName: string
  courseCode: string | null
  courseSemester: number | null
  selected: boolean
  conflicts: ScheduleConflict[]
  toggleLoading: boolean
  onToggle: () => void
  onPreview?: (section: CourseSection | null) => void
  previewSectionId?: string | null
}) {
  const sectionConflicts = getConflictsForSection(section.id, conflicts)
  const hasConflict = sectionConflicts.length > 0

  const isPreviewTarget = previewSectionId === section.id
  const shift = resolveSectionShift(section)

  const cardState = isPreviewTarget
    ? 'shadow-[0_6px_20px_rgba(15,23,42,0.1)] ring-2 ring-primary-light/40'
    : 'shadow-[0_1px_3px_rgba(15,23,42,0.06)]'

  return (
    <article
      className={`rounded-xl bg-white px-3.5 py-3 transition-all duration-300 ease-out ${cardState} ${
        selected
          ? 'ring-1 ring-emerald-200/90'
          : hasConflict
            ? 'ring-1 ring-amber-200/80'
            : !isPreviewTarget
              ? 'ring-1 ring-slate-100/90'
              : ''
      }`}
      onMouseEnter={() => {
        if (!selected) onPreview?.(section)
      }}
      onMouseLeave={() => onPreview?.(null)}
    >
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-slate-900">
          {courseName}
          <span className="ml-1.5 text-sm font-normal text-slate-400">{section.sectionCode}</span>
        </h3>
        {courseCode && (
          <p className="mt-0.5 text-xs font-medium text-slate-400">{courseCode}</p>
        )}
      </div>

      {courseSemester && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="inline-flex rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {courseSemester}º semestre
          </span>
          {shift && (
            <span className="inline-flex rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              {shift}
            </span>
          )}
        </div>
      )}

      {!courseSemester && shift && (
        <div className="mt-2">
          <span className="inline-flex rounded-md bg-slate-100/90 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {shift}
          </span>
        </div>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-xs font-normal text-slate-600">
        <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
        <span className="truncate">{formatScheduleCompact(section.meetings)}</span>
      </p>

      <div className="mt-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
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
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
            selected
              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
              : 'bg-primary-light text-white shadow-sm hover:bg-primary-light/90'
          }`}
        >
          {selected && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
          {selected ? 'Agregada' : 'Agregar'}
        </button>
      </div>

      {hasConflict && (
        <p className="mt-2 flex items-center gap-1 text-[11px] font-normal text-amber-700/90">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          Conflicto de horario
        </p>
      )}
    </article>
  )
}
