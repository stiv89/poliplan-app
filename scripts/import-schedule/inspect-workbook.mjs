import { readFileSync } from 'node:fs'
import XLSX from 'xlsx'

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('Usage: node inspect-workbook.mjs <file1> [file2...]')
  process.exit(1)
}

const HEADER_ALIASES = [
  'asignatura',
  'materia',
  'carrera',
  'nivel',
  'semestre',
  'turno',
  'seccion',
  'docente',
  'correo',
  'aula',
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
  'sabado',
  'examen',
  'primera final',
  'segunda final',
  'fecha',
  'hora',
]

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function cellToDisplay(value) {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(value).replace(/\s+/g, ' ').trim()
}

function scoreHeaderRow(row) {
  const texts = row.map((cell) => normalizeText(cellToDisplay(cell))).filter(Boolean)
  let score = 0
  for (const text of texts) {
    for (const alias of HEADER_ALIASES) {
      if (text.includes(alias)) score += 1
    }
  }
  return { score, texts }
}

function inspectFile(filePath) {
  const buffer = readFileSync(filePath)
  const workbook = XLSX.read(buffer, {
    type: 'buffer',
    cellDates: true,
    dense: true,
  })

  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name]
    const ref = sheet['!ref'] ?? 'A1:A1'
    const range = XLSX.utils.decode_range(ref)
    const rows = Math.max(0, range.e.r - range.s.r + 1)
    const cols = Math.max(0, range.e.c - range.s.c + 1)

    const matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
      raw: true,
    })

    const headerCandidates = matrix.slice(0, 25).map((row, index) => {
      const { score, texts } = scoreHeaderRow(row)
      return { rowIndex: index + 1, score, sample: texts.slice(0, 20) }
    })

    headerCandidates.sort((a, b) => b.score - a.score)
    const best = headerCandidates[0] ?? { rowIndex: null, score: 0, sample: [] }

    const previewRows = matrix.slice(best.rowIndex ? best.rowIndex - 1 : 0, (best.rowIndex ?? 1) + 3)

    return {
      name,
      ref,
      rows,
      cols,
      mergedCells: sheet['!merges']?.length ?? 0,
      bestHeaderRow: best.rowIndex,
      headerScore: best.score,
      headerSample: best.sample,
      previewAfterHeader: previewRows.map((row) =>
        (row ?? []).slice(0, 15).map((cell) => cellToDisplay(cell)).filter(Boolean),
      ),
    }
  })

  return {
    filePath,
    sizeBytes: buffer.length,
    sheetCount: workbook.SheetNames.length,
    sheetNames: workbook.SheetNames,
    sheets,
  }
}

for (const file of files) {
  console.log(JSON.stringify(inspectFile(file), null, 2))
  console.log('\n---\n')
}
