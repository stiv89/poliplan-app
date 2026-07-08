# Importador de horarios

Este documento describe el flujo futuro para importar el Excel institucional desde procesos administrativos.

Fuente oficial prevista: https://www.pol.una.py/academico/horarios-de-clases-y-examenes/

## Detección de nueva versión

1. Consultar la página oficial o un endpoint estable.
2. Identificar el archivo publicado (nombre y fecha).
3. Descargar el Excel.
4. Calcular checksum SHA-256 del archivo.
5. Comparar con `schedule_versions.source_checksum`.
6. Importar sólo si el checksum o la versión cambió.

## Cálculo de checksum

```typescript
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'

const content = await readFile(filePath)
const checksum = createHash('sha256').update(content).digest('hex')
```

Implementado en `scripts/import-schedule/index.ts`.

## Evitar importar dos veces el mismo archivo

- Guardar `source_checksum` en `schedule_versions`.
- Registrar cada intento en `schedule_imports`.
- Abortar si el checksum ya existe para una versión activa o en progreso exitoso.

## Validación de hojas y columnas

- Verificar hojas requeridas antes de parsear.
- Validar columnas obligatorias: materia, sección, día, hora inicio/fin.
- Rechazar filas inválidas y registrar errores en `schedule_imports.errors`.

Interfaces preparadas:

- `ExcelScheduleParser`
- `ScheduleNormalizer`
- `ScheduleValidator`
- `ScheduleImporter`

## Conservar versión anterior si falla

1. Insertar nueva fila en `schedule_versions` con `is_active = false`.
2. Ejecutar importación en transacción.
3. Si falla, marcar `import_status = 'failed'` y mantener activa la versión previa.

## Activar versión sólo tras importación exitosa

1. Completar inserción de periodos, materias, secciones, reuniones y exámenes.
2. Desactivar versiones anteriores del mismo periodo.
3. Marcar la nueva versión con `is_active = true` e `import_status = 'success'`.

## Comando futuro

```bash
npm run import:schedule -- ./archivo.xlsx
```

## GitHub Actions (ejemplo manual)

Ver `.github/workflows/check-schedule.yml`. Usa `workflow_dispatch` y secrets administrativos (`SUPABASE_SERVICE_ROLE_KEY`). Nunca expongas esas credenciales en el frontend.
