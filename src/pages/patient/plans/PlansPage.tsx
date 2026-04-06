const MOCK_PLANS = [
  {
    id: '1',
    title: 'Programa de fortalecimiento lumbar',
    description: 'Ejercicios de estabilización y fortalecimiento del core para reducir el dolor lumbar crónico.',
    type: 'Rehabilitación' as const,
  },
  {
    id: '2',
    title: 'Movilidad de hombro — fase 1',
    description: 'Stretching activo y ejercicios de rango articular progresivo post-lesión.',
    type: 'Rehabilitación' as const,
  },
  {
    id: '3',
    title: 'Fortalecimiento funcional general',
    description: 'Rutina de ejercicios de fuerza adaptada a tu nivel y objetivo de salud general.',
    type: 'Ejercicio' as const,
  },
]

const TYPE_COLORS = {
  Rehabilitación: 'bg-blue-500/10 text-blue-400',
  Ejercicio: 'bg-green-500/10 text-green-400',
}

export function PlansPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-on-surface">Mis planes</h1>
        <span className="text-xs text-muted-foreground">Vista previa — en desarrollo</span>
      </div>

      <div className="space-y-3">
        {MOCK_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="px-4 py-4 rounded-xl bg-surface-container border border-outline-variant space-y-2"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-sm font-medium text-foreground">{plan.title}</h2>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${TYPE_COLORS[plan.type]}`}>
                {plan.type}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{plan.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
