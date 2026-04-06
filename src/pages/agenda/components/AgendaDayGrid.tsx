import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { getAppointmentsForDay, type Appointment } from '../services/appointments.service'

const START_HOUR = 0
const END_HOUR = 23
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => i + START_HOUR)
const ROW_HEIGHT = 64
const PADDING_TOP = ROW_HEIGHT / 2
const LABEL_W = 64

function pad(n: number) { return String(n).padStart(2, '0') }
function formatHour(h: number) { return `${pad(h)}:00` }
function slotLabel(hour: number, minute: number) {
  const endMin = minute + 30
  const endHour = endMin === 60 ? hour + 1 : hour
  return `${pad(hour)}:${pad(minute)} – ${pad(endHour % 24)}:${pad(endMin % 60)}`
}

function apptTop(start: Date): number {
  const h = start.getHours()
  const m = start.getMinutes()
  return PADDING_TOP + (h - START_HOUR) * ROW_HEIGHT + (m / 60) * ROW_HEIGHT
}

function apptHeight(start: Date, end: Date): number {
  const mins = (end.getTime() - start.getTime()) / 60_000
  return Math.max((mins / 60) * ROW_HEIGHT, 22)
}

// Isolated component — only this re-renders every minute, not the whole grid
function CurrentTimeIndicator() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const h = now.getHours()
  const m = now.getMinutes()
  if (h < START_HOUR || h > END_HOUR) return null

  const top = PADDING_TOP + (h - START_HOUR) * ROW_HEIGHT + (m / 60) * ROW_HEIGHT
  const label = `${pad(h)}:${pad(m)}`

  return (
    <div className="absolute left-0 right-0 pointer-events-none" style={{ top }}>
      <div className="flex items-center">
        <div className="shrink-0 flex items-center justify-end gap-0.5 pr-[3px]" style={{ width: LABEL_W }}>
          <span className="text-[10px] font-semibold text-orange-500 leading-none">{label}</span>
          <div className="size-2 rounded-full bg-orange-500 shrink-0" />
        </div>
        <div className="flex-1 h-px bg-orange-500" />
      </div>
    </div>
  )
}

const STATUS_COLORS = {
  PENDING:   'bg-primary/20 border-primary/40 text-primary',
  CONFIRMED: 'bg-green-500/20 border-green-500/40 text-green-700',
  CANCELLED: 'bg-destructive/10 border-destructive/30 text-destructive line-through',
  COMPLETED: 'bg-muted border-outline-variant text-muted-foreground',
} as const

interface Props {
  date: Date
  professionalId: string
  onSlotClick?: (slotDate: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
}

export function AgendaDayGrid({ date, professionalId, onSlotClick, onAppointmentClick }: Props) {
  const isToday = new Date().toDateString() === date.toDateString()
  const dayNumber = date.getDate()
  const dayName = date.toLocaleDateString('es-AR', { weekday: 'long' })

  const scrollRef = useRef<HTMLDivElement>(null)

  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments-day', professionalId, date.toDateString()],
    queryFn: () => getAppointmentsForDay(professionalId, date),
    enabled: !!professionalId,
  })

  useEffect(() => {
    if (!scrollRef.current) return
    if (isToday) {
      const h = new Date().getHours()
      const m = new Date().getMinutes()
      const top = PADDING_TOP + (h - START_HOUR) * ROW_HEIGHT + (m / 60) * ROW_HEIGHT
      scrollRef.current.scrollTop = Math.max(0, top - 120)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSlotClick(hour: number, minute: number) {
    const slotDate = new Date(date)
    slotDate.setHours(hour, minute, 0, 0)
    onSlotClick?.(slotDate)
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Day column header */}
      <div className="border-b border-outline-variant flex items-center gap-3 px-4 py-2 shrink-0 bg-surface">
        <div
          className={cn(
            'flex items-center justify-center size-9 rounded-full text-lg font-semibold',
            isToday ? 'bg-primary text-primary-foreground' : 'text-on-surface'
          )}
        >
          {dayNumber}
        </div>
        <span className="text-sm text-on-surface-variant capitalize">{dayName}</span>
      </div>

      {/* Scrollable time grid */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto relative min-h-0"
        style={{ paddingTop: PADDING_TOP }}
      >
        {/* Hour rows */}
        {HOURS.map(hour => (
          <div key={hour} className="flex" style={{ height: ROW_HEIGHT }}>
            {/* Hour label */}
            <div
              className="shrink-0 pr-3 -mt-2 text-right text-xs text-muted-foreground select-none leading-none"
              style={{ width: LABEL_W }}
            >
              {formatHour(hour)}
            </div>

            {/* Two half-hour clickable slots */}
            <div className="flex-1 flex flex-col border-t border-outline-variant">
              {/* :00 slot */}
              <div
                onClick={() => handleSlotClick(hour, 0)}
                className="group flex-1 hover:bg-primary/5 cursor-pointer transition-colors relative"
              >
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                  {slotLabel(hour, 0)}
                </span>
              </div>
              {/* :30 slot */}
              <div
                onClick={() => handleSlotClick(hour, 30)}
                className="group flex-1 border-t border-dashed border-outline-variant/40 hover:bg-primary/5 cursor-pointer transition-colors relative"
              >
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
                  {slotLabel(hour, 30)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Appointment blocks */}
        {appointments.map(appt => {
          const start = new Date(appt.start_at)
          const end = new Date(appt.end_at)
          const top = apptTop(start)
          const height = apptHeight(start, end)
          const startStr = `${pad(start.getHours())}:${pad(start.getMinutes())}`
          const endStr = `${pad(end.getHours())}:${pad(end.getMinutes())}`
          const colorClass = STATUS_COLORS[appt.status]
          const compact = height < 40

          return (
            <div
              key={appt.appointment_id}
              className={cn('absolute rounded border px-2 py-0.5 overflow-hidden cursor-pointer', colorClass)}
              style={{ top, left: LABEL_W + 2, right: 8, height }}
              onDoubleClick={(e) => {
                if (!appt.patient_id) return
                e.stopPropagation()
                onAppointmentClick?.(appt)
              }}
            >
              {compact ? (
                <span className="text-xs font-medium truncate block leading-tight">
                  {startStr} {appt.patient?.user.full_name ?? 'Sin nombre'}
                </span>
              ) : (
                <>
                  <p className="text-xs font-medium truncate leading-tight">
                    {appt.patient?.user.full_name ?? 'Sin nombre'}
                  </p>
                  <p className="text-xs opacity-70 leading-tight">{startStr} – {endStr}</p>
                </>
              )}
            </div>
          )
        })}

        {/* Current time indicator — isolated re-render */}
        {isToday && <CurrentTimeIndicator />}
      </div>
    </div>
  )
}
