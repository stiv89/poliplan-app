import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/db/database'
import { LocalScheduleRepository } from '@/repositories/LocalScheduleRepository'
import type { SampleScheduleBundle } from '@/types/academic'

const sampleBundle = {
  academicPeriods: [
    {
      id: '11111111-1111-4111-8111-111111111101',
      name: 'Primer Periodo 2026',
      year: 2026,
      term: 1,
      startsAt: '2026-03-01',
      endsAt: '2026-07-15',
      isActive: true,
    },
  ],
  careers: [
    {
      id: '22222222-2222-4222-8222-222222222201',
      code: 'INF',
      name: 'Ingeniería Informática',
      faculty: 'Facultad Politécnica',
      campus: 'San Lorenzo',
    },
  ],
  courses: [
    {
      id: '33333333-3333-4333-8333-333333333301',
      code: 'INF101',
      name: 'Programación I',
      careerId: '22222222-2222-4222-8222-222222222201',
      level: 1,
      semester: 1,
    },
  ],
  sections: [
    {
      id: '44444444-4444-4444-8444-444444444401',
      courseId: '33333333-3333-4333-8333-333333333301',
      academicPeriodId: '11111111-1111-4111-8111-111111111101',
      sectionCode: 'A',
      shift: 'Mañana',
    teacherName: 'Prof. Ana Ríos',
    teacherEmail: null,
    teacherId: null,
      meetings: [
        {
          id: '55555555-5555-4555-8555-555555555501',
          sectionId: '44444444-4444-4444-8444-444444444401',
          dayOfWeek: 1,
          startTime: '08:00:00',
          endTime: '10:00:00',
          classroom: 'Aula 101',
          specialDates: null,
        },
      ],
      exams: [],
    },
  ],
  scheduleVersions: [],
} satisfies SampleScheduleBundle

describe('LocalScheduleRepository', () => {
  const repository = new LocalScheduleRepository()

  beforeEach(async () => {
    await db.transaction(
      'rw',
      db.tables.map((table) => table.name),
      async () => {
        await Promise.all(db.tables.map((table) => table.clear()))
      },
    )
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => sampleBundle,
      }),
    )
  })

  it('carga datos de muestra y expone periodos académicos', async () => {
    const periods = await repository.getAcademicPeriods()
    expect(periods.length).toBeGreaterThanOrEqual(1)
    expect(periods.some((period) => period.isActive)).toBe(true)
  })

  it('restaura secciones seleccionadas', async () => {
    const bundle = sampleBundle as SampleScheduleBundle
    const periodId = bundle.academicPeriods[0]?.id
    const section = bundle.sections[0]

    expect(periodId).toBeTruthy()
    expect(section).toBeTruthy()

    await repository.saveBundle(bundle)
    const schedule = await repository.ensureDefaultSchedule(periodId!)
    await repository.addSelectedSection({
      scheduleId: schedule.id,
      sectionId: section!.id,
      courseId: section!.courseId,
      academicPeriodId: periodId!,
    })

    const selected = await repository.getSelectedSectionEntities(schedule.id)
    expect(selected).toHaveLength(1)
    expect(selected[0]?.id).toBe(section!.id)
  })

  it('resuelve horarios distintos por periodo', async () => {
    const periodA = '11111111-1111-4111-8111-111111111101'
    const periodB = '11111111-1111-4111-8111-111111111102'

    const scheduleA = await repository.ensureDefaultSchedule(periodA)
    const scheduleB = await repository.ensureDefaultSchedule(periodB)

    expect(scheduleA.id).not.toBe(scheduleB.id)
    expect(scheduleA.academicPeriodId).toBe(periodA)
    expect(scheduleB.academicPeriodId).toBe(periodB)
  })

  it('elimina selecciones de otro periodo al cargar un horario', async () => {
    const bundle = sampleBundle as SampleScheduleBundle
    const periodId = bundle.academicPeriods[0]?.id
    const section = bundle.sections[0]
    const otherPeriodId = '11111111-1111-4111-8111-111111111102'

    expect(periodId).toBeTruthy()
    expect(section).toBeTruthy()

    await repository.saveBundle(bundle)
    const schedule = await repository.ensureDefaultSchedule(periodId!)
    await repository.addSelectedSection({
      scheduleId: schedule.id,
      sectionId: section!.id,
      courseId: section!.courseId,
      academicPeriodId: otherPeriodId,
    })

    const selected = await repository.getSelectedSectionEntities(schedule.id)
    expect(selected).toHaveLength(0)

    const remaining = await repository.getSelectedSections(schedule.id)
    expect(remaining).toHaveLength(0)
  })
})
