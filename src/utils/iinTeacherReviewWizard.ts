import iinCurriculum from '@/data/curricula/iin-default.json'
import iinTeachers from '@/data/iin-teachers.json'

export type IinTeacher = {
  name: string
  email: string | null
  courses: string[]
}

export type CourseBucket = 'basic' | 'elective' | 'transversal'

export type WizardStep = 'teacher' | 'course' | 'review' | 'done'

const TEACHERS = iinTeachers as IinTeacher[]

const CURRICULUM_BASIC = new Set(
  iinCurriculum.courses
    .filter((course) => course.type === 'required')
    .flatMap((course) => [course.name, normalizeCourseLabel(course.name)]),
)

const POPULAR_COURSE_PATTERNS = [
  'Algoritmos y Estructuras de Datos',
  'Bases de Datos',
  'Base de Datos',
  'Lenguajes de Programación',
  'Redes de Computadoras',
  'Ingeniería de Software',
  'Sistemas Operativos',
  'Sistemas Distribuidos',
  'Lógica para Ciencias',
  'Organización y Arquitectura',
  'Matemática Discreta',
  'Cálculo',
] as const

const TRANSVERSAL_PATTERNS = [
  'inglés',
  'contabilidad',
  'economía',
  'emprendedorismo',
  'expresión oral',
  'técnicas de organización',
  'investigación de operaciones',
  'probabilidades',
  'física',
  'fundamentos de matemática',
  'álgebra',
  'métodos numéricos',
  'matemática aplicada',
] as const

export const BASIC_COURSE_GROUPS = [
  {
    id: 'programacion',
    label: 'Programación y algoritmos',
    patterns: ['Algoritmos y Estructuras', 'Lenguajes de Programación', 'Estructura de los Lenguajes', 'Diseño de Compiladores'],
  },
  {
    id: 'sistemas',
    label: 'Sistemas y redes',
    patterns: ['Organización y Arquitectura', 'Sistemas Operativos', 'Sistemas Distribuidos', 'Redes de Computadoras', 'Gestión de Centro'],
  },
  {
    id: 'datos',
    label: 'Bases de datos',
    patterns: ['Bases de Datos', 'Base de Datos'],
  },
  {
    id: 'software',
    label: 'Ingeniería de software',
    patterns: ['Ingeniería de Software'],
  },
  {
    id: 'matematica',
    label: 'Matemática y lógica',
    patterns: ['Matemática Discreta', 'Fundamentos de Matemática', 'Cálculo', 'Algebra Lineal', 'Lógica para Ciencias', 'Métodos Numéricos', 'Matemática Aplicada', 'Probabilidades'],
  },
] as const

export const ELECTIVE_TOPIC_GROUPS = [
  { id: 'ia-ml', label: 'IA y Machine Learning', patterns: ['Inteligencia Artificial', 'Machine Learning', 'Data Science', 'Data Mining', 'Datamining'] },
  { id: 'web', label: 'Desarrollo web', patterns: ['Programación Web', 'Front-End', 'Back-End'] },
  { id: 'seguridad', label: 'Seguridad y redes', patterns: ['Ciberseguridad', 'Blockchain', 'Desempeño y Seguridad'] },
  { id: 'datos-big', label: 'Datos', patterns: ['Big Data'] },
  { id: 'ux', label: 'UX / software', patterns: ['Interacción Humano', 'Testing de software', 'Gestión de Proyectos'] },
  { id: 'imagen', label: 'Imagen y señales', patterns: ['Procesamiento Digital de Imágenes'] },
] as const

export function teacherKey(teacher: IinTeacher): string {
  return teacher.email ?? teacher.name
}

