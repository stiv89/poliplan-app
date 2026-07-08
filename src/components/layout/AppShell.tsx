import { Outlet } from 'react-router-dom'
import { OnlineStatusBanner } from '@/components/feedback/OnlineStatusBanner'
import { BottomNav, SidebarNav } from '@/components/layout/Navigation'
import { GuestExperienceProvider } from '@/features/guest/GuestExperienceContext'
import { TeacherProfileProvider } from '@/features/teachers/TeacherProfileContext'

export function AppShell() {
  return (
    <TeacherProfileProvider>
      <GuestExperienceProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-text">
        <div className="shrink-0">
          <OnlineStatusBanner />
        </div>

        {/* Área de trabajo: sidebar + contenido */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="mx-auto flex h-full w-full max-w-[1600px] min-h-0 gap-3 px-3 md:gap-4 md:px-4 md:py-3 lg:gap-5 lg:px-5">
            <SidebarNav />

            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:rounded-2xl md:bg-surface md:pb-0 md:shadow-sm md:ring-1 md:ring-slate-100/80">
              <Outlet />
            </main>
          </div>
        </div>

        <BottomNav />
      </div>
      </GuestExperienceProvider>
    </TeacherProfileProvider>
  )
}
