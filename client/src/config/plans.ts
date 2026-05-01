export const plans = {
  free: { label: "Free", maxHabits: 5, price: 0 },
  pro: { label: "Pro", maxHabits: 10, price: 29 },
  gold: { label: "Gold", maxHabits: Infinity, price: 49 }
} as const

export type PlanKey = keyof typeof plans
