// ─── Exercise Tags ────────────────────────────────────────────────────────────

export interface ExerciseTag {
  tag_id: string
  name: string
  created_at: string
}

// ─── Unions ───────────────────────────────────────────────────────────────────

export type LoadUnit = 'KG' | 'PERCENTAGE_1RM' | 'RPE' | 'PERCENTAGE_VELOCITY' | 'NONE'

export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'

/** How the exercise is meant to be executed — drives video content and default tempo */
export type ExecutionType = 'EXPLOSIVE' | 'CONTROLLED' | 'ISOMETRIC' | 'BALLISTIC'

// ─── Entities ─────────────────────────────────────────────────────────────────

export interface TrainingExercise {
  exercise_id: string
  name: string
  description: string | null
  tags: ExerciseTag[]
  video_url: string | null
  execution_type: ExecutionType | null
  /** Default tempo notation e.g. "3-1-2-0" (eccentric-pause_bottom-concentric-pause_top) */
  default_tempo: string | null
  default_sets: number | null
  default_reps: number | null
  default_rest_seconds: number | null
  is_active: boolean
  /** NULL = global system exercise available to all orgs */
  organization_id: string | null
  deleted_at: string | null
  created_at: string
}

export interface TrainingPlan {
  plan_id: string
  name: string
  description: string | null
  patient_id: string
  organization_id: string
  professional_id: string
  /** ISO date string (YYYY-MM-DD); nullable because the plan may be created before dates are set */
  start_date: string | null
  /** ISO date string (YYYY-MM-DD) */
  end_date: string | null
  is_active: boolean
  /** Soft-delete marker; non-null means the plan is logically deleted */
  deleted_at: string | null
  created_at: string
}

export interface TrainingMesocycle {
  mesocycle_id: string
  /** Parent plan — mesocycles attach directly to plans (no macrocycle level) */
  plan_id: string
  name: string
  order_index: number
  is_active: boolean
  deleted_at: string | null
  organization_id: string
  created_at: string
}

export interface TrainingMicrocycle {
  microcycle_id: string
  /** Set when the microcycle belongs to a mesocycle; XOR with plan_id */
  mesocycle_id: string | null
  /** Set when the microcycle attaches directly to the plan (no mesocycle); XOR with mesocycle_id */
  plan_id: string | null
  name: string
  order_index: number
  /** How many times this template week repeats. Default 1. e.g. 4 = a 4-week block */
  repeat_count: number
  /** Duration of one repetition in days. Default 7 (weekly). Can be 14 or 30 for clinical protocols */
  duration_days: number
  is_active: boolean
  deleted_at: string | null
  organization_id: string
  created_at: string
}

export interface TrainingSession {
  session_id: string
  /** Set when the session belongs to a microcycle; XOR with mesocycle_id and plan_id */
  microcycle_id: string | null
  /** Set when the session attaches directly to a mesocycle (no microcycle); XOR with others */
  mesocycle_id: string | null
  /** Set when the session attaches directly to the plan (no hierarchy); XOR with others */
  plan_id: string | null
  name: string
  /** 0 = Monday … 6 = Sunday; multiple days supported (e.g. [0,2,4] = Mon/Wed/Fri) */
  day_of_week: number[] | null
  order_index: number
  is_active: boolean
  deleted_at: string | null
  organization_id: string
  created_at: string
}

export interface TrainingSessionExercise {
  session_exercise_id: string
  session_id: string
  exercise_id: string
  sets: number
  /** XOR with set_duration_seconds — exactly one must be set */
  reps: number | null
  /** XOR with reps — duration in seconds for time-based sets (e.g. planks) */
  set_duration_seconds: number | null
  /** Only valid when reps is set; duration per rep (e.g. '5 reps of 3s') */
  rep_duration_seconds: number | null
  /** Required when load_unit ≠ 'NONE' */
  load_value: number | null
  load_unit: LoadUnit
  rest_seconds: number | null
  order_index: number
  /** Groups exercises into supersets/circuits. Same label = performed back-to-back */
  group_label: string | null
  notes: string | null
  deleted_at: string | null
  organization_id: string
  created_at: string
}

