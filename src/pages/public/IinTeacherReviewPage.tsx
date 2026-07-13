import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Search,
  Star,
  X,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { TeacherPersonAvatar } from '@/components/teachers/TeacherPersonAvatar'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'
import { SeoHead } from '@/components/seo/SeoHead'
import { ROUTES } from '@/config/constants'
import { CANONICAL_ORIGIN, PUBLIC_PAGE_SEO, PUBLIC_ROUTES } from '@/config/seo'
import { resolveTeacherId, submitPublicTeacherReview } from '@/services/teacherReviewService'
import { getAnonymousReviewClientId } from '@/utils/anonymousReviewClient'
import {
  BASIC_COURSE_GROUPS,
  ELECTIVE_TOPIC_GROUPS,
  type CourseBucket,
  type IinTeacher,
  type WizardStep,
  findTeacherByParam,
  getCourseBucket,
  getElectiveTopic,
  getPopularTeachers,
  groupTeacherCourses,
  inferTeacherGender,
  primaryCourseLabel,
  searchTeachers,
  shortTeacherName,
  teacherKey,
  teachersForCoursePattern,
  uniqueCoursesForTeacher,
  allIinTeachers,
} from '@/utils/iinTeacherReviewWizard'
import {
  PRIMARY_REVIEW_DIMENSION_IDS,
  REVIEW_DIMENSIONS,
  SECONDARY_REVIEW_DIMENSION_IDS,
  averageDimensionRating,
  buildStructuredReviewBody,
  defaultDimensionRatings,
  type ReviewDimensionId,
  type ReviewDimensionRatings,
} from '@/utils/teacher'

const meta = PUBLIC_PAGE_SEO[PUBLIC_ROUTES.reviewsIin]
const PENDING_REVIEW_KEY = 'poliplan:pending-teacher-review'

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'teacher', label: 'Docente' },
  { id: 'course', label: 'Materia' },
  { id: 'review', label: 'Reseña' },
]

type FilterPanel = 'materia' | 'area' | null

