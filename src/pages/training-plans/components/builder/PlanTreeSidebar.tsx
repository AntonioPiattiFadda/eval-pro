import { useState, useEffect, useRef, createContext, useContext } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Pencil,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { moveSession, reorderSessions } from '@/service/trainingSessions.service'
import { reorderMesocycles } from '@/service/trainingMesocycles.service'
import { reorderMicrocycles } from '@/service/trainingMicrocycles.service'
import { useSoftDeleteMesocycle } from '../../hooks/useSoftDeleteMesocycle'
import { useSoftDeleteMicrocycle } from '../../hooks/useSoftDeleteMicrocycle'
import { useSoftDeleteTrainingSession } from '../../hooks/useSoftDeleteTrainingSession'
import { useUpdateMesocycle } from '../../hooks/useUpdateMesocycle'
import { useUpdateMicrocycle } from '../../hooks/useUpdateMicrocycle'
import { trainingPlanKeys } from '../../hooks/queryKeys'
import type {
  TrainingPlanTree,
  TrainingMesocycleWithSessions,
  TrainingMicrocycleWithSessions,
  TrainingSessionWithExercises,
} from '../../types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ActiveToggle } from '@/components/ActiveToggle'
import { AddMesocycleForm } from './AddMesocycleForm'
import { AddMicrocycleForm } from './AddMicrocycleForm'
import { AddSessionForm } from './AddSessionForm'
import { EditMesocycleForm } from './EditMesocycleForm'
import { EditMicrocycleForm } from './EditMicrocycleForm'

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_SHORTS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type ActiveForm =
  | { type: 'meso'; parentId: string; parentType: string }
  | { type: 'micro'; parentId: string; parentType: 'plan' | 'mesocycle' }
  | { type: 'session'; parentId: string; parentType: 'plan' | 'mesocycle' | 'microcycle' }
  | null

function formKey(form: ActiveForm) {
  if (!form) return ''
  return `${form.type}-${form.parentId}`
}

// ─── Container ID helpers ─────────────────────────────────────────────────────
// Container IDs use prefixed format: "plan:<id>", "meso:<id>", "micro:<id>"

function planContainerId(planId: string) { return `plan:${planId}` }
function mesoContainerId(mesoId: string) { return `meso:${mesoId}` }
function microContainerId(microId: string) { return `micro:${microId}` }

function isContainerId(id: string) {
  return id.startsWith('plan:') || id.startsWith('meso:') || id.startsWith('micro:')
}

function parseContainerId(id: string): { type: 'plan' | 'meso' | 'micro'; parentId: string } {
  const [type, parentId] = id.split(':') as ['plan' | 'meso' | 'micro', string]
  return { type, parentId }
}

// ─── Session container map ────────────────────────────────────────────────────

type ContainerMap = Record<string, TrainingSessionWithExercises[]>

function buildContainerMap(plan: TrainingPlanTree): ContainerMap {
  const map: ContainerMap = {
    [planContainerId(plan.plan_id)]: plan.sessions,
  }
  for (const meso of plan.mesocycles) {
    map[mesoContainerId(meso.mesocycle_id)] = meso.sessions
    for (const micro of meso.microcycles) {
      map[microContainerId(micro.microcycle_id)] = micro.sessions
    }
  }
  for (const micro of plan.microcycles) {
    map[microContainerId(micro.microcycle_id)] = micro.sessions
  }
  return map
}

function findSessionContainer(sessionId: string, map: ContainerMap): string | undefined {
  return Object.keys(map).find((key) => map[key].some((s) => s.session_id === sessionId))
}

function findSession(sessionId: string, map: ContainerMap): TrainingSessionWithExercises | undefined {
  for (const sessions of Object.values(map)) {
    const found = sessions.find((s) => s.session_id === sessionId)
    if (found) return found
  }
}

// ─── Sidebar context (avoids prop drilling) ───────────────────────────────────

interface SidebarCtxValue {
  containerMap: ContainerMap
  activeSessionId: string | null
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
  planId: string
  activeForm: ActiveForm
  openForm: (form: ActiveForm) => void
  closeForm: () => void
}

