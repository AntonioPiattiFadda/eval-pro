import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useCreateMesocycle } from '../../hooks/useCreateMesocycle'
import { createMesocycleSchema } from '../../schemas/sessionExercise.schema'

type FormValues = z.infer<typeof createMesocycleSchema>

interface AddMesocycleFormProps {
  planId: string
  onSuccess: () => void
  onCancel: () => void
}

export function AddMesocycleForm({ planId, onSuccess, onCancel }: AddMesocycleFormProps) {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? ''
  const { mutate, isPending } = useCreateMesocycle(planId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createMesocycleSchema),
  })

  function onSubmit(values: FormValues) {
    mutate(
      { plan_id: planId, name: values.name, organization_id: organizationId },
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
          placeholder="Bloque de acumulación"
          className="h-8 text-sm"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
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
