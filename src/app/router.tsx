import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ROUTES } from '@/config/constants'
import { ExamsPage } from '@/pages/ExamsPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OfflinePage } from '@/pages/OfflinePage'
import { SchedulePage } from '@/pages/SchedulePage'
import { SectionsPage } from '@/pages/SectionsPage'
import { SettingsPage } from '@/pages/SettingsPage'

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: ROUTES.sections.slice(1), element: <SectionsPage /> },
      { path: ROUTES.schedule.slice(1), element: <SchedulePage /> },
      { path: ROUTES.exams.slice(1), element: <ExamsPage /> },
      { path: ROUTES.settings.slice(1), element: <SettingsPage /> },
      { path: ROUTES.offline.slice(1), element: <OfflinePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
