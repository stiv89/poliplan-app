import { Outlet } from 'react-router-dom'
import { OnlineStatusBanner } from '@/components/feedback/OnlineStatusBanner'
import { LiquidGlassFilter } from '@/components/layout/LiquidGlassFilter'
import { BottomNav, SidebarNav } from '@/components/layout/Navigation'
import { AppSeoHead } from '@/components/seo/SeoHead'
import { GuestExperienceProvider } from '@/features/guest/GuestExperienceContext'
import { TeacherProfileProvider } from '@/features/teachers/TeacherProfileContext'

export function AppShell() {
  return (
    <TeacherProfileProvider>
      <GuestExperienceProvider>
        <AppSeoHead />
        <LiquidGlassFilter />
        <div className="flex h-dvh flex-col overflow-hidden bg-background text-text">
          <div className="shrink-0">
            <OnlineStatusBanner />
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div
              id="app-content"
              className="app-content flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:px-4 md:py-3 lg:px-5 lg:py-4"
            >
              <div className="liquid-glass-surface mx-auto flex min-h-0 w-full max-w-[1600px] flex-1 flex-col overflow-hidden md:flex-row md:rounded-[24px]">
                <SidebarNav />

                <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background pb-mobile-dock md:bg-transparent">
                  <Outlet />
                </main>
              </div>

              <BottomNav />
            </div>
          </div>
        </div>
      </GuestExperienceProvider>
    </TeacherProfileProvider>
  )
}
