#!/usr/bin/env node
/**
 * Script: import:grading-scale
 * Extrae la escala de notas del PDF oficial de la FP-UNA y genera un JSON
 * validado con exactamente 2601 combinaciones.
 *
 * Uso:
 *   npm run import:grading-scale -- "/ruta/al/EscalaDeNotasPolitecnica.pdf"
 *
 * Salida:
 *   src/data/grading-scales/fpuna-default-scale.json
 *   reports/grading-scale-import-<timestamp>.json
 */

import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = join(__dirname, '..')

// ─── Verificar pdfplumber disponible via Python ──────────────────────────────

import { execSync } from 'node:child_process'

const pdfPath = process.argv[2]

if (!pdfPath) {
  console.error('Error: falta el argumento de la ruta del PDF.')
  console.error('Uso: npm run import:grading-scale -- "/ruta/al/EscalaDeNotasPolitecnica.pdf"')
  process.exit(1)
}

if (!existsSync(pdfPath)) {
  console.error(`Error: no se encontró el archivo: ${pdfPath}`)
  process.exit(1)
}

// Calcular checksum del PDF
const pdfBuffer = readFileSync(pdfPath)
const sourceChecksum = createHash('sha256').update(pdfBuffer).digest('hex')
console.log(`\n📄 PDF: ${pdfPath}`)
console.log(`🔑 SHA-256: ${sourceChecksum}`)

// ─── Extraer con Python (pdfplumber) ────────────────────────────────────────

const pythonScript = `
import pdfplumber, json, sys

pdf_path = sys.argv[1]
entries = []
errors = []
ambiguous = []

with pdfplumber.open(pdf_path) as pdf:
    page = pdf.pages[0]
    text = page.extract_text()
    lines = text.strip().split('\\n')

# EF header
tokens = lines[0].split()
ef_values = [int(t) for t in tokens if t.isdigit() and 50 <= int(t) <= 100]

data_lines = lines[2:53]

for line in data_lines:
    parts = line.split()
    if not parts:
        continue
    try:
        pp = int(parts[0])
    except ValueError:
        errors.append(f"No se pudo leer PP de linea: {line}")
        continue
    grades = parts[1:]
    if len(grades) != 51:
        errors.append(f"PP={pp}: se esperaban 51 notas, se encontraron {len(grades)}")
        continue
    for i, g_str in enumerate(grades):
        ef = ef_values[i]
        try:
            grade = int(g_str)
            if grade not in (1,2,3,4,5):
                errors.append(f"PP={pp},EF={ef}: nota fuera de rango: {grade}")
            else:
                entries.append({"pp":pp,"ef":ef,"grade":grade})
        except ValueError:
            ambiguous.append({"pp":pp,"ef":ef,"raw":g_str})

print(json.dumps({"entries":entries,"errors":errors,"ambiguous":ambiguous}))
`

let extracted
try {
  const output = execSync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'  "${pdfPath}"`, {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  })
  extracted = JSON.parse(output)
} catch (err) {
  console.error('Error al ejecutar Python/pdfplumber:', err.message)
  console.error('Instalá pdfplumber: pip install pdfplumber')
  process.exit(1)
}

const { entries, errors, ambiguous } = extracted

// ─── Validación ──────────────────────────────────────────────────────────────

const report = {
  sourceFile: pdfPath.split('/').pop(),
  sourceChecksum,
  extractedAt: new Date().toISOString(),
  totalEntries: entries.length,
  errors: errors.length,
  ambiguous: ambiguous.length,
  details: { errors, ambiguous },
  validation: {},
}

const allPP = [...new Set(entries.map((e) => e.pp))].sort((a, b) => a - b)
const allEF = [...new Set(entries.map((e) => e.ef))].sort((a, b) => a - b)

report.validation = {
  ppCount: allPP.length,
  ppMin: Math.min(...allPP),
  ppMax: Math.max(...allPP),
  efCount: allEF.length,
  efMin: Math.min(...allEF),
  efMax: Math.max(...allEF),
  expectedCombinations: 2601,
  actualCombinations: entries.length,
  gradeDistribution: {},
}

const gradeDist = {}
for (const e of entries) {
  gradeDist[e.grade] = (gradeDist[e.grade] ?? 0) + 1
}
report.validation.gradeDistribution = gradeDist

// Detectar duplicados
const seen = new Set()
const dupes = []
for (const e of entries) {
  const key = `${e.pp}:${e.ef}`
  if (seen.has(key)) dupes.push(key)
  seen.add(key)
}
report.validation.duplicates = dupes.length

// Detectar faltantes
const missing = []
for (let pp = 50; pp <= 100; pp++) {
  for (let ef = 50; ef <= 100; ef++) {
    if (!seen.has(`${pp}:${ef}`)) missing.push({ pp, ef })
  }
}
report.validation.missing = missing.length

// ─── Informe de estado ───────────────────────────────────────────────────────

console.log('\n📊 Validación:')
console.log(`  PP: ${report.validation.ppMin}-${report.validation.ppMax} (${report.validation.ppCount} valores)`)
console.log(`  EF: ${report.validation.efMin}-${report.validation.efMax} (${report.validation.efCount} valores)`)
console.log(`  Combinaciones: ${entries.length} (esperadas: 2601)`)
console.log(`  Duplicados: ${dupes.length}`)
console.log(`  Faltantes: ${missing.length}`)
console.log(`  Ambiguas: ${ambiguous.length}`)
console.log(`  Errores: ${errors.length}`)
console.log(`  Distribución: ${JSON.stringify(gradeDist)}`)

const hasCriticalErrors =
  entries.length !== 2601 ||
  dupes.length > 0 ||
  missing.length > 0 ||
  errors.length > 0 ||
  ambiguous.length > 0

if (hasCriticalErrors) {
  console.error('\n❌ Errores críticos detectados. No se generará el JSON.')
  if (errors.length) console.error('  Errores de parsing:', errors.slice(0, 5))
  if (ambiguous.length) console.error('  Celdas ambiguas:', ambiguous.slice(0, 5))
  if (missing.length) console.error('  Combinaciones faltantes:', missing.slice(0, 5))
  if (dupes.length) console.error('  Duplicados:', dupes.slice(0, 5))
  saveReport(report, false)
  process.exit(1)
}

// ─── Generar JSON ─────────────────────────────────────────────────────────────

const scale = {
  id: 'fpuna-pol-scale',
  institution: 'Facultad Politécnica - Universidad Nacional de Asunción',
  name: 'Escala de notas',
  sourceFile: pdfPath.split('/').pop(),
  sourceChecksum,
  extractedAt: new Date().toISOString(),
  ppRange: { min: 50, max: 100, step: 1 },
  efRange: { min: 50, max: 100, step: 1 },
  totalCombinations: entries.length,
  entries,
}

const outDir = join(PROJECT_ROOT, 'src', 'data', 'grading-scales')
mkdirSync(outDir, { recursive: true })
const outPath = join(outDir, 'fpuna-default-scale.json')
writeFileSync(outPath, JSON.stringify(scale, null, 2), 'utf8')

console.log(`\n✅ JSON generado: ${outPath}`)
console.log(`   ${entries.length} combinaciones, sin errores.`)

saveReport(report, true)

function saveReport(rep, success) {
  const reportsDir = join(PROJECT_ROOT, 'reports')
  mkdirSync(reportsDir, { recursive: true })
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const repPath = join(reportsDir, `grading-scale-import-${ts}.json`)
  writeFileSync(repPath, JSON.stringify({ success, ...rep }, null, 2), 'utf8')
  console.log(`📋 Reporte: ${repPath}`)
}