const SidebarCtx = createContext<SidebarCtxValue | null>(null)
function useSidebar() {
  const ctx = useContext(SidebarCtx)
  if (!ctx) throw new Error('useSidebar must be inside PlanTreeSidebar')
  return ctx
}

// ─── Session row (sortable + draggable) ──────────────────────────────────────

function SortableSessionRow({ session }: { session: TrainingSessionWithExercises }) {
  const { selectedSessionId, onSelectSession, planId } = useSidebar()
  const { mutate: deleteSession, isPending: isDeletingSession } = useSoftDeleteTrainingSession(planId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.session_id,
  })

  // Hide the original when it's being dragged (DragOverlay shows it)
  const opacity = isDragging ? 0 : 1

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity }}
    >
      <div
        className={cn(
          'group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors',
          selectedSessionId === session.session_id
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-surface-container text-on-surface',
        )}
        onClick={() => onSelectSession(session.session_id)}
      >
        <button
          className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none p-0.5 text-on-surface-variant"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <span className="flex-1 truncate">{session.name}</span>
        {session.day_of_week && session.day_of_week.length > 0 && (
          <div className="flex gap-0.5 shrink-0">
            {session.day_of_week.map((d) => (
              <span key={d} className="text-xs text-on-surface-variant bg-surface-container-highest px-1 py-0.5 rounded-full">
                {DAY_SHORTS[d]}
              </span>
            ))}
          </div>
        )}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
          onClick={(e) => { e.stopPropagation(); setConfirmOpen(true) }}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar sesión"
        description="Esta acción es irreversible. Se eliminarán la sesión y todos sus ejercicios permanentemente."
        isPending={isDeletingSession}
        onConfirm={() => deleteSession(session.session_id, { onSuccess: () => setConfirmOpen(false) })}
      />
    </div>
  )
}

/** Ghost shown in DragOverlay while dragging */
function SessionRowGhost({ session }: { session: TrainingSessionWithExercises }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm bg-surface-container shadow-lg ring-1 ring-primary/30 text-on-surface cursor-grabbing">
      <GripVertical className="w-3 h-3 text-on-surface-variant" />
      <span className="flex-1 truncate">{session.name}</span>
    </div>
  )
}

// ─── Session list (droppable + sortable) ─────────────────────────────────────

