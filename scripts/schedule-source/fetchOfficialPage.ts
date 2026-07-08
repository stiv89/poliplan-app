import { JSDOM } from 'jsdom'
import type { OfficialPageSnapshot } from './types'

export async function fetchOfficialPage(
  requestedUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<OfficialPageSnapshot> {
  const response = await fetchImpl(requestedUrl, {
    headers: {
      'user-agent': 'Mozilla/5.0 (PoliPlan schedule source checker)',
      accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`La página oficial respondió ${response.status} ${response.statusText}`)
  }

  const html = await response.text()
  const contentType = response.headers.get('content-type') ?? ''
  const title = new JSDOM(html).window.document.title.trim()

  return {
    requestedUrl,
    finalUrl: response.url || requestedUrl,
    status: response.status,
    contentType,
    html,
    title,
  }
}
