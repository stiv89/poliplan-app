import { useState } from 'react'
import { LoadingState } from '@/components/feedback/LoadingState'
import { SectionsExplorer } from '@/components/sections/SectionsExplorer'
import { useSchedule } from '@/hooks/useSchedule'
import type { CourseSection } from '@/types/academic'

export function SectionsPage() {
  const {
    loading,
    careers,
    settings,
    allSections,
    coursesById,
    toggleSection,
    isSectionSelected,
    selectedSections,
    conflicts,
    setSelectedCareer,
    catalogLoading,
  } = useSchedule()

  const [toggleLoading, setToggleLoading] = useState(false)

  const coursesWithLevel = new Map(
    [...coursesById.entries()].map(([id, course]) => [
      id,
      { name: course.name, code: course.code ?? null, level: course.level ?? null },
    ]),
  )

  const handleToggle = async (section: CourseSection) => {
    setToggleLoading(true)
    try {
      await toggleSection(section)
    } finally {
      setToggleLoading(false)
    }
  }

  if (loading) {
    return <LoadingState label="Cargando materias..." />
  }

  return (
    <SectionsExplorer
      careers={careers}
      selectedCareerId={settings?.selectedCareerId ?? null}
      onCareerChange={(careerId) => void setSelectedCareer(careerId)}
      allSections={allSections}
      coursesById={coursesWithLevel}
      selectedSections={selectedSections}
      conflicts={conflicts}
      isSectionSelected={isSectionSelected}
      onToggle={(section) => void handleToggle(section)}
      toggleLoading={toggleLoading}
      catalogLoading={catalogLoading}
    />
  )
}
