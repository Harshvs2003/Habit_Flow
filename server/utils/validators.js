export const USER_NAME_MAX_LENGTH = 30
export const HABIT_TITLE_MAX_LENGTH = 60
export const PASSWORD_MIN_LENGTH = 8

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0

export const normalizeName = (value) => (typeof value === "string" ? value.trim() : "")
export const normalizeHabitTitle = (value) => (typeof value === "string" ? value.trim() : "")
export const normalizeEmail = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "")

export const validateName = (value) => {
  const name = normalizeName(value)
  if (!name) return { ok: false, message: "Name is required" }
  if (name.length > USER_NAME_MAX_LENGTH) {
    return { ok: false, message: `Name must be ${USER_NAME_MAX_LENGTH} characters or fewer` }
  }
  return { ok: true, value: name }
}

export const validateEmail = (value) => {
  const email = normalizeEmail(value)
  if (!email) return { ok: false, message: "Email is required" }
  if (!emailPattern.test(email)) return { ok: false, message: "Please provide a valid email" }
  return { ok: true, value: email }
}

export const validatePassword = (value) => {
  const password = typeof value === "string" ? value : ""
  if (!password) return { ok: false, message: "Password is required" }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { ok: false, message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` }
  }
  return { ok: true, value: password }
}

