import { cn } from '@/lib/utils'

interface ActiveToggleProps {
  isActive: boolean
  onToggle: () => void
  isPending?: boolean
}

export function ActiveToggle({ isActive, onToggle, isPending }: ActiveToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={isPending}
      className={cn(
        'group/toggle flex items-center gap-1.5 px-1.5 py-1 rounded-full text-xs font-medium transition-all select-none',
        isActive
          ? 'hover:bg-green-500/15 hover:text-green-400 hover:px-2.5'
          : 'hover:bg-surface-container hover:text-on-surface-variant hover:px-2.5',
        isPending && 'opacity-50 cursor-not-allowed',
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          isActive ? 'bg-green-400' : 'bg-on-surface-variant/50',
        )}
      />
      <span className="max-w-0 overflow-hidden group-hover/toggle:max-w-[4rem] transition-all duration-200 whitespace-nowrap">
        {isActive ? 'Activo' : 'Borrador'}
      </span>
    </button>
  )
}
