export const IMPORTER_CONFIG = {
  thresholds: {
    maxRejectedRowsPercent: Number(process.env.MAX_REJECTED_ROWS_PERCENT ?? 15),
    minCourses: Number(process.env.MIN_COURSES ?? 5),
    minSections: Number(process.env.MIN_SECTIONS ?? 10),
    maxDropPercent: Number(process.env.MAX_DROP_PERCENT ?? 40),
  },
  sheetAliases: {
    career: [
      'IAE',
      'ICM',
      'IEK',
      'IEL',
      'IEN',
      'IIN',
      'IMK',
      'ISP',
      'LCA',
      'LCI',
      'LCIk',
      'LEL',
      'LGH',
      'TSE',
    ],
    campus: ['Cnel. Oviedo', 'Villarrica', 'Coronel Oviedo', 'VILLARRICA'],
    codes: ['Códigos', 'Codigos'],
    equivalences: ['Asignaturas Homólogas', 'Asignaturas Homologadas'],
  },
  headerAliases: {
    item: ['item'],
    department: ['dpto', 'depto', 'departamento'],
    courseName: ['asignatura', 'materia'],
    level: ['nivel'],
    semesterGroup: ['sem/grupo', 'semestre', 'grupo'],
    careerCode: ['sigla carrera', 'carrera'],
    shift: ['turno'],
    sectionCode: ['seccion', 'sección'],
    teacherTitle: ['tit', 'tit.'],
    teacherLastName: ['apellido'],
    teacherFirstName: ['nombre'],
    teacherEmail: ['correo institucional', 'correos', 'correo'],
    day: ['dia', 'día'],
    time: ['hora'],
    classroom: ['aula'],
    monday: ['lunes'],
    tuesday: ['martes'],
    wednesday: ['miercoles', 'miércoles'],
    thursday: ['jueves'],
    friday: ['viernes'],
    saturday: ['sabado', 'sábado'],
  },
  examGroupAliases: {
    partial1: ['1er. parcial', '1er parcial', 'primer parcial'],
    partial2: ['2do. parcial', '2do parcial', 'segundo parcial'],
    final1: ['1er. final', '1er final', 'primera final'],
    revision1: ['revision', 'revisión'],
    final2: ['2do. final', '2do final', 'segunda final'],
    revision2: ['revision', 'revisión'],
    board: ['mesa examinadora', 'mesa'],
  },
  ignoredValues: ['s/d', 'n/a', '-', '--', '---', '-- --', ''],
} as const

export type SheetKind = 'career' | 'campus' | 'codes' | 'equivalences' | 'unknown'

export function classifySheetName(sheetName: string): SheetKind {
  const normalized = sheetName.trim().toLowerCase()

  if (IMPORTER_CONFIG.sheetAliases.codes.some((name) => normalized.includes(name.toLowerCase()))) {
    return 'codes'
  }

  if (
    IMPORTER_CONFIG.sheetAliases.equivalences.some((name) =>
      normalized.includes(name.toLowerCase()),
    )
  ) {
    return 'equivalences'
  }

  if (
    IMPORTER_CONFIG.sheetAliases.campus.some(
      (name) => normalized === name.toLowerCase() || normalized.includes(name.toLowerCase()),
    )
  ) {
    return 'campus'
  }

  if (
    IMPORTER_CONFIG.sheetAliases.career.some(
      (code) => normalized === code.toLowerCase() || normalized.startsWith(code.toLowerCase()),
    )
  ) {
    return 'career'
  }

  return 'unknown'
}
