import { z } from 'zod'

// ─── Simple schemas ───────────────────────────────────────────────────────────

export const createPlanSchema = z.object({
  name: z.string().min(1),
  patient_id: z.string().uuid(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  description: z.string().optional(),
})

export const createMesocycleSchema = z.object({
  name: z.string().min(1),
})

export const createMicrocycleSchema = z.object({
  name: z.string().min(1),
  repeat_count: z.number().int().positive().default(1),
  duration_days: z.number().int().positive().default(7),
})

export const createTrainingSessionSchema = z.object({
  name: z.string().min(1),
  day_of_week: z.array(z.number().int().min(0).max(6)).optional(),
})

// ─── Session exercise schema (with cross-field refinements) ───────────────────

const loadUnitValues = ['KG', 'PERCENTAGE_1RM', 'RPE', 'NONE'] as const

const sessionExerciseBase = z.object({
  session_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive().nullable().optional(),
  set_duration_seconds: z.number().int().positive().nullable().optional(),
  rep_duration_seconds: z.number().int().positive().nullable().optional(),
  load_value: z.number().positive().nullable().optional(),
  load_unit: z.enum(loadUnitValues),
  rest_seconds: z.number().int().nonnegative().nullable().optional(),
  order_index: z.number().int().nonnegative().optional(),
  group_label: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const sessionExerciseSchema = sessionExerciseBase.superRefine((data, ctx) => {
  const hasReps = data.reps != null
  const hasDuration = data.set_duration_seconds != null

  // XOR: exactly one of reps / set_duration_seconds must be set
  if (hasReps && hasDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reps'],
      message: 'Cannot set both reps and set_duration_seconds — use exactly one',
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['set_duration_seconds'],
      message: 'Cannot set both reps and set_duration_seconds — use exactly one',
    })
  }

  if (!hasReps && !hasDuration) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reps'],
      message: 'Must set either reps or set_duration_seconds',
    })
  }

  // rep_duration_seconds is only valid when reps is set
  if (data.rep_duration_seconds != null && !hasReps) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rep_duration_seconds'],
      message: 'rep_duration_seconds requires reps to be set',
    })
  }

  // load_value is required when load_unit is not NONE
  const requiresLoad = data.load_unit !== 'NONE'
  const hasLoadValue = data.load_value != null

  if (requiresLoad && !hasLoadValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['load_value'],
      message: `load_value is required when load_unit is '${data.load_unit}'`,
    })
  }

  if (!requiresLoad && hasLoadValue) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['load_value'],
      message: "load_value must be absent (null/undefined) when load_unit is 'NONE'",
    })
  }
})
