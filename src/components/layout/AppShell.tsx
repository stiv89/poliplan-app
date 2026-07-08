import { Outlet } from 'react-router-dom'
import { OnlineStatusBanner } from '@/components/feedback/OnlineStatusBanner'
import { BottomNav, SidebarNav } from '@/components/layout/Navigation'

export function AppShell() {
  return (
    <div className="min-h-screen bg-background text-text">
      <OnlineStatusBanner />
      <div className="mx-auto flex min-h-screen max-w-7xl">
        <SidebarNav />
        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/95 px-4 py-4 backdrop-blur md:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">PoliPlan</p>
                <h1 className="text-lg font-semibold text-text">Planificá tu semestre</h1>
              </div>
            </div>
          </header>
          <main className="flex-1 px-4 py-5 pb-24 md:px-6 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
