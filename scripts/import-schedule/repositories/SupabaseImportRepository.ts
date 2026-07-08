import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  NormalizedImportBundle,
  ScheduleImportRepository,
} from '../types'
import {
  buildTeacherRecords,
  resolveTeacherIdForSection,
  teacherMapKey,
} from '../normalizers/TeacherResolver'

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos. Creá .env.admin desde .env.admin.example',
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function batchInsert<T extends Record<string, unknown>>(
  client: SupabaseClient,
  table: string,
  rows: T[],
  batchSize = 400,
): Promise<void> {
  for (let index = 0; index < rows.length; index += batchSize) {
    const chunk = rows.slice(index, index + batchSize)
    const { error } = await client.from(table).insert(chunk)
    if (error) {
      throw new Error(`${table} batch ${index / batchSize + 1}: ${error.message}`)
    }
  }
}

export class SupabaseImportRepository implements ScheduleImportRepository {
  private client = getAdminClient()

  async findExistingChecksum(checksum: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('schedule_versions')
      .select('id')
      .eq('source_checksum', checksum)
      .eq('import_status', 'success')
      .maybeSingle()

    if (error) {
      throw error
    }

    return Boolean(data)
  }

  async getLatestVersionNumber(academicPeriodId: string): Promise<number> {
    const { data, error } = await this.client
      .from('schedule_versions')
      .select('version')
      .eq('academic_period_id', academicPeriodId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data?.version ?? 0
  }

  async getCurrentCounts(academicPeriodId: string): Promise<{
    courses: number
    sections: number
  }> {
    const version = await this.getActiveVersion(academicPeriodId)
    if (!version) {
      return { courses: 0, sections: 0 }
    }

    const { data: sectionRows, count, error } = await this.client
      .from('sections')
      .select('course_id', { count: 'exact' })
      .eq('academic_period_id', academicPeriodId)
      .eq('schedule_version_id', version.id)

    if (error) {
      throw error
    }

    const uniqueCourses = new Set((sectionRows ?? []).map((row) => row.course_id))

    return {
      courses: uniqueCourses.size,
      sections: count ?? 0,
    }
  }

  async importBundle(input: {
    academicPeriodId: string
    checksum: string
    fileName: string
    bundle: NormalizedImportBundle
  }): Promise<{ version: number; importId: string }> {
    const nextVersion = (await this.getLatestVersionNumber(input.academicPeriodId)) + 1

    const { data: importRow, error: importError } = await this.client
      .from('schedule_imports')
      .insert({
        source_url: input.fileName,
        file_name: input.fileName,
        checksum: input.checksum,
        status: 'processing',
      })
      .select('id')
      .single()

    if (importError) {
      throw importError
    }

    const { data: versionRow, error: versionError } = await this.client
      .from('schedule_versions')
      .insert({
        academic_period_id: input.academicPeriodId,
        version: nextVersion,
        source_file_name: input.fileName,
        source_checksum: input.checksum,
        imported_at: new Date().toISOString(),
        is_active: false,
        import_status: 'processing',
      })
      .select('id')
      .single()

    if (versionError) {
      throw versionError
    }

    try {
      await this.client.from('careers').upsert(
        input.bundle.careers.map((career) => ({
          id: career.id,
          code: career.code,
          name: career.name,
          faculty: career.faculty,
          campus: career.campus,
        })),
        { onConflict: 'code' },
      )

      await this.client.from('courses').upsert(
        input.bundle.courses.map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
          career_id: course.careerId,
          level: course.level,
          semester: course.semester,
        })),
        { onConflict: 'id' },
      )

      const teacherKeyToId = await this.ensureTeacherIds(input.bundle.sections)

      await batchInsert(
        this.client,
        'sections',
        input.bundle.sections.map((section) => ({
          id: section.id,
          academic_period_id: input.academicPeriodId,
          schedule_version_id: versionRow.id,
          course_id: section.courseId,
          section_code: section.sectionCode,
          shift: section.shift,
          teacher_name: section.teacherName,
          teacher_email: section.teacherEmail,
          teacher_id: resolveTeacherIdForSection(
            teacherKeyToId,
            section.teacherName,
            section.teacherEmail,
          ),
        })),
      )

