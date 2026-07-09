/**
 * SectionsExplorer — Lista compacta de materias y secciones
 */
import { useMemo, useState } from 'react'
import { AlertTriangle, Check, GraduationCap, Search } from 'lucide-react'
import { CompactCareerSelect } from '@/components/schedule/CompactCareerSelect'
import { CourseFootnoteCardNote } from '@/components/schedule/CourseFootnoteNotice'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
import { SectionDetailPanel } from '@/components/sections/SectionDetailPanel'
import {
  DEFAULT_SECTIONS_EXTRA_FILTERS,
  SectionsFilterMenu,
  sectionMatchesViewFilters,
  type SectionsExtraFilters,
} from '@/components/sections/SectionsFilterSheet'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { useAcademicHistory } from '@/hooks/useAcademicHistory'
import type { Career, CourseSection, ScheduleConflict } from '@/types/academic'
import { getCourseProgressLabel } from '@/utils/academicProgressLabels'
import { getCourseFootnote, type CourseFootnoteKind } from '@/utils/courseFootnotes'
import { filterAndRankSections } from '@/utils/fuzzySearch'
import { resolveSectionShift } from '@/utils/sectionCode'
import { DEFAULT_SCHEDULE_VIEW_FILTERS, type ScheduleViewFilters } from '@/types/scheduleFilters'
import {
  formatScheduleCompact,
  getCourseInitial,
  getSectionConflictMessages,
  sectionHasConflicts,
} from '@/utils/sectionDisplay'

interface CourseInfo {
  name: string
  code: string | null
  level: number | null
}

interface SectionsExplorerProps {
  careers: Career[]
  selectedCareerId: string | null
  onCareerChange: (careerId: string | null) => void
  allSections: CourseSection[]
  coursesById: Map<string, CourseInfo>
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  isSectionSelected: (id: string) => boolean
  onToggle: (section: CourseSection) => void
  toggleLoading: boolean
  catalogLoading?: boolean
}

interface CourseGroup {
  courseId: string
  courseName: string
  courseFootnote: CourseFootnoteKind | null
  courseCode: string | null
  sections: CourseSection[]
}

