const EXPLORER_BROWSE_MODE_KEY = 'poliplan:explorer-browse-mode'

export type ExplorerBrowseMode = 'semester' | 'all'

export function readExplorerBrowseMode(): ExplorerBrowseMode {
  try {
    const value = localStorage.getItem(EXPLORER_BROWSE_MODE_KEY)
    if (value === 'all' || value === 'semester') return value
  } catch {
    // ignore
  }
  return 'semester'
}

export function writeExplorerBrowseMode(mode: ExplorerBrowseMode): void {
  try {
    localStorage.setItem(EXPLORER_BROWSE_MODE_KEY, mode)
  } catch {
    // ignore
  }
}
