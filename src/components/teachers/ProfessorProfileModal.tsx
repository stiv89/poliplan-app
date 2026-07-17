/**
 * ProfessorProfileModal — Opiniones del docente
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Flag, LoaderCircle, PenLine, Star, X } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/constants'
import {
  fetchTeacherProfile,
  reportTeacherReview,
  resolveTeacherId,
  submitTeacherReview,
} from '@/services/teacherReviewService'
import type { OpenTeacherProfileInput, TeacherProfile, TeacherReview, ReviewSort } from '@/types/teacher'
import { REVIEW_REPORT_REASONS } from '@/types/teacher'
import {
  REVIEW_DIMENSIONS,
  REVIEW_MIN_FOR_SUMMARY,
  REVIEW_SUMMARY_CHIPS,
  averageDimensionRating,
  buildStructuredReviewBody,
  defaultDimensionRatings,
  formatRelativeReviewDate,
  formatReviewRatingAverage,
  formatReviewComment,
  extractReviewCourseFromBody,
  normalizeTeacherCourseLabel,
  teacherCourseGroupKey,
  type ReviewDimensionId,
  type ReviewDimensionRatings,
} from '@/utils/teacher'

interface ProfessorProfileModalProps {
  input: OpenTeacherProfileInput
  onClose: () => void
}

export function ProfessorProfileModal({ input, onClose }: ProfessorProfileModalProps) {
  const navigate = useNavigate()
  const { user, isConfigured } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [courseFilter, setCourseFilter] = useState<string | 'all'>('all')
  const [sort, setSort] = useState<ReviewSort>('recent')
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [dimensions, setDimensions] = useState<ReviewDimensionRatings>(defaultDimensionRatings)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [reportReviewId, setReportReviewId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState<string>(REVIEW_REPORT_REASONS[0])
  const [reporting, setReporting] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!isConfigured) {
        setError('Conectate a internet para ver reseñas de docentes.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        const teacherId = await resolveTeacherId(input)
        if (!teacherId) {
          throw new Error('No encontramos este docente.')
        }

        const data = await fetchTeacherProfile(teacherId, input.academicPeriodId)
        if (!cancelled) {
          setProfile(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo cargar el perfil.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [input, isConfigured])

  const primarySection = useMemo(() => {
    if (!profile) return null
    if (input.courseId) {
      return profile.sections.find((section) => section.courseId === input.courseId) ?? null
    }
    return profile.sections[0] ?? null
  }, [input.courseId, profile])

  const courseOptions = useMemo(() => {
    if (!profile) return []
    const map = new Map<string, { id: string; label: string }>()
    for (const section of profile.sections) {
      const label = normalizeTeacherCourseLabel(section.courseName)
      const key = teacherCourseGroupKey(section.courseName)
      if (!map.has(key)) {
        map.set(key, { id: section.courseId, label })
      }
    }
    for (const review of profile.reviews) {
      if (review.courseId && !map.has(review.courseId)) {
        const fromBody = extractReviewCourseFromBody(review.body)
        const label = fromBody ?? 'Materia'
        map.set(teacherCourseGroupKey(label), { id: review.courseId, label })
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'es'))
  }, [profile])

  const filteredReviews = useMemo(() => {
    if (!profile) return []
    const base =
      courseFilter === 'all'
        ? profile.reviews
        : profile.reviews.filter((review) => {
            if (!review.courseId) return true
            if (review.courseId === courseFilter) return true
            const selected = courseOptions.find((course) => course.id === courseFilter)
            if (!selected) return false
            const selectedKey = teacherCourseGroupKey(selected.label)
            const reviewLabel =
              courseOptions.find((course) => course.id === review.courseId)?.label ??
              extractReviewCourseFromBody(review.body)
            return reviewLabel ? teacherCourseGroupKey(reviewLabel) === selectedKey : false
          })

    if (sort === 'helpful') {
      return [...base].sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt))
    }
    return base
  }, [courseFilter, courseOptions, profile, sort])

  const showSummary = (profile?.reviewCount ?? 0) >= REVIEW_MIN_FOR_SUMMARY
  const reviewsRemaining = Math.max(0, REVIEW_MIN_FOR_SUMMARY - (profile?.reviewCount ?? 0))

  const reviewStatusLabel = useMemo(() => {
    if (!profile) return ''
    if (profile.reviewCount === 0) return 'Sin reseñas todavía'
    if (!showSummary) {
      return `${profile.reviewCount} reseña${profile.reviewCount === 1 ? '' : 's'} · faltan ${reviewsRemaining} para el promedio`
    }
    return `${profile.reviewCount} reseña${profile.reviewCount === 1 ? '' : 's'}`
  }, [profile, reviewsRemaining, showSummary])

  const handleWriteReview = () => {
    setShowReviewForm(true)
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const handleLoginRedirect = () => {
    onClose()
    navigate(ROUTES.settings)
  }

  const handleSubmit = async () => {
    if (!user || !profile) return

    setSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    try {
      const body = buildStructuredReviewBody(dimensions, comment)
      const rating = averageDimensionRating(dimensions)
      const review = await submitTeacherReview({
        teacherId: profile.teacher.id,
        courseId: courseFilter === 'all' ? input.courseId ?? null : courseFilter,
        academicPeriodId: input.academicPeriodId ?? null,
        body,
        rating,
        authorId: user.id,
      })

      setProfile((current) => {
        if (!current) return current
        const newCount = current.reviewCount + 1
        return {
          ...current,
          reviews: [review, ...current.reviews],
          reviewCount: newCount,
          averageRating:
            current.reviewCount === 0
              ? review.rating
              : ((current.averageRating ?? 0) * current.reviewCount + review.rating) / newCount,
        }
      })
      setComment('')
      setDimensions(defaultDimensionRatings())
      setSubmitSuccess(true)
      setShowReviewForm(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo publicar la reseña.'
      if (message.includes('duplicate') || message.includes('unique')) {
        setSubmitError('Ya publicaste una reseña para este docente en este periodo.')
      } else {
        setSubmitError(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleReport = async () => {
    if (!user || !reportReviewId) return
    setReporting(true)
    try {
      await reportTeacherReview({
        reviewId: reportReviewId,
        reporterId: user.id,
        reason: reportReason,
      })
      setReportReviewId(null)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo reportar.')
    } finally {
      setReporting(false)
    }
  }

  const contextLine = primarySection
    ? `${primarySection.courseName} · Sección ${primarySection.sectionCode}`
    : null

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-white/30 backdrop-blur-[5px] md:bg-black/20"
        aria-label="Cerrar opiniones del docente"
        onClick={onClose}
      />

      <div
        className="relative flex h-[92dvh] w-full max-h-[92dvh] flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-surface shadow-2xl shadow-slate-300/30 md:h-auto md:max-h-[min(88vh,820px)] md:max-w-[720px] md:rounded-3xl"
        role="dialog"
        aria-modal="true"
        aria-label="Opiniones del docente"
      >
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="min-w-0 pr-3">
            {loading ? (
              <div className="space-y-2">
                <div className="h-7 w-48 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-4 w-36 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <h2 className="truncate text-xl font-bold text-text md:text-2xl">
                  {profile?.teacher.name ?? 'Docente'}
                </h2>
                {contextLine && (
                  <p className="mt-0.5 truncate text-sm text-muted">{contextLine}</p>
                )}
                {profile && (
                  <p className="mt-1 text-sm text-muted">{reviewStatusLabel}</p>
                )}
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-muted hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted">
              <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Cargando opiniones…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {error}
            </div>
          )}

          {!loading && profile && (
            <div className="space-y-5">
              {showSummary && profile.averageRating != null && (
                <div className="flex items-baseline gap-3">
                  <span className="text-4xl font-bold tabular-nums text-text">
                    {formatReviewRatingAverage(profile.averageRating).replace('.', ',')}
                  </span>
                  <span className="text-sm text-muted">{reviewStatusLabel}</span>
                </div>
              )}

              {profile.reviewCount > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1.5">
                    {REVIEW_SUMMARY_CHIPS.map((chip) => (
                      <span
                        key={chip}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          showSummary
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-slate-50 text-slate-400'
                        }`}
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                  {!showSummary && (
                    <p className="mt-2 text-xs text-muted">
                      Estos valores aparecerán cuando haya suficientes reseñas.
                    </p>
                  )}
                </div>
              )}

              {courseOptions.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    active={courseFilter === 'all'}
                    onClick={() => setCourseFilter('all')}
                  >
                    Todas
                  </FilterChip>
                  {courseOptions.map((course) => (
                    <FilterChip
                      key={course.id}
                      active={courseFilter === course.id}
                      onClick={() => setCourseFilter(course.id)}
                    >
                      {course.label}
                    </FilterChip>
                  ))}
                </div>
              )}

              {filteredReviews.length > 0 && (
                <>
                  <div className="border-t border-slate-100" />
                  <div className="flex gap-1 rounded-lg bg-slate-100/80 p-0.5">
                    <SortTab active={sort === 'recent'} onClick={() => setSort('recent')}>
                      Más recientes
                    </SortTab>
                    <SortTab active={sort === 'helpful'} onClick={() => setSort('helpful')}>
                      Más útiles
                    </SortTab>
                  </div>
                </>
              )}

              <div className="space-y-3">
                {filteredReviews.length === 0 ? (
                  <EmptyReviewsState
                    onWriteReview={handleWriteReview}
                    showForm={showReviewForm}
                  />
                ) : (
                  filteredReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      courseLabel={
                        courseOptions.find((course) => course.id === review.courseId)?.label ??
                        extractReviewCourseFromBody(review.body)
                      }
                      onReport={() => setReportReviewId(review.id)}
                    />
                  ))
                )}
              </div>

              {showReviewForm && (
                <ReviewForm
                  user={user}
                  dimensions={dimensions}
                  comment={comment}
                  submitting={submitting}
                  submitError={submitError}
                  submitSuccess={submitSuccess}
                  onDimensionChange={(id, value) =>
                    setDimensions((current) => ({ ...current, [id]: value }))
                  }
                  onCommentChange={setComment}
                  onSubmit={() => void handleSubmit()}
                  onCancel={() => setShowReviewForm(false)}
                  onLogin={handleLoginRedirect}
                />
              )}

              {!showReviewForm && filteredReviews.length > 0 && isConfigured && (
                <div className="pt-1">
                  <Button className="w-full justify-center gap-2" onClick={handleWriteReview}>
                    <PenLine className="h-4 w-4" aria-hidden="true" />
                    Escribir una reseña
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted">
                    Tu identidad no se mostrará públicamente.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {reportReviewId && (
          <div className="absolute inset-0 z-10 flex items-end justify-center bg-black/20 p-4 sm:items-center">
            <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-xl">
              <h3 className="font-semibold text-text">Reportar reseña</h3>
              <p className="mt-1 text-sm text-muted">Contanos qué problema tiene este comentario.</p>
              <div className="mt-3 space-y-2">
                {REVIEW_REPORT_REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="report-reason"
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                    />
                    {reason}
                  </label>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 justify-center"
                  onClick={() => setReportReviewId(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 justify-center"
                  onClick={() => void handleReport()}
                  disabled={reporting}
                >
                  {reporting ? 'Enviando…' : 'Reportar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyReviewsState({
  onWriteReview,
  showForm,
}: {
  onWriteReview: () => void
  showForm: boolean
}) {
  return (
    <div className="py-6 text-center">
      <p className="text-base font-medium text-text">Todavía no hay reseñas</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Compartí una opinión respetuosa que pueda ayudar a otros estudiantes.
      </p>
      {!showForm && (
        <>
          <Button className="mt-5 gap-2" onClick={onWriteReview}>
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Escribir una reseña
          </Button>
          <p className="mt-3 text-xs text-muted">
            Tu identidad no se mostrará públicamente.
          </p>
        </>
      )}
    </div>
  )
}

function ReviewForm({
  user,
  dimensions,
  comment,
  submitting,
  submitError,
  submitSuccess,
  onDimensionChange,
  onCommentChange,
  onSubmit,
  onCancel,
  onLogin,
}: {
  user: { id: string } | null
  dimensions: ReviewDimensionRatings
  comment: string
  submitting: boolean
  submitError: string | null
  submitSuccess: boolean
  onDimensionChange: (id: ReviewDimensionId, value: number) => void
  onCommentChange: (value: string) => void
  onSubmit: () => void
  onCancel: () => void
  onLogin: () => void
}) {
  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4">
        <p className="text-sm text-text">
          Para escribir una reseña necesitás iniciar sesión con tu cuenta de estudiante.
        </p>
        <p className="mt-1 text-xs text-muted">
          Tu identidad no se mostrará públicamente.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button className="flex-1 justify-center" onClick={onLogin}>
            Iniciar sesión
          </Button>
          <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-4">
      <h3 className="text-sm font-semibold text-text">Tu reseña</h3>
      <div className="mt-3 divide-y divide-slate-100">
        {REVIEW_DIMENSIONS.map((dimension) => (
          <DimensionRating
            key={dimension.id}
            label={dimension.label}
            value={dimensions[dimension.id]}
            onChange={(value) => onDimensionChange(dimension.id, value)}
          />
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        placeholder="Comentario opcional (breve)"
        rows={3}
        maxLength={2000}
        className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-text outline-none focus:border-primary/40"
      />
      {submitError && <p className="mt-2 text-xs text-danger">{submitError}</p>}
      {submitSuccess && (
        <p className="mt-2 text-xs text-success">Reseña publicada. Gracias por compartir.</p>
      )}
      <p className="mt-2 text-xs text-muted">Tu identidad no se mostrará públicamente.</p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          className="flex-1 justify-center"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Publicando…' : 'Publicar reseña'}
        </Button>
        <Button variant="secondary" className="flex-1 justify-center" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}

function DimensionRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-text">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded p-0.5"
            aria-label={`${label}: ${star} de 5`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-primary text-white'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function SortTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
        active ? 'bg-white text-text shadow-sm' : 'text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  )
}

function ReviewCard({
  review,
  courseLabel,
  onReport,
}: {
  review: TeacherReview
  courseLabel: string | null
  onReport: () => void
}) {
  const comment = formatReviewComment(review.body)

  return (
    <article className="rounded-2xl border border-slate-100 bg-background px-4 py-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          <span className="text-sm font-semibold tabular-nums text-text">
            {review.rating.toFixed(1).replace('.', ',')}
          </span>
        </div>
        <button
          type="button"
          onClick={onReport}
          className="rounded-lg p-1.5 text-muted hover:bg-slate-100"
          aria-label="Reportar reseña"
        >
          <Flag className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text">
        {comment || 'Reseña sin comentario escrito.'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
        {courseLabel && <span>{courseLabel}</span>}
        {courseLabel && <span aria-hidden="true">·</span>}
        <span>{formatRelativeReviewDate(review.createdAt)}</span>
      </div>
      <div className="mt-2">
        <button
          type="button"
          disabled
          className="text-xs text-muted"
          title="Próximamente"
        >
          Útil
        </button>
      </div>
    </article>
  )
}
