import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Dumbbell, Plus, Tag, Pencil, Trash2, Power } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  listGlobalExercises,
  toggleExerciseActive,
  deleteExercise,
} from '@/service/trainingExercises.service'
import { listExerciseTags } from '@/service/exerciseTags.service'
import { CreateExerciseDialog } from './components/CreateExerciseDialog'
import { EditExerciseDialog } from './components/EditExerciseDialog'
import { TagManager } from './components/TagManager'
import type { TrainingExercise } from '@/pages/training-plans/types'
import { cn } from '@/lib/utils'

const TOAST_TOGGLE = 'toggle-exercise'
const TOAST_DELETE = 'delete-exercise'

const EXECUTION_TYPE_LABEL: Record<string, string> = {
  EXPLOSIVE: 'Explosivo',
  CONTROLLED: 'Controlado',
  ISOMETRIC: 'Isométrico',
  BALLISTIC: 'Balístico',
}

export function ExerciseBankPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [tagManagerOpen, setTagManagerOpen] = useState(false)
  const [editingExercise, setEditingExercise] = useState<TrainingExercise | null>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { data: exercises, isLoading } = useQuery({
    queryKey: ['global-exercises'],
    queryFn: listGlobalExercises,
    staleTime: 30_000,
  })

  const { data: allTags = [] } = useQuery({
    queryKey: ['exercise-tags'],
    queryFn: listExerciseTags,
    staleTime: 60_000,
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) =>
      toggleExerciseActive(id, value),
    onMutate: () => { toast.loading('Actualizando…', { id: TOAST_TOGGLE }) },
    onSuccess: () => {
      toast.success('Estado actualizado', { id: TOAST_TOGGLE })
      queryClient.invalidateQueries({ queryKey: ['global-exercises'] })
    },
    onError: (err: Error) => { toast.error(err.message, { id: TOAST_TOGGLE }) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExercise,
    onMutate: () => { toast.loading('Eliminando…', { id: TOAST_DELETE }) },
    onSuccess: () => {
      toast.success('Ejercicio eliminado', { id: TOAST_DELETE })
      queryClient.invalidateQueries({ queryKey: ['global-exercises'] })
      setConfirmDeleteId(null)
    },
    onError: (err: Error) => { toast.error(err.message, { id: TOAST_DELETE }) },
  })

  const filtered =
    !exercises || selectedTagIds.length === 0
      ? (exercises ?? [])
      : exercises.filter((ex) =>
          selectedTagIds.every((tid) => ex.tags.some((t) => t.tag_id === tid))
        )

  function toggleFilter(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-2xl font-semibold">Banco de ejercicios globales</h1>
          <p className="text-sm text-on-surface-variant">
            Ejercicios del sistema disponibles para todas las organizaciones
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTagManagerOpen(true)} className="gap-2">
            <Tag className="h-4 w-4" />
            Etiquetas
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo ejercicio
          </Button>
        </div>
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => {
            const active = selectedTagIds.includes(tag.tag_id)
            return (
              <button
                key={tag.tag_id}
                onClick={() => toggleFilter(tag.tag_id)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white/10 text-on-surface-variant hover:bg-white/15'
                )}
              >
                {tag.name}
              </button>
            )
          })}
          {selectedTagIds.length > 0 && (
            <button
              onClick={() => setSelectedTagIds([])}
              className="rounded-full px-3 py-1 text-sm text-on-surface-variant hover:bg-white/10"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl bg-surface-container-high overflow-hidden">
        {isLoading ? (
          <ExerciseTableSkeleton />
        ) : !filtered.length ? (
          exercises?.length ? (
            <NoResults onClear={() => setSelectedTagIds([])} />
          ) : (
            <EmptyState onAdd={() => setCreateOpen(true)} />
          )
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant">
                <th className="px-4 py-3 text-left font-medium">Nombre</th>
                <th className="px-4 py-3 text-left font-medium">Etiquetas</th>
                <th className="px-4 py-3 text-left font-medium">Tipo de ejecución</th>
                <th className="px-4 py-3 text-center font-medium">Series</th>
                <th className="px-4 py-3 text-center font-medium">Reps</th>
                <th className="px-4 py-3 text-center font-medium">Activo</th>
                <th className="px-4 py-3 text-center font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex, i) => (
                <tr
                  key={ex.exercise_id}
                  className={cn(
                    i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]',
                    !ex.is_active && 'opacity-50'
                  )}
                >
                  <td className="px-4 py-3 font-medium">{ex.name}</td>
                  <td className="px-4 py-3">
                    {ex.tags.length ? (
                      <div className="flex flex-wrap gap-1">
                        {ex.tags.map((t) => (
                          <span
                            key={t.tag_id}
                            className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-on-surface-variant"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {ex.execution_type
                      ? EXECUTION_TYPE_LABEL[ex.execution_type] ?? ex.execution_type
                      : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-on-surface-variant">
                    {ex.default_sets ?? <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-on-surface-variant">
                    {ex.default_reps ?? <span className="text-white/20">—</span>}
                  </td>

                  {/* is_active toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        toggleMutation.mutate({ id: ex.exercise_id, value: !ex.is_active })
                      }
                      disabled={toggleMutation.isPending}
                      title={ex.is_active ? 'Desactivar' : 'Activar'}
                      className={cn(
                        'rounded-full p-1.5 transition-colors',
                        ex.is_active
                          ? 'text-emerald-400 hover:bg-emerald-400/10'
                          : 'text-white/30 hover:bg-white/10'
                      )}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingExercise(ex)}
                        title="Editar"
                        className="rounded-md p-1.5 text-on-surface-variant hover:bg-white/10 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      {confirmDeleteId === ex.exercise_id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => deleteMutation.mutate(ex.exercise_id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-md px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-md px-2 py-1 text-xs text-on-surface-variant hover:bg-white/10 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(ex.exercise_id)}
                          title="Eliminar"
                          className="rounded-md p-1.5 text-on-surface-variant hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <CreateExerciseDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditExerciseDialog exercise={editingExercise} onOpenChange={(v) => !v && setEditingExercise(null)} />
      <TagManager open={tagManagerOpen} onOpenChange={setTagManagerOpen} />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExerciseTableSkeleton() {
  return (
    <div className="flex flex-col gap-0">
      <div className="flex gap-4 px-4 py-3 border-b border-white/5">
        {[200, 160, 130, 60, 60, 50, 80].map((w, i) => (
          <Skeleton key={i} className="h-4 rounded" style={{ width: w }} />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3">
          {[180, 140, 110, 40, 40, 30, 60].map((w, j) => (
            <Skeleton key={j} className="h-4 rounded" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="rounded-xl bg-white/5 p-4">
        <Dumbbell className="h-8 w-8 text-on-surface-variant" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">No hay ejercicios globales</p>
        <p className="text-sm text-on-surface-variant">
          Creá el primer ejercicio del sistema para que todas las organizaciones puedan usarlo.
        </p>
      </div>
      <Button onClick={onAdd} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Nuevo ejercicio
      </Button>
    </div>
  )
}

function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="font-medium">Sin resultados para los filtros activos</p>
      <Button variant="ghost" size="sm" onClick={onClear}>
        Limpiar filtros
      </Button>
    </div>
  )
}