export function IinTeacherReviewPage() {
  const { isConfigured } = useAuth()

  const [step, setStep] = useState<WizardStep>('teacher')
  const [query, setQuery] = useState('')
  const [materiaFilter, setMateriaFilter] = useState<string | null>(null)
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [selectedKey, setSelectedKey] = useState('')
  const [course, setCourse] = useState('')
  const [dimensions, setDimensions] = useState<ReviewDimensionRatings>(defaultDimensionRatings())
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const selectedTeacher = useMemo(
    () => allIinTeachers().find((teacher) => teacherKey(teacher) === selectedKey) ?? null,
    [selectedKey],
  )

  const popularTeachers = useMemo(() => getPopularTeachers(4), [])
  const searchResults = useMemo(() => searchTeachers(query), [query])

  const filteredTeachers = useMemo(() => {
    if (!materiaFilter && !areaFilter) return []
    let teachers = allIinTeachers()
    if (materiaFilter) {
      const group = BASIC_COURSE_GROUPS.find((item) => item.id === materiaFilter)
      if (group) teachers = teachersForCoursePattern(group.patterns)
    }
    if (areaFilter) {
      const group = ELECTIVE_TOPIC_GROUPS.find((item) => item.id === areaFilter)
      if (group) {
        const areaTeachers = new Set(
          teachersForCoursePattern(group.patterns).map((teacher) => teacherKey(teacher)),
        )
        teachers = teachers.filter((teacher) => areaTeachers.has(teacherKey(teacher)))
      }
    }
    return teachers.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  }, [materiaFilter, areaFilter])

  const groupedCourses = useMemo(
    () => (selectedTeacher ? groupTeacherCourses(selectedTeacher.courses) : null),
    [selectedTeacher],
  )

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const email = params.get('email')
    const name = params.get('name') ?? params.get('profe')
    const match = findTeacherByParam(email, name)
    if (match) {
      setSelectedKey(teacherKey(match))
      setStep('course')
    }
  }, [])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_REVIEW_KEY)
      if (!raw) return
      const pending = JSON.parse(raw) as {
        step?: WizardStep
        selectedKey?: string
        course?: string
        dimensions?: ReviewDimensionRatings
        comment?: string
      }
      if (pending.selectedKey) setSelectedKey(pending.selectedKey)
      if (pending.course) setCourse(pending.course)
      if (pending.dimensions) setDimensions(pending.dimensions)
      if (pending.comment) setComment(pending.comment)
      if (pending.step && pending.step !== 'done') setStep(pending.step)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!selectedTeacher) {
      setCourse('')
      return
    }
    const courses = uniqueCoursesForTeacher(selectedTeacher)
    if (!course || !courses.includes(course)) {
      setCourse(courses[0] ?? '')
    }
  }, [selectedTeacher, course])

  const shareUrl = useMemo(() => {
    if (!selectedTeacher?.email) return `${CANONICAL_ORIGIN}${PUBLIC_ROUTES.reviewsIin}`
    const params = new URLSearchParams({ email: selectedTeacher.email })
    return `${CANONICAL_ORIGIN}${PUBLIC_ROUTES.reviewsIin}?${params.toString()}`
  }, [selectedTeacher])

  const clearPendingReview = () => {
    sessionStorage.removeItem(PENDING_REVIEW_KEY)
  }

  const selectTeacher = (teacher: IinTeacher) => {
    setSelectedKey(teacherKey(teacher))
    setSubmitError(null)
    setStep('course')
  }

  const handleSubmit = async () => {
    if (!selectedTeacher) return
    if (!isConfigured) {
      setSubmitError('Conectate a internet para publicar la reseña.')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const teacherId = await resolveTeacherId({
        teacherName: selectedTeacher.name,
        teacherEmail: selectedTeacher.email,
      })
      if (!teacherId) throw new Error('No encontramos este docente en PoliPlan.')

      const trimmedComment = comment.trim()
      const reviewComment = trimmedComment
        ? course
          ? `${trimmedComment}\n\nMateria: ${course}`
          : trimmedComment
        : course
          ? `Materia: ${course}`
          : ''
      const body = buildStructuredReviewBody(dimensions, reviewComment)
      const rating = averageDimensionRating(dimensions)

      await submitPublicTeacherReview({
        teacherId,
        body,
        rating,
        clientToken: getAnonymousReviewClientId(),
      })

      clearPendingReview()
      setStep('done')
      setComment('')
      setDimensions(defaultDimensionRatings())
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo publicar la reseña.'
      if (message.includes('duplicate') || message.includes('unique')) {
        setSubmitError('Ya publicaste una reseña para este docente desde este dispositivo.')
      } else {
        setSubmitError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const resetWizard = () => {
    setStep('teacher')
    setQuery('')
    setMateriaFilter(null)
    setAreaFilter(null)
    setSelectedKey('')
    setCourse('')
    setSubmitError(null)
    setDimensions(defaultDimensionRatings())
    setComment('')
  }

  const currentStepIndex = step === 'done' ? STEPS.length : STEPS.findIndex((item) => item.id === step)

  return (
    <>
      <SeoHead meta={meta} />
      <article className="mx-auto max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wide text-[#0B3B8F]">
          Ingeniería Informática · FP-UNA
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{meta.h1}</h1>

        {step !== 'done' && <WizardProgress currentIndex={currentStepIndex} />}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {step === 'teacher' && (
            <TeacherStep
              query={query}
              onQueryChange={setQuery}
              popularTeachers={popularTeachers}
              searchResults={searchResults}
              filteredTeachers={filteredTeachers}
              materiaFilter={materiaFilter}
              areaFilter={areaFilter}
              onMateriaFilterChange={setMateriaFilter}
              onAreaFilterChange={setAreaFilter}
              onSelectTeacher={selectTeacher}
            />
          )}

          {step === 'course' && selectedTeacher && groupedCourses && (
            <CourseStep
              teacher={selectedTeacher}
              groupedCourses={groupedCourses}
              course={course}
              onCourseChange={setCourse}
              onBack={() => setStep('teacher')}
              onContinue={() => setStep('review')}
            />
          )}

          {step === 'review' && selectedTeacher && (
            <ReviewStep
              teacher={selectedTeacher}
              course={course}
              dimensions={dimensions}
              comment={comment}
              submitting={submitting}
              submitError={submitError}
              onDimensionChange={(id, value) =>
                setDimensions((current) => ({ ...current, [id]: value }))
              }
              onCommentChange={setComment}
              onBack={() => setStep('course')}
              onSubmit={() => void handleSubmit()}
            />
          )}

          {step === 'done' && selectedTeacher && (
            <DoneStep
              teacher={selectedTeacher}
              course={course}
              copied={copied}
              onCopyLink={() => void handleCopyLink()}
              onAnother={resetWizard}
            />
          )}
        </div>

        {step === 'teacher' && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Compartí este formulario:{' '}
            <a href={PUBLIC_ROUTES.reviewsIin} className="text-[#0B3B8F]/80 hover:underline">
              {CANONICAL_ORIGIN}
              {PUBLIC_ROUTES.reviewsIin}
            </a>
          </p>
        )}

        <div className="mt-8">
          <LegalDisclaimer compact />
        </div>
      </article>
    </>
  )
}

function WizardProgress({ currentIndex }: { currentIndex: number }) {
  return (
    <ol className="mt-6 flex items-center gap-2">
      {STEPS.map((item, index) => {
        const active = index === currentIndex
        const done = index < currentIndex
        return (
          <li key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? 'bg-emerald-100 text-emerald-700'
                  : active
                    ? 'bg-[#0B3B8F] text-white'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span
              className={`truncate text-xs font-medium ${
                active ? 'text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden h-px flex-1 bg-slate-200 sm:block" aria-hidden="true" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function TeacherStep({
  query,
  onQueryChange,
  popularTeachers,
  searchResults,
  filteredTeachers,
  materiaFilter,
  areaFilter,
  onMateriaFilterChange,
  onAreaFilterChange,
  onSelectTeacher,
}: {
  query: string
  onQueryChange: (value: string) => void
  popularTeachers: IinTeacher[]
  searchResults: IinTeacher[]
  filteredTeachers: IinTeacher[]
  materiaFilter: string | null
  areaFilter: string | null
  onMateriaFilterChange: (id: string | null) => void
  onAreaFilterChange: (id: string | null) => void
  onSelectTeacher: (teacher: IinTeacher) => void
}) {
  const [openPanel, setOpenPanel] = useState<FilterPanel>(null)
  const [showAllTeachers, setShowAllTeachers] = useState(false)
  const filtersRef = useRef<HTMLDivElement>(null)

  const trimmedQuery = query.trim()
  const isSearching = trimmedQuery.length > 0
  const hasFilters = materiaFilter !== null || areaFilter !== null

  const allTeachersSorted = useMemo(
    () => [...allIinTeachers()].sort((a, b) => a.name.localeCompare(b.name, 'es')),
    [],
  )

  const teachers = isSearching
    ? searchResults
    : hasFilters
      ? filteredTeachers
      : showAllTeachers
        ? allTeachersSorted
        : popularTeachers

  const materiaLabel = BASIC_COURSE_GROUPS.find((group) => group.id === materiaFilter)?.label
  const areaLabel = ELECTIVE_TOPIC_GROUPS.find((group) => group.id === areaFilter)?.label

  useEffect(() => {
    if (!openPanel) return
    const onPointerDown = (event: MouseEvent) => {
      if (filtersRef.current?.contains(event.target as Node)) return
      setOpenPanel(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [openPanel])

  const handleQueryChange = (value: string) => {
    onQueryChange(value)
    if (value.trim()) setShowAllTeachers(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">¿A quién querés reseñar?</h2>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder="Buscar docente o materia…"
          className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#0B3B8F]/40 focus:ring-2 focus:ring-[#0B3B8F]/10"
          autoComplete="off"
          aria-controls="teacher-search-results"
        />
      </div>

      {!isSearching && (
        <div ref={filtersRef} className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <FilterMenuButton
              label="Filtrar por materia"
              active={openPanel === 'materia' || materiaFilter !== null}
              onClick={() => setOpenPanel((current) => (current === 'materia' ? null : 'materia'))}
            />
            <FilterMenuButton
              label="Filtrar por área"
              active={openPanel === 'area' || areaFilter !== null}
              onClick={() => setOpenPanel((current) => (current === 'area' ? null : 'area'))}
            />
          </div>

          {(materiaFilter || areaFilter) && (
            <div className="flex flex-wrap gap-2">
              {materiaLabel && (
                <ActiveFilterTag label={`Materia: ${materiaLabel}`} onClear={() => onMateriaFilterChange(null)} />
              )}
              {areaLabel && (
                <ActiveFilterTag label={`Área: ${areaLabel}`} onClear={() => onAreaFilterChange(null)} />
              )}
            </div>
          )}

          {openPanel === 'materia' && (
            <FilterPanel
              options={BASIC_COURSE_GROUPS}
              selectedId={materiaFilter}
              onSelect={(id) => {
                onMateriaFilterChange(id)
                setOpenPanel(null)
                setShowAllTeachers(false)
              }}
            />
          )}
          {openPanel === 'area' && (
            <FilterPanel
              options={ELECTIVE_TOPIC_GROUPS}
              selectedId={areaFilter}
              onSelect={(id) => {
                onAreaFilterChange(id)
                setOpenPanel(null)
                setShowAllTeachers(false)
              }}
            />
          )}
        </div>
      )}

      <div id="teacher-search-results" className="space-y-3">
        {!isSearching && !hasFilters && !showAllTeachers && (
          <p className="text-xs font-medium text-slate-400">Docentes populares</p>
        )}

        {teachers.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {teachers.map((teacher) => (
              <TeacherCard key={teacherKey(teacher)} teacher={teacher} onSelect={() => onSelectTeacher(teacher)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            {isSearching
              ? 'No encontramos ese docente. Probá con apellido o materia.'
              : hasFilters
                ? 'No hay docentes con esos filtros.'
                : 'No hay docentes disponibles.'}
          </p>
        )}

        {!isSearching && !hasFilters && !showAllTeachers && (
          <button
            type="button"
            onClick={() => setShowAllTeachers(true)}
            className="w-full pt-1 text-center text-sm font-medium text-[#0B3B8F] hover:underline"
          >
            Ver todos los docentes
          </button>
        )}
      </div>
    </div>
  )
}

function FilterMenuButton({
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
      className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
        active
          ? 'border-[#0B3B8F]/25 bg-[#0B3B8F]/[0.06] text-[#0B3B8F]'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

function ActiveFilterTag({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[#0B3B8F]/20 bg-[#0B3B8F]/[0.06] py-1 pl-3 pr-1.5 text-xs font-medium text-[#0B3B8F]">
      {label}
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-[#0B3B8F]/10"
        aria-label={`Quitar filtro ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

function FilterPanel({
  options,
  selectedId,
  onSelect,
}: {
  options: readonly { id: string; label: string }[]
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
      <ul className="max-h-48 space-y-0.5 overflow-y-auto">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              onClick={() => onSelect(selectedId === option.id ? null : option.id)}
              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                selectedId === option.id
                  ? 'bg-[#0B3B8F]/[0.08] font-medium text-[#0B3B8F]'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CourseStep({
  teacher,
  groupedCourses,
  course,
  onCourseChange,
  onBack,
  onContinue,
}: {
  teacher: IinTeacher
  groupedCourses: Record<CourseBucket, string[]>
  course: string
  onCourseChange: (value: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const allCourses = useMemo(() => {
    const items: { value: string; label: string }[] = []
    for (const bucket of Object.keys(groupedCourses) as CourseBucket[]) {
      for (const item of groupedCourses[bucket]) {
        const label = bucket === 'elective' ? getElectiveTopic(item) : item
        items.push({ value: item, label })
      }
    }
    return items.sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [groupedCourses])

  const selectedLabel =
    allCourses.find((item) => item.value === course)?.label ?? course
  const singleCourse = allCourses.length === 1

  return (
    <div className="space-y-6">
      <CompactTeacherHeader name={shortTeacherName(teacher.name)} />

      <div>
        <p className="text-sm text-slate-600">
          Elegí la materia que cursaste con este docente.
        </p>
      </div>

      {singleCourse ? (
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-400">Materia seleccionada</p>
          <p className="mt-1 text-sm font-medium text-slate-900">{selectedLabel}</p>
        </div>
      ) : (
        <label className="block">
          <span className="sr-only">Materia</span>
          <div className="relative">
            <select
              value={course}
              onChange={(event) => onCourseChange(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm text-slate-900 outline-none focus:border-[#0B3B8F]/40 focus:ring-2 focus:ring-[#0B3B8F]/10"
            >
              {allCourses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
          </div>
        </label>
      )}

      <WizardNav onBack={onBack} onNext={onContinue} nextLabel="Continuar" nextDisabled={!course} />
    </div>
  )
}

function ReviewStep({
  teacher,
  course,
  dimensions,
  comment,
  submitting,
  submitError,
  onDimensionChange,
  onCommentChange,
  onBack,
  onSubmit,
}: {
  teacher: IinTeacher
  course: string
  dimensions: ReviewDimensionRatings
  comment: string
  submitting: boolean
  submitError: string | null
  onDimensionChange: (id: ReviewDimensionId, value: number) => void
  onCommentChange: (value: string) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const [showExtraDimensions, setShowExtraDimensions] = useState(false)
  const courseLabel = getCourseBucket(course) === 'elective' ? getElectiveTopic(course) : course

  const dimensionById = useMemo(
    () => new Map(REVIEW_DIMENSIONS.map((dimension) => [dimension.id, dimension])),
    [],
  )

  const visibleDimensionIds = showExtraDimensions
    ? [...PRIMARY_REVIEW_DIMENSION_IDS, ...SECONDARY_REVIEW_DIMENSION_IDS]
    : [...PRIMARY_REVIEW_DIMENSION_IDS]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Tu reseña</h2>
        <p className="mt-1 text-sm text-slate-500">
          {shortTeacherName(teacher.name)}
          {courseLabel ? ` · ${courseLabel}` : ''}
          {' · '}Anónima para otros estudiantes.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {visibleDimensionIds.map((id) => {
          const dimension = dimensionById.get(id)
          if (!dimension) return null
          return (
            <StarRatingRow
              key={dimension.id}
              label={dimension.label}
              value={dimensions[dimension.id]}
              onChange={(value) => onDimensionChange(dimension.id, value)}
            />
          )
        })}
      </div>

      {!showExtraDimensions && (
        <button
          type="button"
          onClick={() => setShowExtraDimensions(true)}
          className="text-sm font-medium text-[#0B3B8F] hover:underline"
        >
          + Evaluar otros aspectos
        </button>
      )}

      <textarea
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        placeholder="Contá brevemente tu experiencia… (opcional)"
        rows={3}
        maxLength={2000}
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#0B3B8F]/40 focus:ring-2 focus:ring-[#0B3B8F]/10"
      />

      {submitError && <p className="text-sm text-red-600">{submitError}</p>}

      <div className="flex gap-2 pt-1">
        <Button variant="secondary" className="justify-center gap-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          Atrás
        </Button>
        <Button className="flex-1 justify-center" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Publicando…' : 'Publicar reseña'}
        </Button>
      </div>
    </div>
  )
}

function StarRatingRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <span className="text-sm text-slate-800">{label}</span>
      <div className="flex shrink-0 gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-1"
            aria-label={`${label}: ${star} de 5`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function DoneStep({
  teacher,
  course,
  copied,
  onCopyLink,
  onAnother,
}: {
  teacher: IinTeacher
  course: string
  copied: boolean
  onCopyLink: () => void
  onAnother: () => void
}) {
  const courseLabel = course
    ? getCourseBucket(course) === 'elective'
      ? getElectiveTopic(course)
      : course
    : null

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Check className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-900">¡Reseña publicada!</h2>
        <p className="mt-2 text-sm text-slate-600">
          Tu opinión sobre {shortTeacherName(teacher.name)}
          {courseLabel ? ` (${courseLabel})` : ''} ya está en PoliPlan.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a
          href={ROUTES.home}
          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-surface px-4 py-2.5 text-sm font-medium text-text transition hover:bg-slate-50"
        >
          Ver en PoliPlan
        </a>
        <Button className="justify-center gap-2" onClick={onCopyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Enlace copiado' : 'Copiar enlace'}
        </Button>
      </div>
      <button
        type="button"
        onClick={onAnother}
        className="text-sm font-medium text-[#0B3B8F] hover:underline"
      >
        Reseñar otro docente
      </button>
    </div>
  )
}

function CompactTeacherHeader({ name }: { name: string }) {
  return <p className="text-base font-semibold text-slate-900">{name}</p>
}

function TeacherCard({ teacher, onSelect }: { teacher: IinTeacher; onSelect: () => void }) {
  const gender = inferTeacherGender(teacher.name)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-[#0B3B8F]/25 hover:bg-[#0B3B8F]/[0.03]"
    >
      <TeacherPersonAvatar gender={gender} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-slate-900">{shortTeacherName(teacher.name)}</span>
        <span className="mt-0.5 block line-clamp-1 text-xs text-slate-500">{primaryCourseLabel(teacher)}</span>
      </span>
    </button>
  )
}

function WizardNav({
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
}) {
  return (
    <div className="flex gap-2 pt-1">
      <Button variant="secondary" className="justify-center gap-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Atrás
      </Button>
      <Button className="flex-1 justify-center gap-2" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
