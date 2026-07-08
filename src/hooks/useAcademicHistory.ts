import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  AcademicAttempt,
  AcademicProfile,
  Curriculum,
  ProgressSummary,
  StudentCourseStatus,
  TranscriptParseRow,
} from '@/types/academicHistory'
import {
  confirmPdfImport,
  getAcademicProfile,
  getAttempts,
  getCurriculum,
  saveAttempt,
  deleteAttempt,
  addSemesterCourses,
} from '@/repositories/AcademicHistoryRepository'
import {
  calculateProgressSummary,
  deriveStudentCourseStatuses,
  getPendingCourses,
  groupAttemptsByCourse,
} from '@/utils/progress'

export function useAcademicHistory() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<AcademicProfile | null>(null)
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [attempts, setAttempts] = useState<AcademicAttempt[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [nextProfile, nextCurriculum, nextAttempts] = await Promise.all([
        getAcademicProfile(),
        getCurriculum(),
        getAttempts(),
      ])
      setProfile(nextProfile)
      setCurriculum(nextCurriculum)
      setAttempts(nextAttempts)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const statuses = useMemo<StudentCourseStatus[]>(() => {
    if (!curriculum) return []
    return deriveStudentCourseStatuses(curriculum, attempts)
  }, [curriculum, attempts])

  const summary = useMemo<ProgressSummary | null>(() => {
    if (!profile || !curriculum) return null
    return calculateProgressSummary(profile, curriculum, attempts)
  }, [profile, curriculum, attempts])

  const pendingCourses = useMemo(() => {
    if (!curriculum) return []
    return getPendingCourses(curriculum, statuses)
  }, [curriculum, statuses])

  const attemptsByCourse = useMemo(() => {
    if (!curriculum) return new Map()
    return groupAttemptsByCourse(curriculum, attempts)
  }, [curriculum, attempts])

  const confirmImport = useCallback(
    async (rows: TranscriptParseRow[], meta: { fileName: string; gpa?: number | null }) => {
      await confirmPdfImport(rows, meta)
      await refresh()
    },
    [refresh],
  )

  const addManual = useCallback(
    async (input: Parameters<typeof saveAttempt>[0]) => {
      await saveAttempt(input)
      await refresh()
    },
    [refresh],
  )

  const removeAttempt = useCallback(
    async (id: string) => {
      await deleteAttempt(id)
      await refresh()
    },
    [refresh],
  )

  const addSemester = useCallback(
    async (courseIds: string[], grades?: Record<string, number | null>) => {
      await addSemesterCourses(courseIds, { grades })
      await refresh()
    },
    [refresh],
  )

  return {
    loading,
    profile,
    curriculum,
    attempts,
    statuses,
    summary,
    pendingCourses,
    attemptsByCourse,
    refresh,
    confirmImport,
    addManual,
    removeAttempt,
    addSemester,
  }
}
