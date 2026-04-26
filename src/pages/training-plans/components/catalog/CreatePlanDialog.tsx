import { useEffect, useState } from 'react'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PatientSelector } from '@/components/PatientSelector'
import { DatePickerInput } from '@/components/DatePickerInput'
import type { Patient } from '@/types/patients'
import { useCreatePlan } from '../../hooks/useCreatePlan'
import { createPlanSchema } from '../../schemas/sessionExercise.schema'

type CreatePlanFormValues = z.infer<typeof createPlanSchema>

interface CreatePlanDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  organizationId: string
  professionalId: string
}

export function CreatePlanDialog({
  open,
  onOpenChange,
  organizationId,
  professionalId,
}: CreatePlanDialogProps) {
  const { mutate, isPending } = useCreatePlan()
  // Keep the full Patient object for display; RHF only stores the UUID
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreatePlanFormValues>({
    resolver: zodResolver(createPlanSchema),
  })

  useEffect(() => {
    if (!open) {
      reset()
      setSelectedPatient(null)
    }
  }, [open, reset])

  function onSubmit(values: CreatePlanFormValues) {
    mutate(
      {
        name: values.name,
        patient_id: values.patient_id,
        organization_id: organizationId,
        professional_id: professionalId,
        start_date: values.start_date,
        end_date: values.end_date,
        description: values.description,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
          reset()
          setSelectedPatient(null)
        },
      },
    )
  }

  const startDate = useWatch({ control, name: 'start_date' })
  const endDate = useWatch({ control, name: 'end_date' })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Nuevo plan de entrenamiento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-name">Nombre *</Label>
            <Input id="plan-name" placeholder="Plan de fuerza Q1" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Patient — PatientSelector provides display; Controller drives RHF validation */}
          <div className="flex flex-col gap-1.5">
            <Label>Paciente *</Label>
            <Controller
              control={control}
              name="patient_id"
              render={({ fieldState }) => (
                <PatientSelector
                  value={selectedPatient}
                  organizationId={organizationId}
                  onChange={(patient) => {
                    setSelectedPatient(patient)
                    setValue('patient_id', patient?.patient_id ?? '', { shouldValidate: true })
                  }}
                  error={fieldState.error?.message}
                />
              )}
            />
          </div>

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Fecha inicio</Label>
              <DatePickerInput
                value={startDate}
                onChange={(v) => setValue('start_date', v, { shouldValidate: true })}
                placeholder="Inicio"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Fecha fin</Label>
              <DatePickerInput
                value={endDate}
                onChange={(v) => setValue('end_date', v, { shouldValidate: true })}
                placeholder="Fin"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creando…' : 'Crear plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
