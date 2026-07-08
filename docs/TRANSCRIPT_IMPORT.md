# Importación de notas finales (PDF)

## Flujo

1. El usuario sube un PDF de notas finales.
2. PoliPlan extrae texto en el dispositivo (`extractTextFromPdfFile`).
3. `parseTranscriptText` genera filas candidatas.
4. Cada fila se compara contra el plan (`matchCourseToCatalog`).
5. El usuario revisa coincidencias, notas y advertencias.
6. Al confirmar, se crean `AcademicAttempt` con `source: pdf_import`.
7. El archivo original se descarta.

## Estados de coincidencia

| Estado | Significado |
|--------|-------------|
| `exact` | Nombre normalizado coincide con el catálogo |
| `probable` | Coincidencia parcial por tokens |
| `none` | Sin materia del plan |
| `duplicate` | Fila repetida exacta |
| `repeated_attempt` | Misma materia, otra fecha/nota |

## Intentos repetidos

Una misma materia puede generar varias filas (por ejemplo, nota 1 y luego nota 3). Todas se conservan. El estado derivado de la materia será `passed` si algún intento aprueba.

## Datos extraídos

- Semestre (por encabezado del PDF)
- Fecha de examen
- Número de acta
- Puntaje
- Nota final
- Promedio general (si aparece)

## Privacidad

- No persistir cédula ni PDF original.
- Permitir ignorar filas en la revisión.
- Explicar al usuario que el procesamiento es local.

## Archivos relevantes

- `src/utils/transcriptParser.ts`
- `src/utils/courseMatching.ts`
- `src/components/progress/PdfImportFlow.tsx`
- `src/repositories/AcademicHistoryRepository.ts`
