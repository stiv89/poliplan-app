# Base de datos Supabase

## Tablas oficiales (lectura pública)

- `academic_periods`
- `careers`
- `courses`
- `sections`
- `class_meetings`
- `exams`
- `schedule_versions` (sólo filas con `is_active = true`)

Estas tablas tienen RLS habilitado y políticas de **SELECT** público. No existen políticas de INSERT/UPDATE/DELETE para usuarios anónimos o autenticados. Los cambios oficiales deben hacerse con procesos administrativos usando `service_role` fuera del frontend.

## Tablas personales

- `profiles`
- `user_schedules`
- `user_schedule_sections`

Políticas: cada usuario autenticado sólo puede leer, crear, actualizar y eliminar **sus propios** registros (`auth.uid()`).

## Tablas administrativas restringidas

- `schedule_imports`

No tiene políticas públicas. Sólo procesos backend con `service_role` pueden operarla.

## Índices

- `sections.academic_period_id`
- `sections.course_id`
- `class_meetings.section_id`
- `courses.career_id`
- `user_schedules.user_id`
- `schedule_versions.academic_period_id`
- `schedule_versions.is_active`

## IndexedDB local

Ver `src/db/database.ts` para el espejo offline:

- `cachedAcademicPeriods`, `cachedCareers`, `cachedCourses`, `cachedSections`, `cachedMeetings`, `cachedExams`
- `selectedSections`, `settings`, `localScheduleVersions`, `syncQueue`

## Migraciones

Aplicar con Supabase CLI:

```bash
supabase db push
```

Archivo inicial: `supabase/migrations/20260707120000_initial_schema.sql`
