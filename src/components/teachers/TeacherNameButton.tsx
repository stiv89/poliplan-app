import type { OpenTeacherProfileInput } from '@/types/teacher'
import { useTeacherProfile } from '@/features/teachers/TeacherProfileContext'

interface TeacherNameButtonProps {
  teacherId?: string | null
  teacherName?: string | null
  teacherEmail?: string | null
  courseId?: string | null
  academicPeriodId?: string | null
  className?: string
}

export function TeacherNameButton({
  teacherId,
  teacherName,
  teacherEmail,
  courseId,
  academicPeriodId,
  className = '',
}: TeacherNameButtonProps) {
  const { openTeacherProfile } = useTeacherProfile()
  const label = teacherName?.trim()

  if (!label) return null

  const open = () => {
    openTeacherProfile({
      teacherId,
      teacherName,
      teacherEmail,
      courseId,
      academicPeriodId,
    } satisfies OpenTeacherProfileInput)
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        open()
      }}
      className={`truncate text-left font-normal text-slate-600 hover:text-primary hover:underline ${className}`}
      aria-label={`Ver reseñas de ${label}`}
    >
      {label}
    </button>
  )
}
