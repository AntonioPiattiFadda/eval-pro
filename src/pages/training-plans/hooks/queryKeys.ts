export const trainingPlanKeys = {
  all: ['training-plans'] as const,
  lists: () => [...trainingPlanKeys.all, 'list'] as const,
  detail: (planId: string) => [...trainingPlanKeys.all, 'detail', planId] as const,
  tree: (planId: string) => [...trainingPlanKeys.all, 'tree', planId] as const,
  exercises: ['training-exercises'] as const,
}
