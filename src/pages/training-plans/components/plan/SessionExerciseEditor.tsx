import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
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
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActiveToggle } from '@/components/ActiveToggle'
import { useUpdateSessionExercise } from '../../hooks/useUpdateSessionExercise'
import { useSoftDeleteSessionExercise } from '../../hooks/useSoftDeleteSessionExercise'
import { useToggleSessionActive } from '../../hooks/useToggleSessionActive'
import type { TrainingSessionWithExercises, TrainingSessionExerciseWithName, LoadUnit } from '../../types'
import { AddExerciseDialog } from './AddExerciseDialog'

const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface SessionExerciseEditorProps {
  session: TrainingSessionWithExercises
  planId: string
}

interface EditState {
  sets: number
  reps: string
  set_duration_seconds: string
  rep_duration_seconds: string
  load_value: string
  load_unit: LoadUnit
  rest_seconds: string
  group_label: string
  notes: string
}

function buildEditState(ex: TrainingSessionExerciseWithName): EditState {
  return {
    sets: ex.sets,
    reps: ex.reps != null ? String(ex.reps) : '',
    set_duration_seconds: ex.set_duration_seconds != null ? String(ex.set_duration_seconds) : '',
    rep_duration_seconds: ex.rep_duration_seconds != null ? String(ex.rep_duration_seconds) : '',
    load_value: ex.load_value != null ? String(ex.load_value) : '',
    load_unit: ex.load_unit,
    rest_seconds: ex.rest_seconds != null ? String(ex.rest_seconds) : '',
    group_label: ex.group_label ?? '',
    notes: ex.notes ?? '',
  }
}

