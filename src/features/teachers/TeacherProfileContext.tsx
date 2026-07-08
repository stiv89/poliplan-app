import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { ProfessorProfileModal } from '@/components/teachers/ProfessorProfileModal'
import type { OpenTeacherProfileInput } from '@/types/teacher'

interface TeacherProfileContextValue {
  openTeacherProfile: (input: OpenTeacherProfileInput) => void
  closeTeacherProfile: () => void
}

const TeacherProfileContext = createContext<TeacherProfileContextValue | null>(null)

export function TeacherProfileProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<OpenTeacherProfileInput | null>(null)

  const openTeacherProfile = useCallback((input: OpenTeacherProfileInput) => {
    if (!input.teacherId && !input.teacherName?.trim() && !input.teacherEmail?.trim()) {
      return
    }
    setActive(input)
  }, [])

  const closeTeacherProfile = useCallback(() => {
    setActive(null)
  }, [])

  const value = useMemo(
    () => ({ openTeacherProfile, closeTeacherProfile }),
    [closeTeacherProfile, openTeacherProfile],
  )

  return (
    <TeacherProfileContext.Provider value={value}>
      {children}
      {active && (
        <ProfessorProfileModal input={active} onClose={closeTeacherProfile} />
      )}
    </TeacherProfileContext.Provider>
  )
}

export function useTeacherProfile(): TeacherProfileContextValue {
  const context = useContext(TeacherProfileContext)
  if (!context) {
    throw new Error('useTeacherProfile debe usarse dentro de TeacherProfileProvider')
  }
  return context
}
