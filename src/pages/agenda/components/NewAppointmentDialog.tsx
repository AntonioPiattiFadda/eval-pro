import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { createAppointment } from '../services/appointments.service'
import { type Patient } from '../services/patients.service'
import { PatientStep } from './PatientStep'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  startTime: z.string().min(1, 'Requerido'),
  endTime: z.string().min(1, 'Requerido'),
}).refine((d) => d.startTime < d.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endTime'],
})

type FormValues = z.infer<typeof schema>

function pad(n: number) { return String(n).padStart(2, '0') }
function toTimeStr(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function hasTime(d: Date) { return d.getHours() !== 0 || d.getMinutes() !== 0 }

interface Props {
  professionalId: string
  defaultDate?: Date
  open?: boolean
  onOpenChange?: (v: boolean) => void
  trigger?: React.ReactNode
}

export function NewAppointmentDialog({
  professionalId,
  defaultDate,
  open,
  onOpenChange,
  trigger,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientError, setPatientError] = useState(false)
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()

  const isOpen = open ?? internalOpen

  const handleOpenChange = (v: boolean) => {
    onOpenChange?.(v)
    setInternalOpen(v)
    if (!v) handleClose()
  }

  const dateStr = defaultDate ? defaultDate.toISOString().split('T')[0] : ''
  const startTimeStr = defaultDate && hasTime(defaultDate) ? toTimeStr(defaultDate) : ''
  const endTimeStr = defaultDate && hasTime(defaultDate)
    ? toTimeStr(new Date(defaultDate.getTime() + 30 * 60_000))
    : ''

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: dateStr, startTime: startTimeStr, endTime: endTimeStr },
  })

  const handleClose = () => {
    setSelectedPatient(null)
    setPatientError(false)
    reset({ date: dateStr, startTime: startTimeStr, endTime: endTimeStr })
  }

  const toastId = 'create-appointment'

  const { mutate, isPending } = useMutation({
    mutationFn: ({ values, patient }: { values: FormValues; patient: Patient }) => {
      const start_at = new Date(`${values.date}T${values.startTime}`).toISOString()
      const end_at   = new Date(`${values.date}T${values.endTime}`).toISOString()
      return createAppointment({
        professional_id: professionalId,
        patient_id: patient.patient_id,
        organization_id: profile!.organization_id!,
        start_at,
        end_at,
        booked_by: user!.id,
      })
    },
    onMutate: () => { toast.loading('Creando turno…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Turno creado', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['appointments', professionalId] })
      queryClient.invalidateQueries({ queryKey: ['appointments-day', professionalId] })
      handleOpenChange(false)
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  const onSubmit = (values: FormValues) => {
    if (!selectedPatient) { setPatientError(true); return }
    setPatientError(false)
    mutate({ values, patient: selectedPatient })
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger !== undefined ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : open === undefined ? (
        <DialogTrigger asChild>
          <Button size="sm">
            <CalendarPlus />
            Nuevo turno
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
              <CalendarPlus className="h-4 w-4 text-primary" />
            </div>
            Nuevo Turno
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            <PatientStep
              selectedPatient={selectedPatient}
              organizationId={profile!.organization_id!}
              onSelect={(p) => { setSelectedPatient(p); setPatientError(false) }}
              onClear={() => setSelectedPatient(null)}
            />
            {patientError && (
              <p className="text-xs text-destructive">Seleccioná un paciente</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="appt-date">Fecha</Label>
            <Input id="appt-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="appt-start">Inicio</Label>
              <Input id="appt-start" type="time" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-end">Fin</Label>
              <Input id="appt-end" type="time" {...register('endTime')} />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              Confirmar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