export interface TrainingSessionExerciseWithName extends TrainingSessionExercise {
  /** Denormalized from training_exercises; returned by get_training_plan_tree RPC */
  exercise_name: string
  execution_type: ExecutionType | null
  default_tempo: string | null
}

// ─── Nested tree types (returned by get_training_plan_tree RPC) ───────────────

export type TrainingSessionWithExercises = TrainingSession & {
  exercises: TrainingSessionExerciseWithName[]
}

export type TrainingMicrocycleWithSessions = TrainingMicrocycle & {
  sessions: TrainingSessionWithExercises[]
}

export type TrainingMesocycleWithSessions = TrainingMesocycle & {
  /** Sessions directly under this mesocycle (no microcycle) */
  sessions: TrainingSessionWithExercises[]
  microcycles: TrainingMicrocycleWithSessions[]
}

export type TrainingPlanTree = TrainingPlan & {
  /** Sessions directly under the plan (no hierarchy) */
  sessions: TrainingSessionWithExercises[]
  /** Mesocycles with their microcycles and sessions */
  mesocycles: TrainingMesocycleWithSessions[]
  /** Microcycles directly under the plan (no mesocycle) */
  microcycles: TrainingMicrocycleWithSessions[]
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateTrainingPlanInput {
  name: string
  patient_id: string
  organization_id: string
  professional_id: string
  start_date?: string
  end_date?: string
  description?: string
}

export interface CreateMesocycleInput {
  plan_id: string
  name: string
  organization_id: string
}

export interface CreateMicrocycleInput {
  name: string
  organization_id: string
  /** Parent mesocycle — XOR with plan_id */
  mesocycle_id?: string
  /** Parent plan (no mesocycle) — XOR with mesocycle_id */
  plan_id?: string
  repeat_count?: number
  duration_days?: number
}

export interface CreateTrainingSessionInput {
  name: string
  organization_id: string
  /** Parent microcycle — XOR with mesocycle_id and plan_id */
  microcycle_id?: string
  /** Parent mesocycle — XOR with microcycle_id and plan_id */
  mesocycle_id?: string
  /** Parent plan — XOR with microcycle_id and mesocycle_id */
  plan_id?: string
  day_of_week?: number[]
}

export interface CreateSessionExerciseInput {
  session_id: string
  exercise_id: string
  organization_id: string
  sets: number
  reps?: number
  set_duration_seconds?: number
  rep_duration_seconds?: number
  load_value?: number
  load_unit: LoadUnit
  rest_seconds?: number
  order_index?: number
  group_label?: string
  notes?: string
}

export interface UpdateSessionExerciseInput {
  session_exercise_id: string
  sets?: number
  reps?: number | null
  set_duration_seconds?: number | null
  load_value?: number | null
  load_unit?: LoadUnit
  rest_seconds?: number | null
  order_index?: number
  group_label?: string | null
  notes?: string | null
}

export interface CreateTrainingExerciseInput {
  name: string
  /** NULL = global system exercise (SUPERADMIN only); UUID = org-scoped exercise */
  organization_id: string | null
  description?: string
  /** Tag IDs to assign to this exercise */
  tag_ids?: string[]
  video_url?: string
  execution_type?: ExecutionType
  default_tempo?: string
  default_sets?: number
  default_reps?: number
  default_rest_seconds?: number
}

export interface UpdateTrainingExerciseInput {
  exercise_id: string
  name?: string
  description?: string
  tag_ids?: string[]
  video_url?: string
  execution_type?: ExecutionType
  default_tempo?: string
  default_sets?: number
  default_reps?: number
  default_rest_seconds?: number
}
