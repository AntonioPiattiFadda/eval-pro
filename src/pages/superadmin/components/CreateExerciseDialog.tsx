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
import { createTrainingExercise } from '@/service/trainingExercises.service'
import { listExerciseTags } from '@/service/exerciseTags.service'
import { cn } from '@/lib/utils'

const TOAST_ID = 'create-global-exercise'

const executionTypes = ['EXPLOSIVE', 'CONTROLLED', 'ISOMETRIC', 'BALLISTIC'] as const

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(120),
  description: z.string().optional(),
  tag_ids: z.array(z.string()).default([]),
  execution_type: z.enum(['EXPLOSIVE', 'CONTROLLED', 'ISOMETRIC', 'BALLISTIC']).optional(),
  default_sets: z.coerce.number().int().min(1).optional().or(z.literal('')),
  default_reps: z.coerce.number().int().min(1).optional().or(z.literal('')),
  default_rest_seconds: z.coerce.number().int().min(0).optional().or(z.literal('')),
  default_tempo: z.string().optional(),
  video_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

interface CreateExerciseDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function CreateExerciseDialog({ open, onOpenChange }: CreateExerciseDialogProps) {
  const queryClient = useQueryClient()

  const { data: availableTags = [] } = useQuery({
    queryKey: ['exercise-tags'],
    queryFn: listExerciseTags,
    staleTime: 60_000,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: createTrainingExercise,
    onMutate: () => {
      toast.loading('Guardando…', { id: TOAST_ID })
    },
    onSuccess: () => {
      toast.success('Ejercicio creado', { id: TOAST_ID })
      queryClient.invalidateQueries({ queryKey: ['global-exercises'] })
      onOpenChange(false)
    },
    onError: (err: Error) => {
      toast.error(err.message, { id: TOAST_ID })
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      tag_ids: [],
      default_tempo: '',
      video_url: '',
    },
  })

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    mutate({
      name: values.name,
      organization_id: null,
      description: values.description || undefined,
      tag_ids: values.tag_ids,
      execution_type: values.execution_type,
      default_sets: values.default_sets !== '' ? Number(values.default_sets) : undefined,
      default_reps: values.default_reps !== '' ? Number(values.default_reps) : undefined,
      default_rest_seconds:
        values.default_rest_seconds !== '' ? Number(values.default_rest_seconds) : undefined,
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
          <DialogTitle className="font-display">Nuevo ejercicio global</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-name">Nombre *</Label>
            <Input id="ex-name" placeholder="Sentadilla trasera" {...register('name')} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-desc">Descripción</Label>
            <Input
              id="ex-desc"
              placeholder="Descripción breve del ejercicio"
              {...register('description')}
            />
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5">
            <Label>Etiquetas</Label>
            {availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No hay etiquetas disponibles. Creá algunas desde "Gestionar etiquetas".
              </p>
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

          {/* Execution type */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de ejecución</Label>
            <Select
              value={executionTypeValue ?? ''}
              onValueChange={(v) =>
                setValue('execution_type', v as FormValues['execution_type'], {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un tipo" />
              </SelectTrigger>
              <SelectContent>
                {executionTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Defaults section */}
          <div className="rounded-md border border-dashed border-border bg-muted/40 px-4 py-3 flex flex-col gap-3">
            <div>
              <p className="text-sm font-medium">Valores por defecto</p>
              <p className="text-xs text-muted-foreground">
                Se pre-rellenan al agregar el ejercicio a un plan. Podés sobreescribirlos en cada sesión.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ex-sets">Series</Label>
                <Input
                  id="ex-sets"
                  type="number"
                  min={1}
                  placeholder="3"
                  {...register('default_sets')}
                />
                {errors.default_sets && (
                  <p className="text-xs text-destructive">{errors.default_sets.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ex-reps">Reps</Label>
                <Input
                  id="ex-reps"
                  type="number"
                  min={1}
                  placeholder="10"
                  {...register('default_reps')}
                />
                {errors.default_reps && (
                  <p className="text-xs text-destructive">{errors.default_reps.message}</p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ex-rest">Descanso (s)</Label>
                <Input
                  id="ex-rest"
                  type="number"
                  min={0}
                  placeholder="90"
                  {...register('default_rest_seconds')}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ex-tempo">Tempo</Label>
              <Input
                id="ex-tempo"
                placeholder="3-1-2-0"
                {...register('default_tempo')}
              />
              <p className="text-xs text-muted-foreground">
                Formato: excéntrica-pausa_baja-concéntrica-pausa_alta
              </p>
            </div>
          </div>

          {/* Video URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ex-video">URL de video</Label>
            <Input
              id="ex-video"
              type="url"
              placeholder="https://youtube.com/..."
              {...register('video_url')}
            />
            {errors.video_url && (
              <p className="text-xs text-destructive">{errors.video_url.message}</p>
            )}
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
              {isPending ? 'Guardando…' : 'Crear ejercicio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
