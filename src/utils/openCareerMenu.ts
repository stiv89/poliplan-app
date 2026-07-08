const CAREER_BUTTON_SELECTOR = '[aria-label="Elegir carrera del horario activo"]'

/** Abre el popover de carrera en la barra visible (desktop o mobile). */
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
