/**
 * SectionsExplorer — Materias del horario y sus secciones
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, Search } from 'lucide-react'
import sectionsEmptyIllustration from '../../../logos/empty.png'
import { CourseFootnoteCardNote } from '@/components/schedule/CourseFootnoteNotice'
import { LandingDoodleBackground } from '@/components/public/LandingDoodleBackground'
import { SectionListSkeleton } from '@/components/schedule/SectionListSkeleton'
import { SectionDetailPanel } from '@/components/sections/SectionDetailPanel'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { TeacherNameButton } from '@/components/teachers/TeacherNameButton'
import { ROUTES } from '@/config/constants'
import { useAcademicHistory } from '@/hooks/useAcademicHistory'
import type { Career, CourseSection, ScheduleConflict } from '@/types/academic'
import { getCourseProgressLabel } from '@/utils/academicProgressLabels'
import { getCourseFootnote, type CourseFootnoteKind } from '@/utils/courseFootnotes'
import { filterAndRankSections } from '@/utils/fuzzySearch'
import {
  formatScheduleCompact,
  getCourseInitial,
  getSectionConflictMessages,
} from '@/utils/sectionDisplay'

interface CourseInfo {
  name: string
  code: string | null
  level: number | null
  careerId: string
}

interface SectionsExplorerProps {
  careers: Career[]
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
  careerLabel: string | null
  sections: CourseSection[]
}

export function SectionsExplorer({
  careers,
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
  const [detailSection, setDetailSection] = useState<CourseSection | null>(null)

  const careerLabelsById = useMemo(
    () =>
      new Map(
        careers.map((career) => [career.id, career.code?.trim() || career.name]),
      ),
    [careers],
  )

  const hasScheduleCourses = selectedSections.length > 0

  const allSectionsById = useMemo(
    () => new Map(allSections.map((section) => [section.id, section])),
    [allSections],
  )

  const conflictCourseMap = useMemo(
    () => new Map([...coursesById.entries()].map(([id, course]) => [id, { name: course.name }])),
    [coursesById],
  )

  const filteredSections = useMemo(() => {
    if (!hasScheduleCourses) return []

    const query = search.trim()
    const searchResults = filterAndRankSections(selectedSections, query, coursesById)

    return searchResults.sort((a, b) => {
      if (query) return 0
      const aCourse = coursesById.get(a.courseId)?.name ?? ''
      const bCourse = coursesById.get(b.courseId)?.name ?? ''
      return aCourse.localeCompare(bCourse) || a.sectionCode.localeCompare(b.sectionCode)
    })
  }, [selectedSections, coursesById, hasScheduleCourses, search])

  const groupedSections = useMemo(() => {
    const map = new Map<string, CourseGroup>()
    for (const section of filteredSections) {
      const course = coursesById.get(section.courseId)
      const footnote = getCourseFootnote(course?.name ?? 'Materia')
      const careerLabel = course?.careerId
        ? (careerLabelsById.get(course.careerId) ?? null)
        : null
      const existing = map.get(section.courseId)
      if (existing) {
        existing.sections.push(section)
      } else {
        map.set(section.courseId, {
          courseId: section.courseId,
          courseName: footnote.displayName,
          courseFootnote: footnote.kind,
          courseCode: course?.code ?? null,
          careerLabel,
          sections: [section],
        })
      }
    }
    return [...map.values()]
  }, [filteredSections, coursesById, careerLabelsById])

  const detailCourse = detailSection ? coursesById.get(detailSection.courseId) : null
  const detailProgressLabel =
    detailCourse && curriculum
      ? getCourseProgressLabel(detailCourse.name, curriculum, statuses)
      : null
  const siblingSections = detailSection
    ? selectedSections.filter((section) => section.courseId === detailSection.courseId)
    : []

  const countLabel = catalogLoading
    ? 'Cargando materias…'
    : !hasScheduleCourses
      ? 'Sin materias en tu horario'
      : filteredSections.length === 0
        ? 'Sin resultados'
        : `${groupedSections.length} materia${groupedSections.length !== 1 ? 's' : ''} · ${filteredSections.length} sección${filteredSections.length !== 1 ? 'es' : ''}`

  return (
    <div className="sections-explorer-surface relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <LandingDoodleBackground className="opacity-70 dark:opacity-45" />

      <header className="relative z-10 shrink-0 border-b border-slate-200/40 bg-surface/80 px-4 py-2 backdrop-blur-md md:px-6 dark:border-[var(--app-border-subtle)] dark:bg-[color-mix(in_srgb,var(--app-surface)_82%,transparent)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h1 className="text-base font-bold tracking-tight text-text md:text-lg">Secciones</h1>
            <span className="text-xs text-muted">{countLabel}</span>
          </div>
        </div>

        {hasScheduleCourses && (
          <div className="relative mt-1.5 min-w-0">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar materia o docente…"
              className="w-full rounded-lg border border-slate-200 bg-surface py-1.5 pl-9 pr-3 text-sm outline-none focus:border-primary-light dark:border-[var(--app-border-subtle)]"
              aria-label="Buscar materia o docente"
            />
          </div>
        )}
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-4 py-3 md:px-6 md:py-4 ${
            !hasScheduleCourses ? 'flex items-center justify-center' : ''
          }`}
        >
          {!hasScheduleCourses ? (
            <SectionsEmptyState />
          ) : catalogLoading ? (
            <div className="max-w-3xl">
              <SectionListSkeleton count={8} />
            </div>
          ) : groupedSections.length === 0 ? (
            <p className="max-w-3xl py-12 text-left text-sm text-muted">
              No se encontraron secciones.
            </p>
          ) : (
            <div className="max-w-3xl overflow-hidden rounded-2xl border border-slate-200/60 bg-surface/90 backdrop-blur-sm dark:border-[var(--app-border-subtle)] dark:bg-[color-mix(in_srgb,var(--app-surface)_88%,transparent)]">
              <div className="divide-y divide-slate-100 dark:divide-[var(--app-border-subtle)]">
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
            </div>
          )}
        </div>

        {detailSection && detailCourse && (
          <aside className="relative z-10 hidden w-[min(360px,34vw)] shrink-0 border-l border-slate-200/40 bg-surface/85 backdrop-blur-md md:flex md:flex-col dark:border-[var(--app-border-subtle)] dark:bg-[color-mix(in_srgb,var(--app-surface)_85%,transparent)]">
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

      <BottomSheet
        open={detailSection != null && detailCourse != null}
        onClose={() => setDetailSection(null)}
        ariaLabel="Detalle de sección"
        bare
        showHandle
        mobileOnly
        maxHeight="92dvh"
      >
        {detailSection && detailCourse ? (
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
        ) : null}
      </BottomSheet>
    </div>
  )
}

function CareerPill({ label }: { label: string }) {
  return (
    <span className="inline-flex shrink-0 rounded-full border border-slate-200/80 bg-slate-100/90 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-600">
      {label}
    </span>
  )
}

function SectionsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center md:px-8">
      <img
        src={sectionsEmptyIllustration}
        alt="Ilustración de materias y secciones"
        width={480}
        height={480}
        className="mb-6 h-auto max-h-[220px] w-[clamp(180px,42vw,240px)] object-contain opacity-90 dark:opacity-75 dark:brightness-[0.92]"
        draggable={false}
      />
      <h2 className="text-base font-semibold tracking-tight text-text md:text-lg">
        Agregá materias a tu horario
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Acá vas a ver las secciones que ya sumaste a tu horario.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium !text-white transition hover:bg-primary/90 hover:!text-white"
      >
        Ir al horario
      </Link>
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
    <section className="px-4 py-1 md:px-6">
      {compactHeader ? (
        <div className="flex items-baseline justify-between gap-2 py-2.5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate text-sm font-semibold text-text">
                {group.courseName}
                {group.courseFootnote === 'final_exam_only' && (
                  <span className="ml-1 font-bold text-amber-700" aria-hidden="true">
                    *
                  </span>
                )}
              </p>
              {group.careerLabel && <CareerPill label={group.careerLabel} />}
            </div>
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
            careerLabel={group.careerLabel}
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
  careerLabel,
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
  careerLabel: string | null
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
    <li className="section-explorer-row">
      <div className="group flex items-start gap-3 border-b border-slate-50 py-3 last:border-b-0 dark:border-[var(--app-border-subtle)]">
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
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-text">
                    {courseName}
                    {courseFootnote === 'final_exam_only' && (
                      <span className="ml-1 font-bold text-amber-700" aria-hidden="true">
                        *
                      </span>
                    )}
                  </span>
                  {hasConflict && conflictMessages[0] && (
                    <span title={conflictMessages[0]}>
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0 text-[rgba(161,112,48,0.72)] dark:text-[rgba(214,180,120,0.75)]"
                        aria-label={conflictMessages[0]}
                      />
                    </span>
                  )}
                  {careerLabel && <CareerPill label={careerLabel} />}
                </span>
                {courseFootnote && (
                  <span className="mt-1 block">
                    <CourseFootnoteCardNote kind={courseFootnote} />
                  </span>
                )}
              </>
            )}
            {!showCourseName && (
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium text-text">
                  Sección {section.sectionCode}
                  {courseCode && <span className="font-normal text-muted"> · {courseCode}</span>}
                </span>
                {hasConflict && conflictMessages[0] && (
                  <span title={conflictMessages[0]}>
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0 text-[rgba(161,112,48,0.72)] dark:text-[rgba(214,180,120,0.75)]"
                      aria-label={conflictMessages[0]}
                    />
                  </span>
                )}
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
      {selected ? (
        <>
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {sectionCode}
        </>
      ) : (
        'Agregar'
      )}
    </button>
  )
}
