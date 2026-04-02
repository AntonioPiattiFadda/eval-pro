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
import { PatientSelector } from './PatientSelector'
import { NewPatientSubStep } from './NewPatientSubStep'

const schema = z.object({
  date: z.string().min(1, 'Requerido'),
  startTime: z.string().min(1, 'Requerido'),
  endTime: z.string().min(1, 'Requerido'),
}).refine((d) => d.startTime < d.endTime, {
  message: 'La hora de fin debe ser posterior a la de inicio',
  path: ['endTime'],
})

type FormValues = z.infer<typeof schema>

interface Props {
  professionalId: string
  defaultDate?: Date
  trigger?: React.ReactNode
}

export function NewAppointmentDialog({ professionalId, defaultDate, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showNewPatient, setShowNewPatient] = useState(false)
  const [patientError, setPatientError] = useState(false)
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const defaultDateStr = defaultDate
    ? defaultDate.toISOString().split('T')[0]
    : ''

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: defaultDateStr, startTime: '', endTime: '' },
  })

  const handleClose = () => {
    setOpen(false)
    setSelectedPatient(null)
    setShowNewPatient(false)
    setPatientError(false)
    reset({ date: defaultDateStr, startTime: '', endTime: '' })
  }

  const toastId = 'create-appointment'

  const { mutate, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const start_at = new Date(`${values.date}T${values.startTime}`).toISOString()
      const end_at = new Date(`${values.date}T${values.endTime}`).toISOString()
      return createAppointment({
        professional_id: professionalId,
        patient_id: selectedPatient!.patient_id,
        start_at,
        end_at,
        booked_by: user!.id,
      })
    },
    onMutate: () => { toast.loading('Creando turno…', { id: toastId }) },
    onSuccess: () => {
      toast.success('Turno creado', { id: toastId })
      queryClient.invalidateQueries({ queryKey: ['appointments', professionalId] })
      handleClose()
    },
    onError: (err: Error) => { toast.error(err.message, { id: toastId }) },
  })

  const onSubmit = (values: FormValues) => {
    if (!selectedPatient) { setPatientError(true); return }
    setPatientError(false)
    mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm">
            <CalendarPlus />
            Nuevo turno
          </Button>
        )}
      </DialogTrigger>

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
          {/* Patient section */}
          <div className="space-y-1.5">
            <Label>Paciente</Label>
            {showNewPatient ? (
              <NewPatientSubStep
                onSelect={(patient) => {
                  setSelectedPatient(patient)
                  setShowNewPatient(false)
                  setPatientError(false)
                }}
                onBack={() => setShowNewPatient(false)}
              />
            ) : (
              <PatientSelector
                selectedPatient={selectedPatient}
                onSelect={(p) => { setSelectedPatient(p as Patient | null); setPatientError(false) }}
                onNewPatient={() => setShowNewPatient(true)}
              />
            )}
            {patientError && (
              <p className="text-xs text-destructive">Seleccioná un paciente</p>
            )}
          </div>

          {/* Date/time section — hidden when new patient sub-step is open */}
          {!showNewPatient && (
            <>
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
                <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={isPending}>
                  Confirmar
                </Button>
              </div>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