export function SectionsExplorer({
  careers,
  selectedCareerId,
  onCareerChange,
  allSections,
  coursesById,
  selectedSections,
  conflicts,
  isSectionSelected,
  onToggle,
  toggleLoading,
  catalogLoading = false,
}: SectionsExplorerProps) {
  const { curriculum, statuses } = useAcademicHistory()
  const [search, setSearch] = useState('')
  const [viewFilters, setViewFilters] = useState<ScheduleViewFilters>(DEFAULT_SCHEDULE_VIEW_FILTERS)
  const [extraFilters, setExtraFilters] =
    useState<SectionsExtraFilters>(DEFAULT_SECTIONS_EXTRA_FILTERS)
  const [detailSection, setDetailSection] = useState<CourseSection | null>(null)

  const hasCareer = Boolean(selectedCareerId)
  const allSectionsById = useMemo(
    () => new Map(allSections.map((section) => [section.id, section])),
    [allSections],
  )

  const conflictCourseMap = useMemo(
    () => new Map([...coursesById.entries()].map(([id, course]) => [id, { name: course.name }])),
    [coursesById],
  )

  const filteredSections = useMemo(() => {
    if (!hasCareer) return []

    const query = search.trim()
    const searchResults = filterAndRankSections(allSections, query, coursesById)

    return searchResults
      .filter((section) => {
        if (extraFilters.shift && resolveSectionShift(section) !== extraFilters.shift) return false
        if (!sectionMatchesViewFilters(section, viewFilters)) return false

        if (extraFilters.teacherQuery.trim()) {
          const teacher = section.teacherName?.toLowerCase() ?? ''
          if (!teacher.includes(extraFilters.teacherQuery.trim().toLowerCase())) return false
        }

        const selected = isSectionSelected(section.id)
        if (extraFilters.onlyUnselected && selected) return false

        if (extraFilters.hideConflicting) {
          const hasConflict = sectionHasConflicts(
            section,
            selected,
            selectedSections,
            conflicts,
            conflictCourseMap,
            allSectionsById,
          )
          if (hasConflict) return false
        }

        return true
      })
      .sort((a, b) => {
        if (query) return 0
        const aCourse = coursesById.get(a.courseId)?.name ?? ''
        const bCourse = coursesById.get(b.courseId)?.name ?? ''
        return aCourse.localeCompare(bCourse) || a.sectionCode.localeCompare(b.sectionCode)
      })
  }, [
    allSections,
    allSectionsById,
    conflictCourseMap,
    conflicts,
    coursesById,
    extraFilters,
    hasCareer,
    isSectionSelected,
    search,
    selectedSections,
    viewFilters,
  ])

  const groupedSections = useMemo(() => {
    const map = new Map<string, CourseGroup>()
    for (const section of filteredSections) {
      const course = coursesById.get(section.courseId)
      const footnote = getCourseFootnote(course?.name ?? 'Materia')
      const existing = map.get(section.courseId)
      if (existing) {
        existing.sections.push(section)
      } else {
        map.set(section.courseId, {
          courseId: section.courseId,
          courseName: footnote.displayName,
          courseFootnote: footnote.kind,
          courseCode: course?.code ?? null,
          sections: [section],
        })
      }
    }
    return [...map.values()]
  }, [filteredSections, coursesById])

  const detailCourse = detailSection ? coursesById.get(detailSection.courseId) : null
  const detailProgressLabel =
    detailCourse && curriculum
      ? getCourseProgressLabel(detailCourse.name, curriculum, statuses)
      : null
  const siblingSections = detailSection
    ? allSections.filter((section) => section.courseId === detailSection.courseId)
    : []

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <header className="shrink-0 border-b border-slate-200/50 bg-white px-4 py-4 md:px-8">
        <h1 className="text-xl font-bold tracking-tight text-text md:text-2xl">Secciones</h1>

        {hasCareer && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar materia o docente…"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-light"
                aria-label="Buscar materia o docente"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <CompactCareerSelect
                careers={careers}
                selectedCareerId={selectedCareerId}
                onCareerChange={onCareerChange}
              />
              <SectionsFilterMenu
                viewFilters={viewFilters}
                extraFilters={extraFilters}
                onViewFiltersChange={setViewFilters}
                onExtraFiltersChange={setExtraFilters}
              />
            </div>
          </div>
        )}

        {hasCareer && (
          <p className="mt-2 text-xs text-muted">
            {catalogLoading
              ? 'Cargando materias…'
              : filteredSections.length === 0
                ? 'Sin resultados'
                : `${filteredSections.length} sección${filteredSections.length !== 1 ? 'es' : ''} disponible${filteredSections.length !== 1 ? 's' : ''}`}
          </p>
        )}
      </header>

      {!hasCareer ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
          <div className="rounded-full bg-primary/8 p-4">
            <GraduationCap className="h-8 w-8 text-primary/70" aria-hidden="true" />
          </div>
          <p className="mt-4 text-sm font-medium text-text">Elegí tu carrera</p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted">
            Seleccioná una carrera arriba para ver las materias y secciones disponibles.
          </p>
          <div className="mt-4">
            <CompactCareerSelect
              careers={careers}
              selectedCareerId={selectedCareerId}
              onCareerChange={onCareerChange}
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {catalogLoading ? (
              <div className="px-4 py-4 md:px-8">
                <SectionListSkeleton count={8} />
              </div>
            ) : groupedSections.length === 0 ? (
              <p className="px-4 py-12 text-center text-sm text-muted md:px-8">
                {allSections.length === 0
                  ? 'No hay materias cargadas para esta carrera.'
                  : 'No se encontraron secciones con estos filtros.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {groupedSections.map((group) => (
                  <CourseGroupBlock
                    key={group.courseId}
                    group={group}
                    selectedSections={selectedSections}
                    conflicts={conflicts}
                    conflictCourseMap={conflictCourseMap}
                    allSectionsById={allSectionsById}
                    isSectionSelected={isSectionSelected}
                    toggleLoading={toggleLoading}
                    onToggle={onToggle}
                    onOpenDetail={setDetailSection}
                    compactHeader={group.sections.length > 1}
                  />
                ))}
              </div>
            )}
          </div>

          {detailSection && detailCourse && (
            <aside className="hidden w-[min(360px,34vw)] shrink-0 border-l border-slate-100 bg-surface md:flex md:flex-col">
              <SectionDetailPanel
                section={detailSection}
                courseName={detailCourse.name}
                courseCode={detailCourse.code}
                selected={isSectionSelected(detailSection.id)}
                conflicts={conflicts}
                selectedSections={selectedSections}
                siblingSections={siblingSections}
                coursesById={conflictCourseMap}
                allSectionsById={allSectionsById}
                toggleLoading={toggleLoading}
                onToggle={() => onToggle(detailSection)}
                onSelectSibling={setDetailSection}
                onClose={() => setDetailSection(null)}
                progressLabel={detailProgressLabel}
              />
            </aside>
          )}
        </div>
      )}

      {detailSection && detailCourse && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={() => setDetailSection(null)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-slate-200 bg-surface shadow-2xl md:hidden"
            role="dialog"
            aria-label="Detalle de sección"
          >
            <SectionDetailPanel
              section={detailSection}
              courseName={detailCourse.name}
              courseCode={detailCourse.code}
              selected={isSectionSelected(detailSection.id)}
              conflicts={conflicts}
              selectedSections={selectedSections}
              siblingSections={siblingSections}
              coursesById={conflictCourseMap}
              allSectionsById={allSectionsById}
              toggleLoading={toggleLoading}
              onToggle={() => onToggle(detailSection)}
              onSelectSibling={setDetailSection}
              onClose={() => setDetailSection(null)}
              progressLabel={detailProgressLabel}
            />
          </div>
        </>
      )}
    </div>
  )
}

