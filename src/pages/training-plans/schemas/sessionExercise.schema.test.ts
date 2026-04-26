import { describe, it, expect } from 'vitest'
import { sessionExerciseSchema } from './sessionExercise.schema'

const VALID_UUID = '00000000-0000-4000-a000-000000000001'

// Base valid object: reps-based, no load
const base = {
  session_id: VALID_UUID,
  exercise_id: VALID_UUID,
  organization_id: VALID_UUID,
  sets: 3,
  reps: 10,
  set_duration_seconds: undefined,
  rep_duration_seconds: undefined,
  load_value: undefined,
  load_unit: 'NONE' as const,
}

describe('sessionExerciseSchema', () => {
  describe('XOR: reps vs set_duration_seconds', () => {
    it('passes with reps only (no set_duration)', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: 10,
        set_duration_seconds: undefined,
      })
      expect(result.success).toBe(true)
    })

    it('passes with set_duration only (no reps)', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: undefined,
        set_duration_seconds: 30,
      })
      expect(result.success).toBe(true)
    })

    it('fails when both reps AND set_duration_seconds are set', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: 10,
        set_duration_seconds: 30,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0])
        expect(paths).toContain('reps')
        expect(paths).toContain('set_duration_seconds')
      }
    })

    it('fails when neither reps NOR set_duration_seconds are set', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: undefined,
        set_duration_seconds: undefined,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
      }
    })
  })

  describe('rep_duration_seconds constraint', () => {
    it('passes when rep_duration_seconds is set alongside reps', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: 5,
        rep_duration_seconds: 3,
      })
      expect(result.success).toBe(true)
    })

    it('fails when rep_duration_seconds is set without reps', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        reps: undefined,
        set_duration_seconds: 30,
        rep_duration_seconds: 3,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0])
        expect(paths).toContain('rep_duration_seconds')
      }
    })
  })

  describe('load_value conditional requirement', () => {
    it('fails when load_unit is KG but load_value is missing', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'KG',
        load_value: undefined,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0])
        expect(paths).toContain('load_value')
      }
    })

    it('passes when load_unit is KG and load_value is provided', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'KG',
        load_value: 80,
      })
      expect(result.success).toBe(true)
    })

    it('fails when load_unit is NONE but load_value is provided', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'NONE',
        load_value: 50,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const paths = result.error.issues.map((i) => i.path[0])
        expect(paths).toContain('load_value')
      }
    })

    it('passes when load_unit is NONE and load_value is absent', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'NONE',
        load_value: undefined,
      })
      expect(result.success).toBe(true)
    })

    it('fails when load_unit is PERCENTAGE_1RM but load_value is missing', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'PERCENTAGE_1RM',
        load_value: undefined,
      })
      expect(result.success).toBe(false)
    })

    it('fails when load_unit is RPE but load_value is missing', () => {
      const result = sessionExerciseSchema.safeParse({
        ...base,
        load_unit: 'RPE',
        load_value: undefined,
      })
      expect(result.success).toBe(false)
    })
  })
})
