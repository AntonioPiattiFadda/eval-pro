import { Calendar, Activity } from 'lucide-react'
import type { SessionHistoryItem } from '@/types/session.types'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completada',
}

interface Props {
  sessions: SessionHistoryItem[]
}

export function SessionHistory({ sessions }: Props) {
  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Primera sesión con este paciente
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div
          key={s.session_id}
          className="flex items-center gap-4 px-4 py-3 rounded-xl bg-surface-container border border-outline-variant"
        >
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Activity className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {s.domain?.name ?? '—'} · {s.region?.name ?? '—'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {new Date(s.created_at).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {STATUS_LABELS[s.status] ?? s.status}
          </span>
        </div>
      ))}
    </div>
  )
}