function CourseGroupBlock({
  group,
  selectedSections,
  conflicts,
  conflictCourseMap,
  allSectionsById,
  isSectionSelected,
  toggleLoading,
  onToggle,
  onOpenDetail,
  compactHeader,
}: {
  group: CourseGroup
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  conflictCourseMap: Map<string, { name: string }>
  allSectionsById: Map<string, CourseSection>
  isSectionSelected: (id: string) => boolean
  toggleLoading: boolean
  onToggle: (section: CourseSection) => void
  onOpenDetail: (section: CourseSection) => void
  compactHeader: boolean
}) {
  const initial = getCourseInitial(group.courseName, group.courseCode)

  return (
    <section className="px-4 py-1 md:px-8">
      {compactHeader ? (
        <div className="flex items-baseline justify-between gap-2 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">
              {group.courseName}
              {group.courseFootnote === 'final_exam_only' && (
                <span className="ml-1 font-bold text-amber-700" aria-hidden="true">
                  *
                </span>
              )}
            </p>
            {group.courseFootnote && (
              <div className="mt-1">
                <CourseFootnoteCardNote kind={group.courseFootnote} />
              </div>
            )}
            {group.courseCode && (
              <p className="text-xs text-muted">{group.courseCode}</p>
            )}
          </div>
          <p className="shrink-0 text-xs text-muted">
            {group.sections.length} sección{group.sections.length !== 1 ? 'es' : ''}
          </p>
        </div>
      ) : null}

      <ul className={compactHeader ? 'border-t border-slate-50' : ''}>
        {group.sections.map((section) => (
          <SectionCompactRow
            key={section.id}
            section={section}
            courseName={group.courseName}
            courseFootnote={group.courseFootnote}
            courseCode={group.courseCode}
            courseInitial={initial}
            showCourseName={!compactHeader}
            selected={isSectionSelected(section.id)}
            selectedSections={selectedSections}
            conflicts={conflicts}
            conflictCourseMap={conflictCourseMap}
            allSectionsById={allSectionsById}
            toggleLoading={toggleLoading}
            onToggle={() => onToggle(section)}
            onOpenDetail={() => onOpenDetail(section)}
          />
        ))}
      </ul>
    </section>
  )
}

