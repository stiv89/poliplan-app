import { describe, expect, it } from 'vitest'
import type { AcademicPeriod } from '@/types/academic'
import {
  buildScheduleHeaderSubtitle,
  formatCareerDisplayLabel,
  formatCompactPeriodLabel,
  formatScheduleHeaderTitle,
} from '@/utils/scheduleHeader'

const period: AcademicPeriod = {
  id: 'p1',
  name: 'Primer Periodo 2026',
  year: 2026,
  term: 1,
  startsAt: null,
  endsAt: null,
  isActive: true,
}

describe('scheduleHeader', () => {
  it('normaliza el título por defecto a Horario', () => {
    expect(formatScheduleHeaderTitle('Mi horario')).toBe('Horario')
    expect(formatScheduleHeaderTitle('Horario')).toBe('Horario')
    expect(formatScheduleHeaderTitle('Plan A')).toBe('Plan A')
  })

  it('compacta el periodo académico', () => {
    expect(formatCompactPeriodLabel(period)).toBe('1.er periodo 2026')
  })

  it('muestra sigla y nombre de la carrera', () => {
    expect(
      formatCareerDisplayLabel({
        code: 'IIN',
        name: 'Ingeniería Informática',
      }),
    ).toBe('IIN · Ingeniería Informática')
  })

  it('arma el subtítulo del encabezado', () => {
    expect(buildScheduleHeaderSubtitle('IIN', period, null)).toBe(
      'IIN · 1.er periodo 2026',
    )
    expect(buildScheduleHeaderSubtitle('IIN', null, 'Primer Periodo 2026')).toBe(
      'IIN · 1.er periodo 2026',
    )
  })
})
