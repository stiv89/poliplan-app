let openCount = 0

function syncBottomSheetOpenClass() {
  document.documentElement.classList.toggle('bottom-sheet-open', openCount > 0)
}

/** Registers an open bottom sheet; returns cleanup. Tracks count for app-content scale. */
export function registerBottomSheetOpen() {
  openCount += 1
  syncBottomSheetOpenClass()
  return () => {
    openCount = Math.max(0, openCount - 1)
    syncBottomSheetOpenClass()
  }
}
