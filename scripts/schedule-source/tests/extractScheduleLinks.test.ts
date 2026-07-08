import { describe, expect, it } from 'vitest'
import { extractScheduleLinks, selectBestScheduleLink } from '../extractScheduleLinks'

const html = `
<!doctype html>
<html>
  <body>
    <article>
      <a href="https://example.com/manual.pdf">Manual</a>
      <a href="https://drive.google.com/drive/folders/abc123">Horario de clases y exámenes Primer Periodo 2026 –</a>
      <a href="https://example.com/otros.xlsx">Otros</a>
    </article>
    <table>
      <tr role="row" data-id="file-1"><td><strong>Horario de clases y examenes Primer Periodo 2026 06072026.xlsx</strong></td></tr>
    </table>
  </body>
</html>
`

describe('extractScheduleLinks', () => {
  it('detecta enlaces y filas de Google Drive', () => {
    const links = extractScheduleLinks(html, 'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/')
    expect(links.length).toBeGreaterThanOrEqual(2)
    expect(links.some((link) => link.kind === 'drive-folder')).toBe(true)
    expect(links.some((link) => link.kind === 'drive-file')).toBe(true)
  })

  it('elige el enlace más probable', () => {
    const links = extractScheduleLinks(html, 'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/')
    const selection = selectBestScheduleLink(links)
    expect(selection.candidate).not.toBeNull()
    expect(selection.candidate?.kind).toBe('drive-file')
  })

  it('prefiere la carpeta Drive en la página oficial sin filas expandidas', () => {
    const officialHtml = `
      <!doctype html>
      <html>
        <body>
          <article>
            <a href="https://drive.google.com/drive/folders/abc123">Horario de clases y exámenes Primer Periodo 2026 –</a>
            <a href="https://example.com/otros.xlsx">Otros</a>
          </article>
        </body>
      </html>
    `
    const links = extractScheduleLinks(officialHtml, 'https://www.pol.una.py/academico/horarios-de-clases-y-examenes/')
    const selection = selectBestScheduleLink(links)
    expect(selection.candidate).not.toBeNull()
    expect(selection.candidate?.kind).toBe('drive-folder')
  })
})