function SectionCompactRow({
  section,
  courseName,
  courseFootnote,
  courseCode,
  courseInitial,
  showCourseName,
  selected,
  selectedSections,
  conflicts,
  conflictCourseMap,
  allSectionsById,
  toggleLoading,
  onToggle,
  onOpenDetail,
}: {
  section: CourseSection
  courseName: string
  courseFootnote: CourseFootnoteKind | null
  courseCode: string | null
  courseInitial: string
  showCourseName: boolean
  selected: boolean
  selectedSections: CourseSection[]
  conflicts: ScheduleConflict[]
  conflictCourseMap: Map<string, { name: string }>
  allSectionsById: Map<string, CourseSection>
  toggleLoading: boolean
  onToggle: () => void
  onOpenDetail: () => void
}) {
  const schedule = formatScheduleCompact(section.meetings, {
    isFinalExamOnly: courseFootnote === 'final_exam_only',
  })
  const conflictMessages = getSectionConflictMessages(
    section,
    selected,
    selectedSections,
    conflicts,
    conflictCourseMap,
    allSectionsById,
  )
  const hasConflict = conflictMessages.length > 0

  return (
    <li>
      <div
        className={`group flex items-start gap-3 border-b border-slate-50 py-3 last:border-b-0 ${
          hasConflict ? 'border-l-2 border-l-amber-400 pl-2' : ''
        }`}
      >
        <button
          type="button"
          onClick={onOpenDetail}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-600"
            aria-hidden="true"
          >
            {courseInitial}
          </span>

          <span className="min-w-0 flex-1">
            {showCourseName && (
              <>
                <span className="block truncate text-sm font-semibold text-text">
                  {courseName}
                  {courseFootnote === 'final_exam_only' && (
                    <span className="ml-1 font-bold text-amber-700" aria-hidden="true">
                      *
                    </span>
                  )}
                </span>
                {courseFootnote && (
                  <span className="mt-1 block">
                    <CourseFootnoteCardNote kind={courseFootnote} />
                  </span>
                )}
              </>
            )}
            {!showCourseName && (
              <span className="block text-sm font-medium text-text">
                Sección {section.sectionCode}
                {courseCode && <span className="font-normal text-muted"> · {courseCode}</span>}
              </span>
            )}

            <span className="mt-0.5 block truncate text-xs text-muted">
              {section.teacherName ? (
                <TeacherNameButton
                  teacherId={section.teacherId}
                  teacherName={section.teacherName}
                  teacherEmail={section.teacherEmail}
                  courseId={section.courseId}
                  academicPeriodId={section.academicPeriodId}
                  className="text-primary hover:underline"
                />
              ) : (
                'Sin docente'
              )}
            </span>

            <span className="mt-1 block text-xs text-slate-600">
              {showCourseName ? (
                <>
                  {schedule}
                  <span className="text-muted"> · Sección {section.sectionCode}</span>
                </>
              ) : (
                <>
                  <span className="font-medium">{section.sectionCode}</span>
                  <span className="text-muted"> · </span>
                  {schedule}
                  {section.teacherName && (
                    <>
                      <span className="text-muted"> · </span>
                      {section.teacherName}
                    </>
                  )}
                </>
              )}
            </span>

            {hasConflict && (
              <span className="mt-1 flex items-center gap-1 text-[11px] text-amber-700">
                <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                {conflictMessages[0]}
              </span>
            )}
          </span>
        </button>

        <SectionActionButton
          selected={selected}
          toggleLoading={toggleLoading}
          sectionCode={section.sectionCode}
          onToggle={onToggle}
        />
      </div>
    </li>
  )
}

function SectionActionButton({
  selected,
  toggleLoading,
  sectionCode,
  onToggle,
}: {
  selected: boolean
  toggleLoading: boolean
  sectionCode: string
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onToggle()
      }}
      disabled={toggleLoading}
      aria-pressed={selected}
      aria-label={
        selected ? `Quitar sección ${sectionCode}` : `Agregar sección ${sectionCode}`
      }
      className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
        selected
          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'bg-primary text-white hover:bg-primary/90'
      }`}
    >
      {selected && <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />}
      {selected ? 'Agregada' : 'Agregar'}
    </button>
  )
}
