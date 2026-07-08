import { useEffect } from 'react'
import { buildDocumentHead } from '@/seo/documentHead'
import type { PageSeoMeta } from '@/config/seo'

interface SeoHeadProps {
  meta: PageSeoMeta
  robots?: string
  faq?: { question: string; answer: string }[]
}

export function SeoHead({ meta, robots, faq }: SeoHeadProps) {
  useEffect(() => {
    const headHtml = buildDocumentHead({ meta, robots, faq })
    const parser = new DOMParser()
    const parsed = parser.parseFromString(`<head>${headHtml}</head>`, 'text/html')

    document.title = parsed.querySelector('title')?.textContent ?? meta.title

    const managed = document.querySelectorAll('[data-seo-managed]')
    managed.forEach((node) => node.remove())

    parsed.head.querySelectorAll('meta, link, script, title').forEach((node) => {
      if (node.tagName.toLowerCase() === 'title') return
      const clone = node.cloneNode(true) as HTMLElement
      clone.setAttribute('data-seo-managed', 'true')
      document.head.appendChild(clone)
    })
  }, [meta, robots, faq])

  return null
}

export function AppSeoHead() {
  useEffect(() => {
    document.title = 'PoliPlan — App'

    const existing = document.querySelector('meta[name="robots"][data-seo-managed]')
    if (existing) existing.remove()

    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex, follow'
    robots.setAttribute('data-seo-managed', 'true')
    document.head.appendChild(robots)
  }, [])

  return null
}
