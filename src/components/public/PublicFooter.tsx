import { PUBLIC_NAV_LINKS } from '@/config/seo'
import { ROUTES } from '@/config/constants'
import { LegalDisclaimer } from '@/components/public/LegalDisclaimer'

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <nav aria-label="Pie de página">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
            {PUBLIC_NAV_LINKS.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="hover:text-[#0B3B8F]">
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a href={ROUTES.home} className="hover:text-[#0B3B8F]">
                App PoliPlan
              </a>
            </li>
          </ul>
        </nav>
        <LegalDisclaimer compact />
      </div>
    </footer>
  )
}
