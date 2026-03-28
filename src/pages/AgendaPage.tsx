import { AgendaToolbar } from './agenda/AgendaToolbar'

export function AgendaPage() {
  return (
    <div className="flex flex-col h-full">
      <AgendaToolbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-surface-container rounded-2xl p-8 max-w-md w-full mx-4 text-center space-y-3">
          <h2 className="font-display text-2xl font-semibold text-on-surface">Agenda</h2>
          <p className="text-on-surface-variant text-xs">En construcción</p>
        </div>
      </div>
    </div>
  )
}