function SessionList({
  containerId,
  parentId,
  parentType,
}: {
  containerId: string
  parentId: string
  parentType: 'plan' | 'mesocycle' | 'microcycle'
}) {
  const { containerMap, planId, activeForm, openForm, closeForm } = useSidebar()
  const sessions = containerMap[containerId] ?? []

  const { setNodeRef, isOver } = useDroppable({ id: containerId })

  const addForm: ActiveForm = { type: 'session', parentId, parentType }

  return (
    <div
      ref={setNodeRef}
      className={cn('flex flex-col gap-0.5 min-h-[4px] rounded-md transition-colors', isOver && 'bg-primary/5 ring-1 ring-primary/20')}
    >
      <SortableContext items={sessions.map((s) => s.session_id)} strategy={verticalListSortingStrategy}>
        {sessions.map((s) => (
          <SortableSessionRow key={s.session_id} session={s} />
        ))}
      </SortableContext>
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        onClick={() => openForm(addForm)}
      >
        <Plus className="w-3 h-3" />
        Sesión
      </button>
      {formKey(activeForm) === formKey(addForm) && (
        <AddSessionForm
          parentType={parentType}
          parentId={parentId}
          planId={planId}
          onSuccess={closeForm}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

// ─── Microcycle row ───────────────────────────────────────────────────────────

function SortableMicrocycleRow({ micro }: { micro: TrainingMicrocycleWithSessions }) {
  const { planId, activeSessionId } = useSidebar()
  const { mutate: deleteMicro, isPending: isDeletingMicro } = useSoftDeleteMicrocycle(planId)
  const { mutate: updateMicro, isPending: isTogglingMicro } = useUpdateMicrocycle(planId)
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const wasOverRef = useRef(false)

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: micro.microcycle_id,
    disabled: !!activeSessionId, // disable micro sorting while dragging a session
  })

  // The collapsed header is also a drop target for sessions
  const cId = microContainerId(micro.microcycle_id)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cId })

  // Auto-expand when a session is dragged over this collapsed micro
  useEffect(() => {
    const shouldExpand = isOver && activeSessionId && !isExpanded
    if (shouldExpand && !wasOverRef.current) {
      const id = setTimeout(() => setIsExpanded(true), 0)
      wasOverRef.current = isOver && !!activeSessionId
      return () => clearTimeout(id)
    }
    wasOverRef.current = isOver && !!activeSessionId
  }, [isOver, activeSessionId, isExpanded])

  function mergeRefs(node: HTMLDivElement | null) {
    setSortableRef(node)
    setDropRef(node)
  }

  return (
    <div
      ref={mergeRefs}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex flex-col"
    >
      {isEditing ? (
        <EditMicrocycleForm
          microcycleId={micro.microcycle_id}
          planId={planId}
          currentName={micro.name}
          currentRepeatCount={micro.repeat_count}
          currentDurationDays={micro.duration_days}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-on-surface transition-colors',
          isOver && activeSessionId ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-surface-container',
        )}>
          {!activeSessionId && (
            <button
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none p-0.5 text-on-surface-variant"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          )}
          <button className="p-0.5 text-on-surface-variant" onClick={() => setIsExpanded((v) => !v)}>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <span className="flex-1 truncate cursor-pointer" onClick={() => setIsExpanded((v) => !v)}>
            {micro.name}
          </span>
          <span className="text-xs text-on-surface-variant shrink-0">
            {micro.repeat_count}×{micro.duration_days}d
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <ActiveToggle
              isActive={micro.is_active}
              isPending={isTogglingMicro}
              onToggle={() => updateMicro({ id: micro.microcycle_id, data: { is_active: !micro.is_active } })}
            />
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-on-surface"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar microciclo"
        description="Esta acción es irreversible. Se eliminarán el microciclo, todas sus sesiones y ejercicios permanentemente."
        isPending={isDeletingMicro}
        onConfirm={() => deleteMicro(micro.microcycle_id, { onSuccess: () => setConfirmOpen(false) })}
      />

      {isExpanded && (
        <div className="pl-5 flex flex-col gap-0.5">
          <SessionList
            containerId={cId}
            parentId={micro.microcycle_id}
            parentType="microcycle"
          />
        </div>
      )}
    </div>
  )
}

// ─── Microcycle list ──────────────────────────────────────────────────────────

function MicrocycleList({
  microcycles,
  planId,
  parentId,
  parentType,
}: {
  microcycles: TrainingMicrocycleWithSessions[]
  planId: string
  parentId: string
  parentType: 'plan' | 'mesocycle'
}) {
  const { activeForm, openForm, closeForm } = useSidebar()
  const [ordered, setOrdered] = useState(microcycles)
  useEffect(() => { setOrdered(microcycles) }, [microcycles])

  const addForm: ActiveForm = { type: 'micro', parentId, parentType }

  return (
    <>
      <SortableContext items={ordered.map((m) => m.microcycle_id)} strategy={verticalListSortingStrategy}>
        {ordered.map((micro) => (
          <SortableMicrocycleRow key={micro.microcycle_id} micro={micro} />
        ))}
      </SortableContext>
      <button
        className="flex items-center gap-1 px-2 py-1 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
        onClick={() => openForm(addForm)}
      >
        <Plus className="w-3 h-3" />
        Microciclo
      </button>
      {formKey(activeForm) === formKey(addForm) && (
        <AddMicrocycleForm
          parentType={parentType}
          parentId={parentId}
          planId={planId}
          onSuccess={closeForm}
          onCancel={closeForm}
        />
      )}
    </>
  )
}

// ─── Mesocycle row ────────────────────────────────────────────────────────────

function SortableMesocycleRow({ meso }: { meso: TrainingMesocycleWithSessions }) {
  const { planId, activeSessionId } = useSidebar()
  const { mutate: deleteMeso, isPending: isDeletingMeso } = useSoftDeleteMesocycle(planId)
  const { mutate: updateMeso, isPending: isTogglingMeso } = useUpdateMesocycle(planId)
  const [isExpanded, setIsExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const wasOverRef = useRef(false)

  const { attributes, listeners, setNodeRef: setSortableRef, transform, transition, isDragging } = useSortable({
    id: meso.mesocycle_id,
    disabled: !!activeSessionId,
  })

  const cId = mesoContainerId(meso.mesocycle_id)
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: cId })

  useEffect(() => {
    const shouldExpand = isOver && activeSessionId && !isExpanded
    if (shouldExpand && !wasOverRef.current) {
      const id = setTimeout(() => setIsExpanded(true), 0)
      wasOverRef.current = isOver && !!activeSessionId
      return () => clearTimeout(id)
    }
    wasOverRef.current = isOver && !!activeSessionId
  }, [isOver, activeSessionId, isExpanded])

  function mergeRefs(node: HTMLDivElement | null) {
    setSortableRef(node)
    setDropRef(node)
  }

  return (
    <div
      ref={mergeRefs}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className="flex flex-col"
    >
      {isEditing ? (
        <EditMesocycleForm
          mesocycleId={meso.mesocycle_id}
          planId={planId}
          currentName={meso.name}
          onSuccess={() => setIsEditing(false)}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className={cn(
          'group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm font-medium text-on-surface transition-colors',
          isOver && activeSessionId ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-surface-container',
        )}>
          {!activeSessionId && (
            <button
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing touch-none p-0.5 text-on-surface-variant"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-3 h-3" />
            </button>
          )}
          <button className="p-0.5 text-on-surface-variant" onClick={() => setIsExpanded((v) => !v)}>
            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <span className="flex-1 truncate cursor-pointer" onClick={() => setIsExpanded((v) => !v)}>
            {meso.name}
          </span>
          <div onClick={(e) => e.stopPropagation()}>
            <ActiveToggle
              isActive={meso.is_active}
              isPending={isTogglingMeso}
              onToggle={() => updateMeso({ id: meso.mesocycle_id, data: { is_active: !meso.is_active } })}
            />
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-on-surface"
            onClick={(e) => { e.stopPropagation(); setIsEditing(true) }}
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar mesociclo"
        description="Esta acción es irreversible. Se eliminarán el mesociclo, sus microciclos, sesiones y ejercicios permanentemente."
        isPending={isDeletingMeso}
        onConfirm={() => deleteMeso(meso.mesocycle_id, { onSuccess: () => setConfirmOpen(false) })}
      />

      {isExpanded && (
        <div className="pl-4 flex flex-col gap-0.5">
          <MicrocycleList
            microcycles={meso.microcycles}
            planId={planId}
            parentId={meso.mesocycle_id}
            parentType="mesocycle"
          />
          <p className="px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider py-1">Sesiones aisladas</p>
          <SessionList
            containerId={cId}
            parentId={meso.mesocycle_id}
            parentType="mesocycle"
          />
        </div>
      )}
    </div>
  )
}

// ─── Mesocycle list ───────────────────────────────────────────────────────────

function MesocycleList({ mesocycles }: { mesocycles: TrainingMesocycleWithSessions[] }) {
  const [ordered, setOrdered] = useState(mesocycles)
  useEffect(() => { setOrdered(mesocycles) }, [mesocycles])

  // Expose setter so the parent DndContext can call it on drag end
  return (
    <SortableContext items={ordered.map((m) => m.mesocycle_id)} strategy={verticalListSortingStrategy}>
      {ordered.map((meso) => (
        <SortableMesocycleRow key={meso.mesocycle_id} meso={meso} />
      ))}
    </SortableContext>
  )
}

// ─── PlanTreeSidebar ──────────────────────────────────────────────────────────

interface PlanTreeSidebarProps {
  plan: TrainingPlanTree
  planId: string
  selectedSessionId: string | null
  onSelectSession: (id: string) => void
}

export function PlanTreeSidebar({
  plan,
  planId,
  selectedSessionId,
  onSelectSession,
}: PlanTreeSidebarProps) {
  const queryClient = useQueryClient()
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [containerMap, setContainerMap] = useState<ContainerMap>(() => buildContainerMap(plan))

  // Keep container map in sync when plan refetches
  useEffect(() => { setContainerMap(buildContainerMap(plan)) }, [plan])

  // Track original container at drag start (for cross-container detection)
  const originalContainerRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function openForm(form: ActiveForm) {
    setActiveForm((prev) => (formKey(prev) === formKey(form) ? null : form))
  }
  function closeForm() { setActiveForm(null) }

  // ── Drag handlers ───────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const id = event.active.id as string
    originalContainerRef.current = findSessionContainer(id, containerMap) ?? null
    setActiveSessionId(id)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = active.id as string
    const overId = over.id as string

    const sourceContainer = findSessionContainer(activeId, containerMap)
    if (!sourceContainer) return // not a session being dragged

    // Determine target container
    const targetContainer = isContainerId(overId)
      ? overId
      : findSessionContainer(overId, containerMap)

    if (!targetContainer || sourceContainer === targetContainer) return

    // Move session between containers in local state
    setContainerMap((prev) => {
      const sourceItems = prev[sourceContainer] ?? []
      const targetItems = prev[targetContainer] ?? []
      const activeItem = sourceItems.find((s) => s.session_id === activeId)
      if (!activeItem) return prev

      const overIndex = targetItems.findIndex((s) => s.session_id === overId)
      const newTargetItems = overIndex >= 0
        ? [...targetItems.slice(0, overIndex), activeItem, ...targetItems.slice(overIndex)]
        : [...targetItems, activeItem]

      return {
        ...prev,
        [sourceContainer]: sourceItems.filter((s) => s.session_id !== activeId),
        [targetContainer]: newTargetItems,
      }
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    const activeId = active.id as string
    setActiveSessionId(null)

    if (!over) {
      setContainerMap(buildContainerMap(plan))
      return
    }

    const overId = over.id as string

    // ── Mesocycle reorder ──────────────────────────────────────────────────
    const isMeso = plan.mesocycles.some((m) => m.mesocycle_id === activeId)
    if (isMeso) {
      const oldIndex = plan.mesocycles.findIndex((m) => m.mesocycle_id === activeId)
      const newIndex = plan.mesocycles.findIndex((m) => m.mesocycle_id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const next = arrayMove(plan.mesocycles, oldIndex, newIndex)
        reorderMesocycles(next.map((m, i) => ({ mesocycle_id: m.mesocycle_id, order_index: i })))
        queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
      }
      return
    }

    // ── Microcycle reorder ─────────────────────────────────────────────────
    const allMicros = [...plan.microcycles, ...plan.mesocycles.flatMap((m) => m.microcycles)]
    const isMicro = allMicros.some((m) => m.microcycle_id === activeId)
    if (isMicro) {
      // Find the parent list of both active and over
      const activeMicro = allMicros.find((m) => m.microcycle_id === activeId)!
      const overMicro = allMicros.find((m) => m.microcycle_id === overId)
      if (!overMicro) return
      // Must be in the same parent group to reorder
      const parentList = allMicros.filter((m) =>
        m.mesocycle_id === activeMicro.mesocycle_id && m.plan_id === activeMicro.plan_id
      )
      const oldIndex = parentList.findIndex((m) => m.microcycle_id === activeId)
      const newIndex = parentList.findIndex((m) => m.microcycle_id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const next = arrayMove(parentList, oldIndex, newIndex)
        reorderMicrocycles(next.map((m, i) => ({ microcycle_id: m.microcycle_id, order_index: i })))
        queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
      }
      return
    }

    // ── Session reorder / cross-container move ─────────────────────────────
    const currentContainer = findSessionContainer(activeId, containerMap)
    if (!currentContainer) return

    const isCrossContainer = originalContainerRef.current !== currentContainer

    if (!isCrossContainer) {
      // ── Same container: reorder ────────────────────────────────────────────
      const isMesoMicro = isContainerId(overId)
        ? false
        : !findSessionContainer(overId, containerMap) // over a meso/micro sortable item

      if (isMesoMicro) return // over a non-session; do nothing

      const sessions = containerMap[currentContainer]
      const oldIndex = sessions.findIndex((s) => s.session_id === activeId)
      const newIndex = sessions.findIndex((s) => s.session_id === overId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const next = arrayMove(sessions, oldIndex, newIndex)
      setContainerMap((prev) => ({ ...prev, [currentContainer]: next }))
      reorderSessions(next.map((s, i) => ({ session_id: s.session_id, order_index: i })))
    } else {
      // ── Cross-container: move session ──────────────────────────────────────
      const { type, parentId } = parseContainerId(currentContainer)
      const sessions = containerMap[currentContainer]
      const order_index = sessions.findIndex((s) => s.session_id === activeId)

      moveSession(activeId, {
        plan_id: type === 'plan' ? parentId : null,
        mesocycle_id: type === 'meso' ? parentId : null,
        microcycle_id: type === 'micro' ? parentId : null,
        order_index,
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: trainingPlanKeys.tree(planId) })
      })
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const addMesoForm: ActiveForm = { type: 'meso', parentId: planId, parentType: 'plan' }
  const addDirectMicroForm: ActiveForm = { type: 'micro', parentId: planId, parentType: 'plan' }

  const activeSession = activeSessionId ? findSession(activeSessionId, containerMap) : null

  const ctxValue: SidebarCtxValue = {
    containerMap,
    activeSessionId,
    selectedSessionId,
    onSelectSession,
    planId,
    activeForm,
    openForm,
    closeForm,
  }

  return (
    <SidebarCtx.Provider value={ctxValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-1 p-3">
          {/* Plan header */}
          <div className="px-2 py-2 mb-1">
            <p className="font-display font-semibold text-sm text-on-surface truncate">{plan.name}</p>
          </div>

          {/* Top-level actions */}
          <div className="flex gap-1 mb-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => openForm(addMesoForm)}>
              <Plus className="w-3 h-3" />Mesociclo
            </Button>
            <Button size="sm" variant="outline" className="flex-1 text-xs h-7 gap-1" onClick={() => openForm(addDirectMicroForm)}>
              <Plus className="w-3 h-3" />Microciclo
            </Button>
          </div>

          {formKey(activeForm) === formKey(addMesoForm) && (
            <AddMesocycleForm planId={planId} onSuccess={closeForm} onCancel={closeForm} />
          )}
          {formKey(activeForm) === formKey(addDirectMicroForm) && (
            <AddMicrocycleForm parentType="plan" parentId={planId} planId={planId} onSuccess={closeForm} onCancel={closeForm} />
          )}

          {/* Mesocycles */}
          {plan.mesocycles.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <p className="px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider py-1">Mesociclos</p>
              <MesocycleList mesocycles={plan.mesocycles} />
            </div>
          )}

          {/* Plan-level microcycles */}
          {plan.microcycles.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <p className="px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider py-1">Microciclos</p>
              <MicrocycleList
                microcycles={plan.microcycles}
                planId={planId}
                parentId={planId}
                parentType="plan"
              />
            </div>
          )}

          {/* Plan-level sessions */}
          <div className="flex flex-col gap-0.5">
            <p className="px-2 text-xs font-medium text-on-surface-variant uppercase tracking-wider py-1">Sesiones aisladas</p>
            <SessionList
              containerId={planContainerId(planId)}
              parentId={planId}
              parentType="plan"
            />
          </div>
        </div>

        {/* Drag overlay — ghost that follows the cursor */}
        <DragOverlay>
          {activeSession && <SessionRowGhost session={activeSession} />}
        </DragOverlay>
      </DndContext>
    </SidebarCtx.Provider>
  )
}
