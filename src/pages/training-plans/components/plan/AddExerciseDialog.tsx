import { useState } from 'react'
import type React from 'react'
import { Search, ChevronLeft, Info } from 'lucide-react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useTrainingExercises } from '../../hooks/useTrainingExercises'
import { useCreateSessionExercise } from '../../hooks/useCreateSessionExercise'
import type { TrainingExercise, LoadUnit } from '../../types'

interface AddExerciseDialogProps {
  sessionId: string
  planId: string
  open: boolean
  onOpenChange: (v: boolean) => void
}

interface PrescriptionState {
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

function FieldLabel({ children, tip }: { children: React.ReactNode; tip: string }) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Label className="text-xs">{children}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="w-3 h-3 text-on-surface-variant cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{tip}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

function defaultPrescription(ex: TrainingExercise): PrescriptionState {
  return {
    sets: ex.default_sets ?? 3,
    reps: ex.default_reps != null ? String(ex.default_reps) : '',
    set_duration_seconds: '',
    rep_duration_seconds: '',
    load_value: '',
    load_unit: 'NONE',
    rest_seconds: ex.default_rest_seconds != null ? String(ex.default_rest_seconds) : '',
    group_label: '',
    notes: '',
  }
}

export function AddExerciseDialog({
  sessionId,
  planId,
  open,
  onOpenChange,
}: AddExerciseDialogProps) {
  const { profile } = useAuth()
  const organizationId = profile?.organization_id ?? ''

  const { data: exercises = [], isLoading } = useTrainingExercises(organizationId)
  const { mutate: createExercise, isPending } = useCreateSessionExercise(planId)

  const [search, setSearch] = useState('')
  const [selectedExercise, setSelectedExercise] = useState<TrainingExercise | null>(null)
  const [prescription, setPrescription] = useState<PrescriptionState | null>(null)

  function handleSelectExercise(ex: TrainingExercise) {
    setSelectedExercise(ex)
    setPrescription(defaultPrescription(ex))
  }

  function handleBack() {
    setSelectedExercise(null)
    setPrescription(null)
  }

  function handleClose(v: boolean) {
    if (!v) {
      setSearch('')
      setSelectedExercise(null)
      setPrescription(null)
    }
    onOpenChange(v)
  }

  function patchPrescription(patch: Partial<PrescriptionState>) {
    setPrescription((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  function handleSubmit() {
    if (!selectedExercise || !prescription) return

    const reps = prescription.reps !== '' ? parseInt(prescription.reps, 10) : undefined
    const setDuration =
      prescription.set_duration_seconds !== ''
        ? parseInt(prescription.set_duration_seconds, 10)
        : undefined

    createExercise(
      {
        session_id: sessionId,
        exercise_id: selectedExercise.exercise_id,
        organization_id: organizationId,
        sets: prescription.sets,
        reps,
        set_duration_seconds: setDuration,
        rep_duration_seconds:
          prescription.rep_duration_seconds !== ''
            ? parseInt(prescription.rep_duration_seconds, 10)
            : undefined,
        load_value:
          prescription.load_unit !== 'NONE' && prescription.load_value !== ''
            ? parseFloat(prescription.load_value)
            : undefined,
        load_unit:
          prescription.load_unit !== 'NONE' && prescription.load_value === ''
            ? 'NONE'
            : prescription.load_unit,
        rest_seconds:
          prescription.rest_seconds !== ''
            ? parseInt(prescription.rest_seconds, 10)
            : undefined,
        group_label: prescription.group_label !== '' ? prescription.group_label : undefined,
        notes: prescription.notes !== '' ? prescription.notes : undefined,
      },
      {
        onSuccess: () => handleClose(false),
      },
    )
  }

  const filtered = exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()),
  )


  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {selectedExercise && (
              <button
                onClick={handleBack}
                className="p-1 rounded hover:bg-surface-container transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-on-surface-variant" />
              </button>
            )}
            <DialogTitle className="font-display">
              {selectedExercise ? selectedExercise.name : 'Seleccionar ejercicio'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Step 1: Exercise selection */}
        {!selectedExercise && (
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar ejercicio…"
                className="pl-10"
              />
            </div>

            <div className="flex flex-col gap-1 max-h-80 overflow-y-auto">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                  <Skeleton className="h-12 rounded-lg" />
                </>
              ) : filtered.length === 0 ? (
                <p className="text-center text-sm text-on-surface-variant py-8">
                  Sin resultados
                </p>
              ) : (
                filtered.map((ex) => (
                  <button
                    key={ex.exercise_id}
                    onClick={() => handleSelectExercise(ex)}
                    className="flex flex-col gap-0.5 px-3 py-2 rounded-lg hover:bg-surface-container text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-on-surface">{ex.name}</span>
                    <div className="flex gap-2 flex-wrap">
                      {ex.execution_type && (
                        <span className="text-xs text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded-full">
                          {ex.execution_type}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Prescription form */}
        {selectedExercise && prescription && (
          <div className="flex flex-col gap-4">

            {/* Row 1 — Volumen */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1">
                <FieldLabel tip="Cuántas veces se repite el bloque completo de repeticiones o tiempo.">Series</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={prescription.sets}
                  onChange={(e) => patchPrescription({ sets: parseInt(e.target.value, 10) || 1 })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel tip="Repeticiones por serie. Combinable con Duración.">Reps</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={prescription.reps}
                  onChange={(e) => patchPrescription({ reps: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <FieldLabel tip="Segundos por serie. Combinable con Reps (ej: 5×10s = sentadilla isométrica).">Duración (s)</FieldLabel>
                <Input
                  type="number"
                  min={1}
                  value={prescription.set_duration_seconds}
                  onChange={(e) => patchPrescription({ set_duration_seconds: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 2 — Carga */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <FieldLabel tip="Cómo se expresa la carga: KG absolutos, % del máximo (1RM), esfuerzo percibido (RPE 1–10) o % de la velocidad máxima.">Unidad carga</FieldLabel>
                <Select
                  value={prescription.load_unit}
                  onValueChange={(val) =>
                    patchPrescription({
                      load_unit: val as LoadUnit,
                      load_value: val === 'NONE' ? '' : prescription.load_value,
                    })
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
              <div className="flex flex-col gap-1">
                <FieldLabel tip="Valor numérico de la unidad seleccionada (ej: 80 kg, 75% 1RM, RPE 8, 70% velocidad).">Carga</FieldLabel>
                <Input
                  type="number"
                  min={0}
                  step={0.5}
                  value={prescription.load_value}
                  disabled={prescription.load_unit === 'NONE'}
                  placeholder={prescription.load_unit === 'NONE' ? '—' : undefined}
                  onChange={(e) => patchPrescription({ load_value: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 3 — Descanso */}
            <div className="flex flex-col gap-1">
              <FieldLabel tip="Segundos de descanso entre series. En supersets, aplica entre rondas completas del grupo.">Descanso (s)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={prescription.rest_seconds}
                onChange={(e) => patchPrescription({ rest_seconds: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            {/* Row 4 — Grupo superserie */}
            <div className="flex flex-col gap-1">
              <FieldLabel tip="Agrupa ejercicios en superserie o circuito. Misma etiqueta = se ejecutan uno tras otro sin descanso (ej: A, B, C).">Grupo (superserie)</FieldLabel>
              <Input
                value={prescription.group_label}
                onChange={(e) => patchPrescription({ group_label: e.target.value })}
                placeholder="A, B…"
                className="h-8 text-sm"
              />
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1">
              <FieldLabel tip="Indicaciones técnicas libres para el paciente (ej: 'codos adentro', 'bajar en 3 segundos').">Notas</FieldLabel>
              <Input
                value={prescription.notes}
                onChange={(e) => patchPrescription({ notes: e.target.value })}
                placeholder="Indicaciones técnicas…"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={handleBack}
                disabled={isPending}
              >
                Volver
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? 'Agregando…' : 'Agregar al plan'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