export function normalizeCourseLabel(course: string): string {
  return course
    .replace(/\s*\(\*+\)\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function shortTeacherName(fullName: string): string {
  const withoutTitle = fullName.replace(
    /^(Abog\.|C\.P\.|Dr\.|Dra\.|Econ\.|Ing\.|Lic\.|Ms\.|LIc\.)\s+/i,
    '',
  )
  const parts = withoutTitle.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return fullName.trim()
  if (parts.length === 1) return parts[0]!
  if (parts.length === 2) return `${parts[1]} ${parts[0]}`
  if (parts.length === 3) return `${parts[2]} ${parts[0]}`

  const firstName = parts[parts.length - 2]!
  const surnameParts = parts.slice(0, parts.length - 2)
  const surnameParticles = new Set(['de', 'del', 'la', 'las', 'los', 'von', 'van', 'y', 'e', 'di'])
  let surname = surnameParts[0]!

  if (surnameParts.length > 1) {
    if (/^von$/i.test(surname)) {
      surname = `${surnameParts[0]} ${surnameParts[1]}`
    } else if (surnameParticles.has(surnameParts[1]!.toLowerCase())) {
      surname = `${surnameParts[0]} ${surnameParts[1]}`
      if (surnameParts.length > 2 && surnameParticles.has(surnameParts[1]!.toLowerCase())) {
        surname = `${surnameParts[0]} ${surnameParts[1]} ${surnameParts[2]}`
      }
    }
  }

  return `${firstName} ${surname}`
}

export type TeacherGender = 'male' | 'female'

const FEMALE_NAME_PATTERN =
  /\b(luciana|margarita|emilce|noemi|lourdes|antonia|jorgelina|silvia|jessica|zulma|cinthia|pamela|soledad|ramona|veronica|felicia|andrea|cynthia|maria|trinidad|lucia|gabriela|carolina|patricia|liliana|norma|griselda|myriam|iris|gladys|blanca|elsa|rosa|ana|elena|claudia|monica|sandra|natalia|beatriz|adriana|marcela|lidia|ivonne|yolanda|juanita|teresa|miriam|sonia|diana|vanessa|vanesa|romina|florencia|valeria|macarena|rocio|inés|ines|paula|laura|victoria|susana|mirian|mirta|nancy|gloria|helen|helen|graciela|marlene|maribel|nilda|nora|olga|rebeca|regina|romina|ruth|sara|selena|soledad|susy|tamara|tania|viviana|wanda|ximena|yessica|yesica|yolanda)\b/i

export function inferTeacherGender(fullName: string): TeacherGender {
  const trimmed = fullName.trim()
  if (/^(Dra\.|Ms\.)/i.test(trimmed)) return 'female'

  const normalized = trimmed
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()

  if (FEMALE_NAME_PATTERN.test(normalized)) return 'female'
  return 'male'
}

export function getCourseBucket(course: string): CourseBucket {
  const label = normalizeCourseLabel(course).toLowerCase()
  if (label.startsWith('electiva') || label.startsWith('optativa')) return 'elective'
  if (TRANSVERSAL_PATTERNS.some((pattern) => label.includes(pattern))) return 'transversal'
  if (CURRICULUM_BASIC.has(normalizeCourseLabel(course))) return 'basic'
  if (POPULAR_COURSE_PATTERNS.some((pattern) => label.includes(pattern.toLowerCase()))) return 'basic'
  return 'basic'
}

export function getElectiveTopic(course: string): string {
  const label = normalizeCourseLabel(course)
  const dash = label.match(/^Electiva \d+\s*-?\s*(.+)$/i)
  if (dash?.[1]) return dash[1].trim()
  const opt = label.match(/^Optativa \d+\s*-?\s*(.+)$/i)
  if (opt?.[1]) return opt[1].trim()
  return label
}

export function uniqueCoursesForTeacher(teacher: IinTeacher): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const course of teacher.courses) {
    const normalized = normalizeCourseLabel(course)
    const bucket = getCourseBucket(normalized)
    const key =
      bucket === 'elective' ? getElectiveTopic(normalized).toLowerCase() : normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(normalized)
  }
  return result.sort((a, b) => a.localeCompare(b, 'es'))
}

export function groupTeacherCourses(courses: string[]): Record<CourseBucket, string[]> {
  const groups: Record<CourseBucket, string[]> = { basic: [], elective: [], transversal: [] }
  for (const course of uniqueCoursesForTeacher({ name: '', email: null, courses })) {
    groups[getCourseBucket(course)].push(course)
  }
  for (const bucket of Object.keys(groups) as CourseBucket[]) {
    groups[bucket].sort((a, b) => a.localeCompare(b, 'es'))
  }
  return groups
}

export function courseMatchesPattern(course: string, patterns: readonly string[]): boolean {
  const label = normalizeCourseLabel(course).toLowerCase()
  return patterns.some((pattern) => label.includes(pattern.toLowerCase()))
}