export function SessionExerciseEditor({ session, planId }: SessionExerciseEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editStates, setEditStates] = useState<Record<string, EditState>>({})
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  const { mutate: updateExercise, isPending: isUpdating } = useUpdateSessionExercise(planId)
  const { mutate: deleteExercise, isPending: isDeleting } = useSoftDeleteSessionExercise(planId)
  const { mutate: toggleActive, isPending: isTogglingActive } = useToggleSessionActive(planId)

  function startEdit(ex: TrainingSessionExerciseWithName) {
    setEditingId(ex.session_exercise_id)
    setEditStates((prev) => ({
      ...prev,
      [ex.session_exercise_id]: buildEditState(ex),
    }))
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function patchEditState(id: string, patch: Partial<EditState>) {
    setEditStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }))
  }

  function saveEdit(ex: TrainingSessionExerciseWithName) {
    const state = editStates[ex.session_exercise_id]
    if (!state) return

    const reps = state.reps !== '' ? parseInt(state.reps, 10) : null
    const setDuration = state.set_duration_seconds !== '' ? parseInt(state.set_duration_seconds, 10) : null

    updateExercise(
      {
        session_exercise_id: ex.session_exercise_id,
        sets: state.sets,
        reps,
        set_duration_seconds: setDuration,
        load_value:
          state.load_unit !== 'NONE' && state.load_value !== ''
            ? parseFloat(state.load_value)
            : null,
        load_unit:
          state.load_unit !== 'NONE' && state.load_value === ''
            ? 'NONE'
            : state.load_unit,
        rest_seconds: state.rest_seconds !== '' ? parseInt(state.rest_seconds, 10) : null,
        group_label: state.group_label !== '' ? state.group_label : null,
        notes: state.notes !== '' ? state.notes : null,
      },
      { onSuccess: () => setEditingId(null) },
    )
  }

  const renderEx = (ex: TrainingSessionExerciseWithName) => (
    <>
      <div className="flex items-center gap-2">
        <span className="font-medium text-on-surface flex-1">{ex.exercise_name}</span>
        {ex.execution_type && (
          <span className="bg-surface-container-highest text-xs px-2 py-0.5 rounded-full text-on-surface-variant shrink-0">
            {ex.execution_type}
          </span>
        )}
        <div className="flex gap-1 ml-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => editingId === ex.session_exercise_id ? cancelEdit() : startEdit(ex)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive"
            onClick={() => setPendingDeleteId(ex.session_exercise_id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      {editingId !== ex.session_exercise_id && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-on-surface-variant">
          <span>
            {ex.sets} series
            {ex.reps != null && ` × ${ex.reps} reps`}
            {ex.set_duration_seconds != null && ` × ${ex.set_duration_seconds}s`}
          </span>
          {ex.load_value != null && ex.load_unit !== 'NONE' && (
            <span>{ex.load_value} {ex.load_unit}</span>
          )}
          {ex.rest_seconds != null && <span>Descanso: {ex.rest_seconds}s</span>}
        </div>
      )}
      {editingId === ex.session_exercise_id && editStates[ex.session_exercise_id] && (
        <InlineEditForm
          state={editStates[ex.session_exercise_id]}
          onChange={(patch) => patchEditState(ex.session_exercise_id, patch)}
          onSave={() => saveEdit(ex)}
          onCancel={cancelEdit}
          isPending={isUpdating}
        />
      )}
    </>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-semibold text-on-surface">{session.name}</h2>
            <ActiveToggle
              isActive={session.is_active}
              isPending={isTogglingActive}
              onToggle={() => toggleActive({ sessionId: session.session_id, isActive: !session.is_active })}
            />
          </div>
          {session.day_of_week && session.day_of_week.length > 0 && (
            <p className="text-sm text-on-surface-variant">
              {session.day_of_week.map((d) => DAY_LABELS[d]).join(' · ')}
            </p>
          )}
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          size="sm"
          className="flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Agregar ejercicio
        </Button>
      </div>

      {/* Exercise list */}
      {session.exercises.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-surface-container-low rounded-xl">
          <p className="text-on-surface-variant text-sm">Sin ejercicios aún</p>
          <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(true)} className="gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Agregar ejercicio
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {groupExercises(session.exercises).map((group) => {
            if (group.type === 'single') {
              const ex = group.exercise
              return (
                <div key={ex.session_exercise_id} className="bg-surface-container-high rounded-xl p-4 flex flex-col gap-3">
                  {renderEx(ex)}
                </div>
              )
            }
            return (
              <div key={`group-${group.label}`} className="rounded-xl border border-outline-variant overflow-hidden">
                <div className="px-3 py-2 bg-primary/5 border-b border-outline-variant flex items-center gap-2">
                  <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {group.label}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {group.exercises.length} ejercicios · realizar en bloque
                  </span>
                </div>
                {group.exercises.map((ex, i) => (
                  <div
                    key={ex.session_exercise_id}
                    className={cn(
                      'bg-surface-container-high p-4 flex flex-col gap-3',
                      i < group.exercises.length - 1 && 'border-b border-surface-container',
                    )}
                  >
                    {renderEx(ex)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}

      <AddExerciseDialog
        sessionId={session.session_id}
        planId={planId}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <ConfirmDialog
        open={!!pendingDeleteId}
        onOpenChange={(v) => { if (!v) setPendingDeleteId(null) }}
        title="Eliminar ejercicio"
        description="Esta acción es irreversible. El ejercicio se eliminará permanentemente de la sesión."
        isPending={isDeleting}
        onConfirm={() => {
          if (!pendingDeleteId) return
          deleteExercise(pendingDeleteId, { onSuccess: () => setPendingDeleteId(null) })
        }}
      />
    </div>
  )
}

// ─── Inline edit form ─────────────────────────────────────────────────────────

interface InlineEditFormProps {
  state: EditState
  onChange: (patch: Partial<EditState>) => void
  onSave: () => void
  onCancel: () => void
  isPending: boolean
}

function InlineEditForm({ state, onChange, onSave, onCancel, isPending }: InlineEditFormProps) {

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Sets */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Series</Label>
          <Input
            type="number"
            min={1}
            value={state.sets}
            onChange={(e) => onChange({ sets: parseInt(e.target.value, 10) || 1 })}
            className="h-8 text-sm"
          />
        </div>

        {/* Reps */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Reps</Label>
          <Input
            type="number"
            min={1}
            value={state.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Set duration */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Duración (s)</Label>
          <Input
            type="number"
            min={1}
            value={state.set_duration_seconds}
            onChange={(e) => onChange({ set_duration_seconds: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Load unit */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Unidad carga</Label>
          <Select
            value={state.load_unit}
            onValueChange={(val) =>
              onChange({ load_unit: val as LoadUnit, load_value: val === 'NONE' ? '' : state.load_value })
            }
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="PERCENTAGE_1RM">% 1RM</SelectItem>
              <SelectItem value="RPE">RPE</SelectItem>
              <SelectItem value="PERCENTAGE_VELOCITY">% Velocidad</SelectItem>
              <SelectItem value="NONE">Sin carga</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Load value */}
        {state.load_unit !== 'NONE' && (
          <div className="flex flex-col gap-1">
            <Label className="text-xs">Carga</Label>
            <Input
              type="number"
              min={0}
              step={0.5}
              value={state.load_value}
              onChange={(e) => onChange({ load_value: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Rest seconds */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Descanso (s)</Label>
          <Input
            type="number"
            min={0}
            value={state.rest_seconds}
            onChange={(e) => onChange({ rest_seconds: e.target.value })}
            className="h-8 text-sm"
          />
        </div>

        {/* Group label */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Grupo (superserie)</Label>
          <Input
            value={state.group_label}
            onChange={(e) => onChange({ group_label: e.target.value })}
            placeholder="A, B…"
            className="h-8 text-sm"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Notas</Label>
        <Input
          value={state.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Indicaciones técnicas…"
          className="h-8 text-sm"
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
        <Button size="sm" onClick={onSave} disabled={isPending}>
          {isPending ? 'Guardando…' : 'Guardar'}
        </Button>
      </div>
    </div>
  )
}

// ─── Group exercises by group_label ──────────────────────────────────────────

type ExerciseGroup =
  | { type: 'single'; exercise: TrainingSessionExerciseWithName }
  | { type: 'group'; label: string; exercises: TrainingSessionExerciseWithName[] }

function groupExercises(exercises: TrainingSessionExerciseWithName[]): ExerciseGroup[] {
  const result: ExerciseGroup[] = []
  const seen = new Map<string, TrainingSessionExerciseWithName[]>()

  for (const ex of exercises) {
    if (!ex.group_label) {
      result.push({ type: 'single', exercise: ex })
    } else {
      const existing = seen.get(ex.group_label)
      if (existing) {
        existing.push(ex)
      } else {
        const list = [ex]
        seen.set(ex.group_label, list)
        result.push({ type: 'group', label: ex.group_label, exercises: list })
      }
    }
  }

  return result
}
