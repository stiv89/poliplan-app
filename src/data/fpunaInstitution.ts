export const FPUNA_INSTITUTION = {
  id: 'fpuna',
  name: 'Facultad Politécnica — Universidad Nacional de Asunción',
  shortName: 'Facultad Politécnica UNA',
  location: 'Asunción, Paraguay',
  keywords: ['fpuna', 'politecnica', 'politécnica', 'una', 'asuncion', 'asunción', 'facultad'],
} as const

export function matchesFpunaInstitution(query: string): boolean {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true
  return (
    FPUNA_INSTITUTION.keywords.some(
      (term) => term.includes(normalized) || normalized.includes(term),
    ) ||
    FPUNA_INSTITUTION.name.toLowerCase().includes(normalized) ||
    FPUNA_INSTITUTION.location.toLowerCase().includes(normalized)
  )
}
