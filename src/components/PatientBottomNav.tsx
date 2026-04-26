import { NavLink } from 'react-router-dom'
import { Home, Calendar, ClipboardList } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Inicio',  href: '/patient/dashboard',     icon: Home,          end: true  },
  { label: 'Turnos',  href: '/patient/appointments',  icon: Calendar,      end: false },
  { label: 'Planes',  href: '/patient/plans',         icon: ClipboardList, end: false },
]

export function PatientBottomNav() {
  return (
    <nav
      className="shrink-0 border-t border-outline-variant bg-surface-container-low"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ label, href, icon: Icon, end }) => (
          <NavLink
            key={href}
            to={href}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-on-surface-variant',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5 transition-all', isActive ? 'stroke-[2.5]' : 'stroke-[1.75]')} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