      await batchInsert(
        this.client,
        'class_meetings',
        input.bundle.meetings.map((meeting) => ({
          id: meeting.id,
          section_id: meeting.sectionId,
          day_of_week: meeting.dayOfWeek,
          start_time: meeting.startTime,
          end_time: meeting.endTime,
          classroom: meeting.classroom,
          special_dates: meeting.specialDates,
        })),
      )

      await batchInsert(
        this.client,
        'exams',
        input.bundle.exams.map((exam) => ({
          id: exam.id,
          section_id: exam.sectionId,
          exam_type: exam.examType,
          exam_date: exam.examDate,
          start_time: exam.startTime,
          end_time: exam.endTime,
          classroom: exam.classroom,
        })),
      )

      const { count: sectionCount, error: countError } = await this.client
        .from('sections')
        .select('*', { count: 'exact', head: true })
        .eq('schedule_version_id', versionRow.id)

      if (countError) {
        throw countError
      }

      if ((sectionCount ?? 0) < input.bundle.sections.length * 0.9) {
        throw new Error(
          `Validación final fallida: se insertaron ${sectionCount} secciones de ${input.bundle.sections.length}`,
        )
      }

      const { error: activateError } = await this.client.rpc('poliplan_activate_schedule_version', {
        p_academic_period_id: input.academicPeriodId,
        p_version_id: versionRow.id,
        p_import_id: importRow.id,
      })

      if (activateError) {
        throw activateError
      }

      try {
        const { notifyScheduleUpdate } = await import('../../email/notifyScheduleUpdate.ts')
        const notifyResult = await notifyScheduleUpdate({ periodId: input.academicPeriodId })
        if (notifyResult && notifyResult.sent > 0) {
          console.log(
            `  ✉ Avisos de horario enviados: ${notifyResult.sent}/${notifyResult.recipients}`,
          )
        }
      } catch (notifyError) {
        console.warn(
          '  ⚠ No se pudieron enviar avisos por correo:',
          notifyError instanceof Error ? notifyError.message : notifyError,
        )
      }

      return { version: nextVersion, importId: importRow.id }
    } catch (error) {
      await this.client
        .from('schedule_imports')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
        })
        .eq('id', importRow.id)

      await this.client
        .from('schedule_versions')
        .update({
          import_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          is_active: false,
        })
        .eq('id', versionRow.id)

      await this.client.from('exams').delete().in(
        'section_id',
        input.bundle.sections.map((section) => section.id),
      )
      await this.client.from('class_meetings').delete().in(
        'section_id',
        input.bundle.sections.map((section) => section.id),
      )
      await this.client.from('sections').delete().eq('schedule_version_id', versionRow.id)

      throw error
    }
  }

  private async getActiveVersion(academicPeriodId: string) {
    const { data, error } = await this.client
      .from('schedule_versions')
      .select('id, version')
      .eq('academic_period_id', academicPeriodId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      throw error
    }

    return data
  }

  private async ensureTeacherIds(
    sections: NormalizedImportBundle['sections'],
  ): Promise<Map<string, string>> {
    const records = buildTeacherRecords(sections)
    const keyToId = new Map<string, string>()

    for (const record of records) {
      const key = teacherMapKey(record.name, record.email)
      if (!key || keyToId.has(key)) continue

      const { data, error } = await this.client.rpc('resolve_teacher', {
        p_name: record.name,
        p_email: record.email,
      })

      if (error) {
        throw error
      }

      if (data) {
        keyToId.set(key, String(data))
      }
    }

    return keyToId
  }
}

export class NoopImportRepository implements ScheduleImportRepository {
  async findExistingChecksum(): Promise<boolean> {
    return false
  }

  async getLatestVersionNumber(): Promise<number> {
    return 0
  }

  async getCurrentCounts(): Promise<{ courses: number; sections: number }> {
    return { courses: 0, sections: 0 }
  }

  async importBundle(): Promise<{ version: number; importId: string }> {
    throw new Error('Importación deshabilitada en dry-run')
  }
}
