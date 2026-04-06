import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AgendaDatePicker } from './AgendaDatePicker'

function parseDate(s: string | null): Date {
  if (!s) return new Date()
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toParam(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function AgendaDayNav() {
  const [searchParams, setSearchParams] = useSearchParams()
  const date = parseDate(searchParams.get('date'))
  const isToday = new Date().toDateString() === date.toDateString()

  // Default to today if param is absent
  useEffect(() => {
    if (!searchParams.get('date')) {
      setSearchParams(p => { p.set('date', toParam(new Date())); return p }, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function setDate(d: Date) {
    setSearchParams(p => { p.set('date', toParam(d)); return p }, { replace: true })
  }

  function goToday() { setDate(new Date()) }

  function prevDay() {
    const d = new Date(date)
    d.setDate(d.getDate() - 1)
    setDate(d)
  }

  function nextDay() {
    const d = new Date(date)
    d.setDate(d.getDate() + 1)
    setDate(d)
  }

  return (
    <div className="h-10 border-b border-outline-variant bg-surface flex items-center px-4 gap-2 shrink-0">
      <Button size="sm" variant="outline" onClick={goToday}>
        {isToday ? 'Hoy' : 'Volver a hoy'}
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={prevDay}>
        <ChevronLeft />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={nextDay}>
        <ChevronRight />
      </Button>
      <AgendaDatePicker selected={date} onSelect={setDate} />
    </div>
  )
}
