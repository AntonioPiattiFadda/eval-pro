import { cn } from '@/lib/utils'

const WIZARD_STEPS = ['Entrada', 'Fase 1', 'Fase 2', 'Tests']

interface Props {
  currentStep: number // 0-indexed: 0=Entrada, 1=Fase1, 2=Fase2, 3=Tests
}

export function WizardProgress({ currentStep }: Props) {
  return (
    <div className="flex items-center px-6 py-3 border-b border-outline-variant gap-1">
      {WIZARD_STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          {i > 0 && (
            <div
              className={cn(
                'h-px w-6 mx-1',
                i <= currentStep ? 'bg-primary' : 'bg-outline-variant'
              )}
            />
          )}
          <div
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium',
              i === currentStep
                ? 'text-primary'
                : i < currentStep
                  ? 'text-muted-foreground'
                  : 'text-muted-foreground/40'
            )}
          >
            <div
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                i === currentStep
                  ? 'bg-primary'
                  : i < currentStep
                    ? 'bg-muted-foreground'
                    : 'bg-outline-variant'
              )}
            />
            {label}
          </div>
        </div>
      ))}
    </div>
  )
}
