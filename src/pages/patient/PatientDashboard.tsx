import { Link } from 'react-router-dom'
import { Calendar, ClipboardList } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const DASHBOARD_CARDS = [
  {
    title: 'Mis turnos',
    description: 'Tus próximos turnos con el profesional.',
    icon: Calendar,
    href: '/patient/appointments',
  },
  {
    title: 'Mis planes',
    description: 'Tus planes de ejercicio y rehabilitación.',
    icon: ClipboardList,
    href: '/patient/plans',
  },
]

export function PatientDashboard() {
  const { profile } = useAuth()
  const firstName = profile?.full_name ?? profile?.full_name?.split(' ')[0] ?? 'Hola'

  return (
    <div className="px-4 py-6 lg:p-6 lg:max-w-2xl lg:mx-auto flex flex-col gap-6">
      <div>
        <p className="text-sm text-on-surface-variant lg:hidden">Bienvenido/a</p>
        <h1 className="font-display text-2xl font-semibold text-on-surface">
          <span className="lg:hidden">{firstName}</span>
          <span className="hidden lg:inline">Inicio</span>
        </h1>
      </div>

      {/* Mobile/tablet: vertical list with horizontal cards */}
      <div className="flex flex-col gap-3 lg:hidden">
        {DASHBOARD_CARDS.map((card) => (
          <Link
            key={card.href}
            to={card.href}
            className="flex items-center gap-4 px-4 py-4 rounded-2xl bg-surface-container border border-outline-variant active:bg-surface-container-high transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <card.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-on-surface">{card.title}</span>
              <span className="text-xs text-on-surface-variant leading-relaxed">{card.description}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: 2-column grid with vertical cards (original style) */}
      <div className="hidden lg:grid grid-cols-2 gap-4">
        {DASHBOARD_CARDS.map((card) => (
          <Link
            key={card.href}
            to={card.href}
            className="text-left px-5 py-5 rounded-2xl bg-surface-container border border-outline-variant hover:bg-surface-container-high transition-colors space-y-3 block"
          >
            <card.icon className="h-5 w-5 text-primary" />
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-on-surface">{card.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
