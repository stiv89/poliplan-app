import { fetchOfficialPage } from './fetchOfficialPage'
import { extractScheduleLinks, selectBestScheduleLink } from './extractScheduleLinks'
import type { ResolvedScheduleTarget, ScheduleLinkCandidate } from './types'

export async function resolveScheduleTarget(
  candidate: ScheduleLinkCandidate,
  fetchImpl: typeof fetch = fetch,
  hops: string[] = [],
  depth = 0,
): Promise<ResolvedScheduleTarget> {
  const nextHops = [...hops, candidate.absoluteUrl]

  if (candidate.kind === 'excel' || candidate.kind === 'drive-file' || candidate.kind === 'download') {
    return {
      candidate,
      finalUrl: candidate.absoluteUrl,
      finalText: candidate.text,
      hops: nextHops,
    }
  }

  if (depth >= 2) {
    throw new Error(`No se pudo resolver el enlace después de ${depth + 1} saltos`)
  }

  if (candidate.kind !== 'drive-folder' && candidate.kind !== 'page' && candidate.kind !== 'other') {
    throw new Error(`No se puede resolver un enlace de tipo ${candidate.kind}`)
  }

  const page = await fetchOfficialPage(candidate.absoluteUrl, fetchImpl)
  const links = extractScheduleLinks(page.html, page.finalUrl)
  const selection = selectBestScheduleLink(links)

  if (!selection.candidate) {
    throw new Error(`No se pudo resolver el contenido de ${candidate.absoluteUrl}: ${selection.reason}`)
  }

  if (selection.candidate.absoluteUrl === candidate.absoluteUrl) {
    return {
      candidate: selection.candidate,
      finalUrl: selection.candidate.absoluteUrl,
      finalText: selection.candidate.text,
      hops: nextHops,
    }
  }

  return resolveScheduleTarget(selection.candidate, fetchImpl, nextHops, depth + 1)
}
