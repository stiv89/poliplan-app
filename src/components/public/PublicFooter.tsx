import { PUBLIC_NAV_LINKS } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5">
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
            {PUBLIC_NAV_LINKS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-[#0B3B8F]">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href={ROUTES.home} className="hover:text-[#0B3B8F]">
                App
              </a>
            </li>
          </ul>
        </nav>
        <LegalDisclaimer compact className="sm:max-w-md sm:text-right" />
      </div>
    </footer>
  )
}
