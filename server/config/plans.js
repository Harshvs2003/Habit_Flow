export const plans = {
  free: { maxHabits: 5, amountInPaise: 0 },
  pro: { maxHabits: 10, amountInPaise: 2900 },
  gold: { maxHabits: Infinity, amountInPaise: 4900 }
}

export const getPlanLimit = (plan) => plans[plan] || plans.free
