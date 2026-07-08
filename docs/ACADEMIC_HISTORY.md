# Historial académico

## Modelo

PoliPlan separa cuatro capas:

1. **Plan de estudios** (`Curriculum`, `CurriculumCourse`) — catálogo oficial o normalizado por carrera.
2. **Intentos** (`AcademicAttempt`) — cada examen o registro manual, con fuente y metadatos.
3. **Estado derivado** (`StudentCourseStatus`) — calculado a partir de los intentos.
4. **Perfil de progreso** (`AcademicProfile`, `ProgressSummary`) — agregados para la UI.

No se guarda una sola nota por materia. Los intentos son la fuente de verdad.

## Aprobación

Las reglas viven en `src/utils/academicApproval.ts`:

- Notas 2, 3, 4 y 5 → aprobada.
- Nota 1 → reprobada.
- Una materia se considera aprobada si existe al menos un intento aprobado.

## Electivas y optativas

El plan define slots (`Electiva 1`, `Optativa 2`, etc.). El historial puede registrar el nombre específico cursado en `specificElectiveName` sin perder el slot del plan.

## Extensión universitaria

Las actividades de extensión se modelan como `type: extension` y no requieren nota numérica.

## Privacidad

- El PDF se procesa localmente en el dispositivo.
- No se persiste el archivo original por defecto.
- No se almacena la cédula del documento.
- Solo se guardan filas confirmadas por el usuario.

## Límites actuales

- **No hay correlativas** ni validación de habilitación académica.
- “Pendiente” = está en el plan y no figura como aprobada en el historial.
- No se bloquea la inscripción a secciones desde el horario.

## Extensión futura

Puntos preparados para una fase posterior:

- `CurriculumCourse` puede incorporar `prerequisites[]`.
- `StudentCourseStatus` puede derivar `eligible` sin reemplazar `not_taken`.
- Sincronización en la nube vía Supabase (tablas dedicadas).
