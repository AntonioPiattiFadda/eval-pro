import { Link } from 'react-router-dom'
import { Calendar, ClipboardList } from 'lucide-react'

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
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-semibold text-on-surface mb-6">Inicio</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
