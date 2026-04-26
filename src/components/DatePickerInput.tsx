import { useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function toDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplay(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year}`
}

interface Props {
  /** ISO date string (YYYY-MM-DD) or undefined when empty */
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
  /** Whether to show the clear button when a date is selected */
  clearable?: boolean
  className?: string
  error?: boolean
}

export function DatePickerInput({
  value,
  onChange,
  placeholder = 'Seleccioná una fecha',
  clearable = true,
  className,
  error,
}: Props) {
  const selected = value ? toDate(value) : undefined
  const now = new Date()
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    () => selected
      ? new Date(selected.getFullYear(), selected.getMonth(), 1)
      : new Date(now.getFullYear(), now.getMonth(), 1)
  )
  const [rightYear, setRightYear] = useState(
    () => selected?.getFullYear() ?? now.getFullYear()
  )

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    onChange(toIso(day))
    setOpen(false)
  }

  function handleMonthChange(month: Date) {
    setViewMonth(month)
    setRightYear(month.getFullYear())
  }

  function handleMonthGridSelect(monthIndex: number) {
    setViewMonth(new Date(rightYear, monthIndex, 1))
  }

  function handleToday() {
    const today = new Date()
    onChange(toIso(today))
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setRightYear(today.getFullYear())
    setOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange(undefined)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-md border text-sm transition-colors',
            'border-input bg-background hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            error && 'border-destructive',
            className,
          )}
        >
          <CalendarIcon className="size-3.5 text-on-surface-variant shrink-0" />
          <span className={cn('flex-1 text-left', !selected && 'text-muted-foreground')}>
            {selected ? formatDisplay(selected) : placeholder}
          </span>
          {clearable && selected && (
            <X
              className="size-3.5 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={handleClear}
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Left panel: monthly calendar */}
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            month={viewMonth}
            onMonthChange={handleMonthChange}
            locale={es}
          />

          {/* Right panel: month grid + year navigation */}
          <div className="border-l border-outline-variant flex flex-col w-36 p-3">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setRightYear(y => y - 1)}
                className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
              >
                <ChevronLeft className="size-3" />
              </button>
              <span className="text-sm font-medium text-on-surface">{rightYear}</span>
              <button
                type="button"
                onClick={() => setRightYear(y => y + 1)}
                className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
              >
                <ChevronRight className="size-3" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => {
                const isActive =
                  viewMonth.getMonth() === i && viewMonth.getFullYear() === rightYear
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMonthGridSelect(i)}
                    className={cn(
                      'rounded py-1.5 text-xs transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-on-surface hover:bg-muted'
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="border-t border-outline-variant px-3 py-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleToday}>
            Hoy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
