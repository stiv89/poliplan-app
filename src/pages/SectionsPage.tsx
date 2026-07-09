import { useMemo, useState } from 'react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { SectionsExplorer } from '@/components/sections/SectionsExplorer'
import { useSchedule } from '@/hooks/useSchedule'
import type { CourseSection } from '@/types/academic'

export function SectionsPage() {
  const {
    loading,
    careers,
    allSections,
    coursesById,
    toggleSection,
    isSectionSelected,
    selectedSections,
    conflicts,
    catalogLoading,
  } = useSchedule()

  const [toggleLoading, setToggleLoading] = useState(false)

  const coursesWithCareer = useMemo(
    () =>
      new Map(
        [...coursesById.entries()].map(([id, course]) => [
          id,
          {
            name: course.name,
            code: course.code ?? null,
            level: course.level ?? null,
            careerId: course.careerId,
          },
        ]),
      ),
    [coursesById],
  )

  const handleToggle = async (section: CourseSection) => {
    setToggleLoading(true)
    try {
      await toggleSection(section)
    } finally {
      setToggleLoading(false)
    }
  }

  if (loading && selectedSections.length === 0) {
    return <LoadingState label="Cargando materias..." />
  }

  return (
    <SectionsExplorer
      careers={careers}
      allSections={allSections}
      coursesById={coursesWithCareer}
      selectedSections={selectedSections}
      conflicts={conflicts}
      isSectionSelected={isSectionSelected}
      onToggle={(section) => void handleToggle(section)}
      toggleLoading={toggleLoading}
      catalogLoading={catalogLoading}
    />
  )
}
