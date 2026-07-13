import { getSupabaseClient } from '@/lib/supabase'
import type {
  OpenTeacherProfileInput,
  Teacher,
  TeacherProfile,
  TeacherReview,
  TeacherSectionSummary,
} from '@/types/teacher'

const REVIEW_COLUMNS =
  'id, teacher_id, course_id, academic_period_id, body, rating, created_at'

function mapTeacher(row: Record<string, unknown>): Teacher {
  return {
    id: String(row.id),
    name: String(row.name),
    email: row.email ? String(row.email) : null,
  }
}

function mapReview(row: Record<string, unknown>): TeacherReview {
  return {
    id: String(row.id),
    teacherId: String(row.teacher_id),
    courseId: row.course_id ? String(row.course_id) : null,
    academicPeriodId: row.academic_period_id ? String(row.academic_period_id) : null,
    body: String(row.body),
    rating: Number(row.rating),
    createdAt: String(row.created_at),
  }
}

function mapSection(row: Record<string, unknown>): TeacherSectionSummary {
  const course = row.courses as Record<string, unknown> | null
  return {
    sectionId: String(row.id),
    sectionCode: String(row.section_code),
    courseId: String(row.course_id),
    courseName: course ? String(course.name) : 'Materia',
    courseCode: course?.code ? String(course.code) : null,
    academicPeriodId: String(row.academic_period_id),
  }
}

export async function resolveTeacherId(input: OpenTeacherProfileInput): Promise<string | null> {
  if (input.teacherId) return input.teacherId

  const client = getSupabaseClient()
  if (!client) return null

  const name = input.teacherName?.trim() ?? ''
  const email = input.teacherEmail?.trim().toLowerCase() ?? ''
  if (!name && !email) return null

  const { data, error } = await client.rpc('resolve_teacher', {
    p_name: name || null,
    p_email: email || null,
  })

  if (error) {
    throw error
  }

  return data ? String(data) : null
}

export async function fetchTeacherProfile(
  teacherId: string,
  academicPeriodId?: string | null,
): Promise<TeacherProfile> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase no está configurado')
  }

  const { data: teacherRow, error: teacherError } = await client
    .from('teachers')
    .select('id, name, email')
    .eq('id', teacherId)
    .maybeSingle()

  if (teacherError) throw teacherError
  if (!teacherRow) throw new Error('Docente no encontrado')

  let sectionsQuery = client
    .from('sections')
    .select('id, section_code, course_id, academic_period_id, courses(name, code)')
    .eq('teacher_id', teacherId)

  if (academicPeriodId) {
    sectionsQuery = sectionsQuery.eq('academic_period_id', academicPeriodId)
  }

  const { data: sectionRows, error: sectionsError } = await sectionsQuery
  if (sectionsError) throw sectionsError

  let reviewsQuery = client
    .from('teacher_reviews')
    .select(REVIEW_COLUMNS)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (academicPeriodId) {
    reviewsQuery = reviewsQuery.or(
      `academic_period_id.eq.${academicPeriodId},academic_period_id.is.null`,
    )
  }

  const { data: reviewRows, error: reviewsError } = await reviewsQuery
  if (reviewsError) throw reviewsError

  const reviews = (reviewRows ?? []).map((row) => mapReview(row as Record<string, unknown>))
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : null

  return {
    teacher: mapTeacher(teacherRow as Record<string, unknown>),
    sections: (sectionRows ?? []).map((row) => mapSection(row as Record<string, unknown>)),
    reviews,
    averageRating,
    reviewCount: reviews.length,
  }
}

export async function submitTeacherReview(input: {
  teacherId: string
  courseId?: string | null
  academicPeriodId?: string | null
  body: string
  rating: number
  authorId: string
}): Promise<TeacherReview> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase no está configurado')
  }

  const { data, error } = await client
    .from('teacher_reviews')
    .insert({
      teacher_id: input.teacherId,
      course_id: input.courseId ?? null,
      academic_period_id: input.academicPeriodId ?? null,
      author_id: input.authorId,
      body: input.body.trim(),
      rating: input.rating,
    })
    .select(REVIEW_COLUMNS)
    .single()

  if (error) throw error
  return mapReview(data as Record<string, unknown>)
}

export async function submitPublicTeacherReview(input: {
  teacherId: string
  courseId?: string | null
  academicPeriodId?: string | null
  body: string
  rating: number
  clientToken: string
}): Promise<TeacherReview> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase no está configurado')
  }

  const { data, error } = await client.rpc('submit_public_teacher_review', {
    p_teacher_id: input.teacherId,
    p_body: input.body.trim(),
    p_rating: input.rating,
    p_client_token: input.clientToken,
    p_course_id: input.courseId ?? null,
    p_academic_period_id: input.academicPeriodId ?? null,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('No se pudo publicar la reseña.')
  }

  return mapReview(row as Record<string, unknown>)
}

export async function reportTeacherReview(input: {
  reviewId: string
  reporterId: string
  reason: string
}): Promise<void> {
  const client = getSupabaseClient()
  if (!client) {
    throw new Error('Supabase no está configurado')
  }

  const { error } = await client.from('teacher_review_reports').insert({
    review_id: input.reviewId,
    reporter_id: input.reporterId,
    reason: input.reason.trim(),
  })

  if (error) throw error
}
