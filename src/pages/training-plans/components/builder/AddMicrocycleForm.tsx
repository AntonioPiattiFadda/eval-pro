import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateMicrocycle } from '../../hooks/useCreateMicrocycle'
import { createMicrocycleSchema } from '../../schemas/sessionExercise.schema'

type FormInput = z.input<typeof createMicrocycleSchema>
type FormValues = z.output<typeof createMicrocycleSchema>

interface AddMicrocycleFormProps {
  parentType: 'plan' | 'mesocycle'
  parentId: string
  planId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddMicrocycleForm({
  parentType,
  parentId,
  planId,
  onSuccess,
  onCancel,
}: AddMicrocycleFormProps) {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? ''
  const { mutate, isPending } = useCreateMicrocycle(planId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(createMicrocycleSchema),
    defaultValues: { repeat_count: 1, duration_days: 7 },
  })

  function onSubmit(values: FormInput) {
    const parsed = createMicrocycleSchema.parse(values) as FormValues
    mutate(
      {
        name: parsed.name,
        repeat_count: parsed.repeat_count,
        duration_days: parsed.duration_days,
        organization_id: organizationId,
        ...(parentType === 'mesocycle'
          ? { mesocycle_id: parentId }
          : { plan_id: parentId }),
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
          placeholder="Semana de carga"
          className="h-8 text-sm"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

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
