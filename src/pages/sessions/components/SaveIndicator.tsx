import { useEffect, useState } from 'react'
import { Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface Props {
  status: SaveStatus
}

export function SaveIndicator({ status }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (status !== 'idle') {
      setVisible(true)
    }
    if (status === 'saved') {
      const t = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(t)
    }
  }, [status])

  if (!visible) return null

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs', {
        'text-muted-foreground': status === 'saving',
        'text-green-500': status === 'saved',
        'text-destructive': status === 'error',
      })}
    >
      {status === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === 'saved' && <Check className="h-3 w-3" />}
      {status === 'error' && <AlertCircle className="h-3 w-3" />}
      <span>
        {status === 'saving' && 'Guardando…'}
        {status === 'saved' && 'Guardado'}
        {status === 'error' && 'Error al guardar'}
      </span>
    </div>
  )
}
