export const plans = {
  free: { maxHabits: 5 },
  pro: { maxHabits: 10 },
  gold: { maxHabits: Infinity }
}

export const getPlanLimit = (plan) => plans[plan] || plans.free
