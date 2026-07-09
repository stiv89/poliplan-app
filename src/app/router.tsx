import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/public/PublicLayout'
import { ROUTES } from '@/config/constants'
import { PUBLIC_ROUTES } from '@/config/seo'
import { ChangesPage } from '@/pages/ChangesPage'
import { ExamsPage } from '@/pages/ExamsPage'
import { GradingPage } from '@/pages/GradingPage'
import { HomePage } from '@/pages/HomePage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OfflinePage } from '@/pages/OfflinePage'
import { AvisoLegalPage } from '@/pages/public/AvisoLegalPage'
import { CalculadoraNotasFpunaPage } from '@/pages/public/CalculadoraNotasFpunaPage'
import { ComoFuncionaPage } from '@/pages/public/ComoFuncionaPage'
import { ExamenesFpunaPage } from '@/pages/public/ExamenesFpunaPage'
import { FuentesPage } from '@/pages/public/FuentesPage'
import { HorariosFpunaPage } from '@/pages/public/HorariosFpunaPage'
import { LandingPage } from '@/pages/public/LandingPage'
import { SectionsPage } from '@/pages/SectionsPage'
import { ProgressPage } from '@/pages/ProgressPage'
import { SettingsPage } from '@/pages/SettingsPage'

function LegacyAppRedirect() {
  const { pathname } = useLocation()
  const rest = pathname.replace(/^\/app\/?/, '')
  return <Navigate to={rest ? `/${rest}` : ROUTES.home} replace />
}

export const router = createBrowserRouter([
  { path: PUBLIC_ROUTES.presentacion, element: <LandingPage /> },
  { path: 'presentacion', element: <Navigate to={PUBLIC_ROUTES.presentacion} replace /> },
  {
    element: <PublicLayout />,
    children: [
      { path: PUBLIC_ROUTES.horarios.slice(1), element: <HorariosFpunaPage /> },
      { path: PUBLIC_ROUTES.examenes.slice(1), element: <ExamenesFpunaPage /> },
      { path: PUBLIC_ROUTES.calculadora.slice(1), element: <CalculadoraNotasFpunaPage /> },
      { path: PUBLIC_ROUTES.comoFunciona.slice(1), element: <ComoFuncionaPage /> },
      { path: PUBLIC_ROUTES.fuentes.slice(1), element: <FuentesPage /> },
      { path: PUBLIC_ROUTES.avisoLegal.slice(1), element: <AvisoLegalPage /> },
    ],
  },
  {
    element: <AppShell />,
    children: [
      { path: ROUTES.home.slice(1), element: <HomePage /> },
      { path: ROUTES.sections.slice(1), element: <SectionsPage /> },
      { path: ROUTES.exams.slice(1), element: <ExamsPage /> },
      { path: ROUTES.grading.slice(1), element: <GradingPage /> },
      { path: ROUTES.progress.slice(1), element: <ProgressPage /> },
      { path: ROUTES.changes.slice(1), element: <ChangesPage /> },
      { path: ROUTES.settings.slice(1), element: <SettingsPage /> },
      { path: ROUTES.offline.slice(1), element: <OfflinePage /> },
    ],
  },
  { path: 'app', element: <LegacyAppRedirect /> },
  { path: 'app/*', element: <LegacyAppRedirect /> },
  { path: '*', element: <NotFoundPage /> },
])
