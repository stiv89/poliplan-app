import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { PUBLIC_NAV_LINKS, PUBLIC_ROUTES, SITE_NAME } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { PublicFooter } from '@/components/public/PublicFooter'

const LOGO_URL = '/email/poliplan-logo.png'

export function PublicLayout({
  children,
  minimal = false,
}: {
  children?: ReactNode
  minimal?: boolean
}) {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div
          className={`mx-auto flex max-w-5xl px-4 ${
            minimal ? 'justify-center py-3' : 'flex-wrap items-center justify-between gap-4 py-4'
          }`}
        >
          <a href={PUBLIC_ROUTES.presentacion} className="flex items-center">
            <img
              src={LOGO_URL}
              alt={`Logo ${SITE_NAME}`}
              width={120}
              height={40}
              className="h-10 w-auto"
            />
            {!minimal && (
              <span className="ml-3 text-lg font-bold tracking-tight text-[#0B3B8F]">{SITE_NAME}</span>
            )}
          </a>
          {!minimal && (
            <>
              <nav aria-label="Principal">
                <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm font-medium text-slate-700">
                  {PUBLIC_NAV_LINKS.map((item) => (
                    <li key={item.href}>
                      <a href={item.href} className="hover:text-[#0B3B8F]">
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              <a
                href={ROUTES.home}
                className="rounded-lg bg-[#0B3B8F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B3B8F]/90"
              >
                Abrir app
              </a>
            </>
          )}
        </div>
      </header>

      <main className={`mx-auto max-w-5xl px-4 ${minimal ? 'py-6 sm:py-8' : 'py-10'}`}>
        {children ?? <Outlet />}
      </main>

      {!minimal && <PublicFooter />}
    </div>
  )
}
