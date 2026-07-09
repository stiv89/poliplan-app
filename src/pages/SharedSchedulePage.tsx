import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Copy, Loader2, Share2 } from 'lucide-react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { Button } from '@/components/ui/Button'
import { WeeklyScheduleGrid } from '@/components/schedule/WeeklyScheduleGrid'
import { ROUTES } from '@/config/constants'
import { useSchedule } from '@/hooks/useSchedule'
import { scheduleRepository } from '@/repositories/SupabaseScheduleRepository'
import { resolveSharedSchedule } from '@/services/sharedScheduleService'
import type { CourseSection } from '@/types/academic'
import type { SharedScheduleSnapshot } from '@/types/sharedSchedule'
import { detectScheduleConflicts } from '@/utils/conflicts'

export function SharedSchedulePage() {
  const { shareRef = '' } = useParams()
  const navigate = useNavigate()
  const { importSharedSchedule } = useSchedule()

  const [snapshot, setSnapshot] = useState<SharedScheduleSnapshot | null>(null)
  const [sections, setSections] = useState<CourseSection[]>([])
  const [periodName, setPeriodName] = useState<string | null>(null)
  const [coursesMeta, setCoursesMeta] = useState<Map<string, { name: string; code: string | null }>>(
    () => new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<'not-found' | 'load-failed' | null>(null)
  const [importing, setImporting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const resolved = await resolveSharedSchedule(shareRef)
        if (!resolved) {
          if (!cancelled) setError('not-found')
          return
        }

        const [period, periodCourses, ...sectionRows] = await Promise.all([
          scheduleRepository.getAcademicPeriods().then((periods) =>
            periods.find((period) => period.id === resolved.academicPeriodId) ?? null,
          ),
          scheduleRepository.getCoursesForPeriod(resolved.academicPeriodId),
          ...resolved.sectionIds.map((sectionId) => scheduleRepository.getSectionById(sectionId)),
        ])

        const validSections = sectionRows.filter(
          (section): section is CourseSection =>
            section != null && section.academicPeriodId === resolved.academicPeriodId,
        )

        if (validSections.length === 0) {
          if (!cancelled) setError('not-found')
          return
        }

        if (!cancelled) {
          setSnapshot(resolved)
          setSections(validSections)
          setPeriodName(period?.name ?? null)
          setCoursesMeta(new Map(periodCourses.map((course) => [course.id, course])))
        }
      } catch {
        if (!cancelled) setError('load-failed')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [shareRef])

  const coursesById = useMemo(() => {
    const map = new Map<string, { name: string; code: string | null }>()
    for (const section of sections) {
      if (map.has(section.courseId)) continue
      const course = coursesMeta.get(section.courseId)
      map.set(section.courseId, {
        name: course?.name ?? section.sectionCode,
        code: course?.code ?? null,
      })
    }
    return map
  }, [coursesMeta, sections])

  const conflicts = useMemo(() => detectScheduleConflicts(sections), [sections])

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiá este link:', window.location.href)
    }
  }

  async function handleDuplicate() {
    if (!snapshot || importing) return
    setImporting(true)
    try {
      await importSharedSchedule(snapshot)
      navigate(ROUTES.home)
    } finally {
      setImporting(false)
    }
  }

  if (loading) {
    return <LoadingState label="Cargando horario compartido…" />
  }

  if (error || !snapshot) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <Share2 className="h-10 w-10 text-slate-300" aria-hidden="true" />
        <h1 className="mt-4 text-lg font-semibold text-text">Horario no encontrado</h1>
        <p className="mt-2 max-w-sm text-sm text-muted">
          {error === 'load-failed'
            ? 'No pudimos cargar este horario. Probá de nuevo en unos minutos.'
            : 'El link puede haber expirado o no ser válido.'}
        </p>
        <Link
          to={ROUTES.home}
          className="mt-6 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary/90"
        >
          Ir a mi horario
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-200/60 bg-white px-4 py-4 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-primary">
              Horario compartido
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-text">
              {snapshot.name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {sections.length} materia{sections.length === 1 ? '' : 's'}
              {periodName ? ` · ${periodName}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void handleCopyLink()}>
              {copied ? 'Link copiado' : 'Copiar link'}
              {!copied && <Copy className="h-4 w-4" aria-hidden="true" />}
            </Button>
            <Button type="button" disabled={importing} onClick={() => void handleDuplicate()}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Duplicando…
                </>
              ) : (
                'Duplicar en mi PoliPlan'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden bg-slate-50/45">
        <WeeklyScheduleGrid
          selectedSections={sections}
          conflicts={conflicts}
          coursesById={coursesById}
          onRemoveSection={() => undefined}
          removingId={null}
        />
      </div>
    </div>
  )
}
