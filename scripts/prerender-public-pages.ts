import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CANONICAL_ORIGIN, APP_NOINDEX_PATHS, PUBLIC_SEO_PATHS } from '../src/config/seo'
import { buildAppDocumentHead, injectHeadIntoHtml, injectRootHtml } from '../src/seo/documentHead'
import { renderPublicPageHead, renderPublicPageHtml } from '../src/seo/prerender'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')

function distPathForRoute(path: string): string {
  return join(distDir, path.slice(1), 'index.html')
}

function prerenderPublicPages(spaTemplate: string): void {
  for (const path of PUBLIC_SEO_PATHS) {
    const bodyHtml = renderPublicPageHtml(path)
    const headHtml = renderPublicPageHead(path)
    let html = injectHeadIntoHtml(spaTemplate, headHtml)
    html = injectRootHtml(html, bodyHtml)

    const outPath = distPathForRoute(path)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, html)
    console.log(`prerender: ${path} -> ${outPath.replace(`${distDir}/`, '')}`)
  }
}

function prepareAppShell(spaTemplate: string): void {
  const appShell = injectHeadIntoHtml(spaTemplate, buildAppDocumentHead())
  for (const path of APP_NOINDEX_PATHS) {
    const outPath = distPathForRoute(path)
    mkdirSync(dirname(outPath), { recursive: true })
    writeFileSync(outPath, appShell)
    console.log(`app shell: ${path} -> ${outPath.replace(`${distDir}/`, '')}`)
  }
}

function generateSitemap(): void {
  const lastmod = new Date().toISOString().slice(0, 10)
  const urls = PUBLIC_SEO_PATHS.map((path) => {
    const loc = `${CANONICAL_ORIGIN}${path}`
    const priority = path === '/' ? '1.0' : '0.8'
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`

  writeFileSync(join(rootDir, 'public/sitemap.xml'), xml)
  writeFileSync(join(distDir, 'sitemap.xml'), xml)
  console.log(`sitemap: ${PUBLIC_SEO_PATHS.length} URLs -> dist/sitemap.xml`)
}

const spaTemplate = readFileSync(join(distDir, 'index.html'), 'utf8')
prepareAppShell(spaTemplate)
prerenderPublicPages(spaTemplate)
generateSitemap()
