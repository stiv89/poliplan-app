import { registerSW } from 'virtual:pwa-register'

/**
 * Auto-update PWA: when a new service worker takes control, reload open tabs.
 * See https://vite-pwa-org.netlify.app/guide/auto-update.html
 */
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return

    // Check for a new version periodically while the app stays open.
    window.setInterval(() => {
      void registration.update()
    }, 60 * 60 * 1000)
  },
})

if ('serviceWorker' in navigator) {
  let refreshing = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return
    refreshing = true
    window.sessionStorage.setItem('poliplan:startup-mode', 'updating-app')
  })
}
