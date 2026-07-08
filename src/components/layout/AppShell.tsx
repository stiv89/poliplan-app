import { Outlet } from 'react-router-dom'
import { OnlineStatusBanner } from '@/components/feedback/OnlineStatusBanner'
import { BottomNav, SidebarNav } from '@/components/layout/Navigation'
import { AppSeoHead } from '@/components/seo/SeoHead'
import { GuestExperienceProvider } from '@/features/guest/GuestExperienceContext'
import { TeacherProfileProvider } from '@/features/teachers/TeacherProfileContext'

export function AppShell() {
  return (
    <TeacherProfileProvider>
      <GuestExperienceProvider>
      <AppSeoHead />
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-text">
        <div className="shrink-0">
          <OnlineStatusBanner />
        </div>

        {/* Área de trabajo: contenedor unificado sidebar + contenido */}
        <div className="flex min-h-0 flex-1 overflow-hidden md:px-4 md:py-3 lg:px-5 lg:py-4">
          <div className="mx-auto flex h-full w-full max-w-[1600px] min-h-0 overflow-hidden md:rounded-[24px] md:border md:border-slate-200/60 md:bg-white">
            <SidebarNav />

            <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:min-h-0 md:pb-0">
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
