# Progreso de carrera

## Pantalla `/progreso`

Muestra el avance del estudiante comparando su historial con el plan de estudios activo.

## Métricas

| Métrica | Cálculo |
|---------|---------|
| Materias aprobadas | Cursos del plan con estado `passed` |
| Pendientes | Cursos del plan sin aprobación registrada |
| Créditos | Suma de `credits` de materias aprobadas |
| Porcentaje | Aprobadas / total del plan |
| Promedio | Importado del PDF o calculado desde intentos aprobados |
| Semestres completos | Todos los cursos obligatorios del semestre aprobados |

## Vistas

- **Resumen** — tarjetas con totales.
- **Por semestre** — checklist por cuatrimestre.
- **Aprobadas** — listado de materias con nota si existe.
- **Pendientes** — materias del plan sin aprobación (sin correlativas).
- **Intentos** — historial completo por materia.

## Aclaración al usuario

Siempre visible:

> Las materias pendientes se calculan comparando tu historial con el plan de estudios. PoliPlan todavía no valida correlativas ni habilitación académica.

## Formas de cargar historial

1. PDF de notas finales (con revisión).
2. Selección de semestre completo (sin inventar notas).
3. Selección individual con búsqueda.

## Relación con el horario

El módulo de progreso **no bloquea** la selección de secciones. El horario y el historial son independientes en esta versión.

## Archivos relevantes

- `src/pages/ProgressPage.tsx`
- `src/utils/progress.ts`
- `src/hooks/useAcademicHistory.ts`
