import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUpdateMesocycle } from '../../hooks/useUpdateMesocycle'
import { createMesocycleSchema } from '../../schemas/sessionExercise.schema'

type FormValues = z.infer<typeof createMesocycleSchema>

interface EditMesocycleFormProps {
  mesocycleId: string
  planId: string
  currentName: string
  onSuccess: () => void
  onCancel: () => void
}

export function EditMesocycleForm({
  mesocycleId,
  planId,
  currentName,
  onSuccess,
  onCancel,
}: EditMesocycleFormProps) {
  const { mutate, isPending } = useUpdateMesocycle(planId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createMesocycleSchema),
    defaultValues: { name: currentName },
  })

  function onSubmit(values: FormValues) {
    mutate({ id: mesocycleId, data: { name: values.name } }, { onSuccess })
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-2 p-2 bg-surface-container rounded-lg"
    >
      <Input
        autoFocus
        placeholder="Nombre del mesociclo"
        className="h-8 text-sm"
        {...register('name')}
      />
      {errors.name && (
        <p className="text-xs text-destructive">{errors.name.message}</p>
      )}
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