export function teachersForCoursePattern(patterns: readonly string[]): IinTeacher[] {
  return TEACHERS.filter((teacher) =>
    teacher.courses.some((course) => courseMatchesPattern(course, patterns)),
  ).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

export function teachersForExactCourse(courseQuery: string): IinTeacher[] {
  const q = courseQuery.trim().toLowerCase()
  return TEACHERS.filter((teacher) =>
    teacher.courses.some((course) => normalizeCourseLabel(course).toLowerCase().includes(q)),
  ).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

/** Docentes destacados en la pantalla inicial (orden fijo). */
export const POPULAR_TEACHER_EMAILS = [
  'clucken@pol.una.py', // Von Lücken
  'joaquin.lima@pol.una.py', // Lima Molinari
  'edavalos@pol.una.py', // Dávalos Giménez
  'ccappo@pol.una.py', // Cappo Araújo
] as const

export function getPopularTeachers(limit = 4): IinTeacher[] {
  const curated: IinTeacher[] = []
  const seen = new Set<string>()

  for (const email of POPULAR_TEACHER_EMAILS) {
    const teacher = TEACHERS.find(
      (entry) => entry.email?.toLowerCase() === email.toLowerCase(),
    )
    if (!teacher) continue
    const key = teacherKey(teacher)
    if (seen.has(key)) continue
    seen.add(key)
    curated.push(teacher)
    if (curated.length >= limit) return curated
  }

  const scored = TEACHERS.map((teacher) => {
    let score = 0
    for (const course of teacher.courses) {
      const label = normalizeCourseLabel(course).toLowerCase()
      if (POPULAR_COURSE_PATTERNS.some((pattern) => label.includes(pattern.toLowerCase()))) {
        score += 3
      }
      if (getCourseBucket(course) === 'basic') score += 1
    }
    if (teacher.email) score += 1
    return { teacher, score }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.teacher.name.localeCompare(b.teacher.name, 'es'))

  for (const entry of scored) {
    const key = teacherKey(entry.teacher)
    if (seen.has(key)) continue
    seen.add(key)
    curated.push(entry.teacher)
    if (curated.length >= limit) break
  }

  return curated
}

export function searchTeachers(query: string, limit = 24): IinTeacher[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const scored = TEACHERS.map((teacher) => {
    const shortName = shortTeacherName(teacher.name).toLowerCase()
    const fullName = teacher.name.toLowerCase()
    const email = (teacher.email ?? '').toLowerCase()
    const courses = teacher.courses.map((course) => normalizeCourseLabel(course).toLowerCase())
    const electiveTopics = teacher.courses.map((course) => getElectiveTopic(course).toLowerCase())

    let score = 0
    if (shortName.startsWith(q) || fullName.startsWith(q)) score += 40
    else if (shortName.includes(q) || fullName.includes(q)) score += 25
    if (email.includes(q)) score += 15
    if (courses.some((course) => course.startsWith(q))) score += 20
    else if (courses.some((course) => course.includes(q))) score += 12
    if (electiveTopics.some((topic) => topic.includes(q))) score += 10

    const haystack = [fullName, shortName, email, ...courses, ...electiveTopics].join(' ')
    if (!haystack.includes(q)) return null

    return { teacher, score }
  }).filter((entry): entry is { teacher: IinTeacher; score: number } => entry !== null)

  return scored
    .sort(
      (a, b) =>
        b.score - a.score || a.teacher.name.localeCompare(b.teacher.name, 'es'),
    )
    .slice(0, limit)
    .map((entry) => entry.teacher)
}

export function findTeacherByParam(email: string | null, name: string | null): IinTeacher | null {
  if (email) {
    return TEACHERS.find((teacher) => teacher.email?.toLowerCase() === email.toLowerCase()) ?? null
  }
  if (name) {
    const normalized = name.trim().toLowerCase()
    return (
      TEACHERS.find((teacher) => teacher.name.toLowerCase() === normalized) ??
      TEACHERS.find((teacher) => teacher.name.toLowerCase().includes(normalized)) ??
      null
    )
  }
  return null
}

export function primaryCourseLabel(teacher: IinTeacher): string {
  const courses = uniqueCoursesForTeacher(teacher)
  const basic = courses.find((course) => getCourseBucket(course) === 'basic')
  if (basic) return basic
  const elective = courses.find((course) => getCourseBucket(course) === 'elective')
  if (elective) return getElectiveTopic(elective)
  return courses[0] ?? 'Docente IIN'
}

export function allIinTeachers(): IinTeacher[] {
  return TEACHERS
}
