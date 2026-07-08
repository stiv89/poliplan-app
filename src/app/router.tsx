import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ROUTES } from '@/config/constants'
import { ChangesPage } from '@/pages/ChangesPage'
import { ExamsPage } from '@/pages/ExamsPage'
import { GradingPage } from '@/pages/GradingPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OfflinePage } from '@/pages/OfflinePage'
import { SectionsPage } from '@/pages/SectionsPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.sections.slice(1), element: <SectionsPage /> },
      { path: ROUTES.schedule.slice(1), element: <Navigate to={ROUTES.home} replace /> },
      { path: ROUTES.exams.slice(1), element: <ExamsPage /> },
      { path: ROUTES.grading.slice(1), element: <GradingPage /> },
      { path: ROUTES.progress.slice(1), element: <ProgressPage /> },
      { path: ROUTES.changes.slice(1), element: <ChangesPage /> },
      { path: ROUTES.settings.slice(1), element: <SettingsPage /> },
      { path: ROUTES.offline.slice(1), element: <OfflinePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
