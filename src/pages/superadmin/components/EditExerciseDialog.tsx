import { useEffect } from 'react'
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateTrainingExercise } from '@/service/trainingExercises.service'
import { listExerciseTags } from '@/service/exerciseTags.service'
import { cn } from '@/lib/utils'
import type { TrainingExercise } from '@/pages/training-plans/types'

const TOAST_ID = 'edit-global-exercise'

const executionTypes = ['EXPLOSIVE', 'CONTROLLED', 'ISOMETRIC', 'BALLISTIC'] as const

const numericField = (min: number) =>
  z.string()
    .optional()
    .transform((v) => (v === '' || v === undefined ? undefined : Number(v)))
    .pipe(z.number().int().min(min).optional())

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  description: z.string().optional(),
  tag_ids: z.array(z.string()),
  execution_type: z.enum(['EXPLOSIVE', 'CONTROLLED', 'ISOMETRIC', 'BALLISTIC']).optional(),
  default_sets: numericField(1),
  default_reps: numericField(1),
  default_rest_seconds: numericField(0),
  default_tempo: z.string().optional(),
  video_url: z.string().url('URL inválida').or(z.literal('')).optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface EditExerciseDialogProps {
  exercise: TrainingExercise | null
  onOpenChange: (v: boolean) => void
}

export function EditExerciseDialog({ exercise, onOpenChange }: EditExerciseDialogProps) {
  const open = exercise !== null
  const queryClient = useQueryClient()

  const { data: availableTags = [] } = useQuery({
    queryKey: ['exercise-tags'],
    queryFn: listExerciseTags,
    staleTime: 60_000,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: updateTrainingExercise,
    onMutate: () => { toast.loading('Guardando…', { id: TOAST_ID }) },
    onSuccess: () => {
      toast.success('Ejercicio actualizado', { id: TOAST_ID })
      queryClient.invalidateQueries({ queryKey: ['global-exercises'] })
      onOpenChange(false)
    },
    onError: (err: Error) => { toast.error(err.message, { id: TOAST_ID }) },
  })

  const { register, handleSubmit, reset, control, getValues, setValue, formState: { errors } } =
    useForm<FormInput, unknown, FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!exercise) return
    reset({
      name: exercise.name,
      description: exercise.description ?? '',
      tag_ids: exercise.tags.map((t) => t.tag_id),
      execution_type: exercise.execution_type ?? undefined,
      default_sets: exercise.default_sets != null ? String(exercise.default_sets) : '',
      default_reps: exercise.default_reps != null ? String(exercise.default_reps) : '',
      default_rest_seconds: exercise.default_rest_seconds != null ? String(exercise.default_rest_seconds) : '',
      default_tempo: exercise.default_tempo ?? '',
      video_url: exercise.video_url ?? '',
    })
  }, [exercise, reset])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    if (!exercise) return
    mutate({
      exercise_id: exercise.exercise_id,
      name: values.name,
      description: values.description || undefined,
      tag_ids: values.tag_ids,
      execution_type: values.execution_type,
      default_sets: values.default_sets,
      default_reps: values.default_reps,
      default_rest_seconds: values.default_rest_seconds,
      default_tempo: values.default_tempo || undefined,
      video_url: values.video_url || undefined,
    })
  }

  const executionTypeValue = useWatch({ control, name: 'execution_type' })
  const selectedTagIds = useWatch({ control, name: 'tag_ids' }) ?? []

  function toggleTag(tagId: string) {
    const current = getValues('tag_ids') ?? []
    setValue(
      'tag_ids',
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar ejercicio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-name">Nombre *</Label>
            <Input id="edit-name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-desc">Descripción</Label>
            <Input id="edit-desc" {...register('description')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Etiquetas</Label>
            {availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">No hay etiquetas disponibles.</p>
            ) : (
              <div className="flex flex-wrap gap-2 rounded-md border border-input px-3 py-2.5 min-h-[42px]">
                {availableTags.map((tag) => {
                  const active = selectedTagIds.includes(tag.tag_id)
                  return (
                    <button
                      key={tag.tag_id}
                      type="button"
                      onClick={() => toggleTag(tag.tag_id)}
                      className={cn(
                        'rounded-full px-3 py-0.5 text-sm transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white/10 text-on-surface-variant hover:bg-white/15'
                      )}
                    >
                      {tag.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Tipo de ejecución</Label>
            <Select
              value={executionTypeValue ?? ''}
              onValueChange={(v) =>
                setValue('execution_type', v as FormValues['execution_type'], { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un tipo" />
              </SelectTrigger>
              <SelectContent>
                {executionTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-3 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium">Valores por defecto</p>
              <p className="text-xs text-muted-foreground">
                Se pre-rellenan al agregar el ejercicio a un plan. Podés sobreescribirlos en cada sesión.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-sets">Series</Label>
                <Input id="edit-sets" type="number" min={1} placeholder="3" {...register('default_sets')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-reps">Reps</Label>
                <Input id="edit-reps" type="number" min={1} placeholder="10" {...register('default_reps')} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="edit-rest">Descanso (s)</Label>
                <Input id="edit-rest" type="number" min={0} placeholder="90" {...register('default_rest_seconds')} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-tempo">Tempo</Label>
              <Input id="edit-tempo" placeholder="3-1-2-0" {...register('default_tempo')} />
              <p className="text-xs text-muted-foreground">
                Formato: excéntrica-pausa_baja-concéntrica-pausa_alta
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-video">URL de video</Label>
            <Input id="edit-video" type="url" placeholder="https://youtube.com/..." {...register('video_url')} />
            {errors.video_url && <p className="text-xs text-destructive">{errors.video_url.message}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
