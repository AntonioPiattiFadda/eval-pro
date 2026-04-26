import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useUpdateMicrocycle } from '../../hooks/useUpdateMicrocycle'
import { createMicrocycleSchema } from '../../schemas/sessionExercise.schema'

type FormInput = z.input<typeof createMicrocycleSchema>

interface EditMicrocycleFormProps {
  microcycleId: string
  planId: string
  currentName: string
  currentRepeatCount: number
  currentDurationDays: number
  onSuccess: () => void
  onCancel: () => void
}

export function EditMicrocycleForm({
  microcycleId,
  planId,
  currentName,
  currentRepeatCount,
  currentDurationDays,
  onSuccess,
  onCancel,
}: EditMicrocycleFormProps) {
  const { mutate, isPending } = useUpdateMicrocycle(planId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createMicrocycleSchema),
    defaultValues: {
      name: currentName,
      repeat_count: currentRepeatCount,
      duration_days: currentDurationDays,
    },
  })

  function onSubmit(values: FormInput) {
    mutate(
      {
        id: microcycleId,
        data: {
          name: values.name,
          repeat_count: Number(values.repeat_count),
          duration_days: Number(values.duration_days),
        },
      },
      { onSuccess },
    )
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 p-2 bg-surface-container rounded-lg"
    >
      <Input
        autoFocus
        placeholder="Nombre del microciclo"
        className="h-8 text-sm"
        {...register('name')}
      />
      {errors.name && (
        <p className="text-xs text-destructive">{errors.name.message}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Repeticiones</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-sm"
            {...register('repeat_count', { valueAsNumber: true })}
          />
          {errors.repeat_count && (
            <p className="text-xs text-destructive">{errors.repeat_count.message}</p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Días</Label>
          <Input
            type="number"
            min={1}
            className="h-8 text-sm"
            {...register('duration_days', { valueAsNumber: true })}
          />
          {errors.duration_days && (
            <p className="text-xs text-destructive">{errors.duration_days.message}</p>
          )}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
