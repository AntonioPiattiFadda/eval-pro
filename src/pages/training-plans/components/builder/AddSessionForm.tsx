import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateTrainingSession } from '../../hooks/useCreateTrainingSession'
import { createTrainingSessionSchema } from '../../schemas/sessionExercise.schema'

type FormValues = z.infer<typeof createTrainingSessionSchema>

const DAY_SHORTS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

interface AddSessionFormProps {
  parentType: 'plan' | 'mesocycle' | 'microcycle'
  parentId: string
  planId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddSessionForm({
  parentType,
  parentId,
  planId,
  onSuccess,
  onCancel,
}: AddSessionFormProps) {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? ''
  const { mutate, isPending } = useCreateTrainingSession(planId)
  const [selectedDays, setSelectedDays] = useState<number[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createTrainingSessionSchema),
  })

  function toggleDay(day: number) {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b)
    setSelectedDays(next)
    setValue('day_of_week', next.length > 0 ? next : undefined)
  }

  function onSubmit(values: FormValues) {
    const parentKey =
      parentType === 'plan'
        ? 'plan_id'
        : parentType === 'mesocycle'
          ? 'mesocycle_id'
          : 'microcycle_id'

    mutate(
      {
        name: values.name,
        day_of_week: values.day_of_week,
        organization_id: organizationId,
        [parentKey]: parentId,
      },
      { onSuccess },
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 p-3 bg-surface-container rounded-lg"
    >
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Nombre</Label>
        <Input
          placeholder="Día A — Empuje"
          className="h-8 text-sm"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Días de la semana</Label>
        <div className="flex gap-1">
          {DAY_SHORTS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={cn(
                'w-7 h-7 rounded-md text-xs font-medium transition-colors',
                selectedDays.includes(i)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Agregar'}
        </Button>
      </div>
    </form>
  )
}
