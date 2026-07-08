# Importador de horarios PoliPlan

Este documento describe el importador Node.js que transforma los Excel institucionales de la Facultad Politécnica en datos normalizados para Supabase.

## Arquitectura

```text
Excel
  → LocalFileSource
  → WorkbookParser / SheetParser / HeaderDetector
  → WorkbookNormalizer
  → WorkbookValidator / ImportValidator
  → ImportService
  → (dry-run) reportes JSON / consola
  → (real) SupabaseImportRepository + poliplan_activate_schedule_version
```

## Formatos detectados

### Workbook

Ambos archivos reales contienen **21 hojas** con la misma estructura de nombres:

- **Carreras:** IAE, ICM, IEK, IEL, IEN, IIN, IMK, ISP, LCA, LCI, LCIk, LEL, LGH, TSE
- **Sedes:** Cnel. Oviedo, Villarrica
- **Metadatos ignorados:** Códigos, Asignaturas Homólogas-*

### Encabezados

Los horarios usan **dos filas de encabezado**:

- Fila superior: bloques (`ASIGNATURA`, `DOCENTE`, `1er. Parcial`, `Lunes`, etc.)
- Fila inferior: columnas concretas (`Item`, `Asignatura`, `Turno`, `Sección`, `Día`, `Hora`, `AULA`, ...)

Formatos soportados:

- `standard`: hojas principales (47 columnas aprox.)
- `villarrica`: variante con columnas de examen y días reducidas

### Columnas relevantes

- Materia: `Asignatura`
- Carrera: `Sigla carrera` / nombre de hoja
- Nivel, semestre/grupo, turno, sección
- Docente: título + apellido + nombre + correo
- Clases: columnas `Lunes` … `Sábado` con aula en columna adyacente
- Exámenes: `1er. Parcial`, `2do. Parcial`, `1er. Final`, revisiones, `2do. Final`, `Mesa Examinadora`

## Comandos

```bash
# Dry run completo
npm run import:schedule -- "./excel/archivo.xlsx" --dry-run --all-sheets --verbose

# Solo una hoja
npm run import:schedule -- "./excel/archivo.xlsx" --dry-run --sheet=IIN

# Exportar JSON normalizado
npm run import:schedule -- "./excel/archivo.xlsx" --dry-run --all-sheets \
  --output=./reports/normalized.json

# Importación real (requiere variables administrativas)
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
npm run import:schedule -- "./excel/archivo.xlsx" \
  --period-id=UUID --all-sheets
```

## Dry run

`--dry-run` no escribe en Supabase. Genera:

- checksum SHA-256
- hojas procesadas / ignoradas
- conteos de carreras, materias, secciones, reuniones y exámenes
- filas rechazadas, advertencias y duplicados
- reporte JSON en `reports/`

## Importación real

Proceso seguro:

1. Crear `schedule_imports` en estado `processing`
2. Crear `schedule_versions` con `is_active=false`
3. Upsert de carreras y materias
4. Insertar secciones, reuniones y exámenes del periodo
5. Validaciones finales
6. Activar versión con RPC `poliplan_activate_schedule_version`
7. Si falla: marcar importación como `failed` y conservar versión anterior

## Seguridad

Variables administrativas:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Reglas:

- solo en scripts Node o CI
- nunca en `src/`
- nunca con prefijo `VITE_`
- nunca commitear valores reales

## Versionado y rollback

El modelo actual relaciona `sections` con `academic_period_id`, no con `schedule_version_id`.

Impacto:

- al activar una versión, la RPC elimina secciones/reuniones/exámenes del periodo y deja activa la versión nueva
- evita mezclar versiones, pero no conserva histórico detallado por versión en tablas hijas

Antes de agregar `schedule_version_id` a todas las tablas académicas, evaluar migración y consumo en frontend.

Rollback manual:

1. Desactivar versión nueva
2. Reactivar versión anterior
3. Reimportar snapshot previo si hiciera falta

## Errores comunes

- `MIN_COURSES` / `MIN_SECTIONS`: pocos registros parseados
- `INVALID_SCHEDULE_TIME`: celda de día con texto no horario
- `INCOMPLETE_EXAM`: examen con fecha/hora parcial
- `DUPLICATE_SECTION`: sección repetida en el mismo archivo

## Ejemplos reales analizados

| Archivo | Checksum prefix | Secciones | Reuniones | Exámenes |
|---------|-----------------|-----------|-----------|----------|
| Primer Periodo 2026 | `aa2b8d98…` | 2088 | 3003 | 9309 |
| Segundo Periodo 2025 | `3cf7f724…` | 2211 | 3179 | 10085 |

Diferencias principales:

- Primer periodo: encabezado en fila 11; segundo periodo: fila 10
- Primer periodo pesa ~15.7 MB; segundo ~0.88 MB
- Contenido académico similar, con más secciones en el segundo archivo
