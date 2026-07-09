const CAREER_BUTTON_SELECTOR =
  '[data-schedule-context-trigger], [data-career-picker-trigger], [aria-label="Contexto del horario"], [aria-label="Elegir carrera y periodo académico"]'

/** Abre el selector de contexto del horario en la barra visible (desktop o mobile). */
export function openCareerMenu(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>(CAREER_BUTTON_SELECTOR)
  for (const button of buttons) {
    const rect = button.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      button.click()
      return
    }
  }
}
