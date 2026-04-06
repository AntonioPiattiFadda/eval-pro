import { useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { es } from 'react-day-picker/locale'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function formatDisplayDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString('es-AR', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}, ${year}`
}

interface Props {
  selected: Date
  onSelect: (date: Date) => void
}

export function AgendaDatePicker({ selected, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  )
  const [rightYear, setRightYear] = useState(selected.getFullYear())

  function handleDaySelect(day: Date | undefined) {
    if (!day) return
    onSelect(day)
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
    onSelect(today)
    setViewMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setRightYear(today.getFullYear())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 text-sm font-medium text-on-surface hover:opacity-70 transition-opacity">
          {formatDisplayDate(selected)}
          <ChevronDown className="size-3.5 text-on-surface-variant" />
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
            {/* Year row */}
            <div className="flex items-center justify-between mb-3 shrink-0">
              <button
                onClick={() => setRightYear(y => y - 1)}
                className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
              >
                <ChevronLeft className="size-3" />
              </button>
              <span className="text-sm font-medium text-on-surface">{rightYear}</span>
              <button
                onClick={() => setRightYear(y => y + 1)}
                className="rounded p-0.5 hover:bg-muted text-on-surface-variant"
              >
                <ChevronRight className="size-3" />
              </button>
            </div>

            {/* 4×3 month grid */}
            <div className="grid grid-cols-3 gap-1">
              {MONTHS.map((m, i) => {
                const isActive =
                  viewMonth.getMonth() === i && viewMonth.getFullYear() === rightYear
                return (
                  <button
                    key={m}
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

        {/* Footer */}
        <div className="border-t border-outline-variant px-3 py-2 flex justify-end">
          <Button size="sm" variant="ghost" onClick={handleToday}>
            Hoy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
