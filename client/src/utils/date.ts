export const getLocalDate = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export const getLocalMonth = () => {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")

  return `${year}-${month}`
}

export const shiftMonth = (month: string, delta: number) => {
  const [year, mon] = month.split("-").map(Number)
  const date = new Date(year, mon - 1 + delta, 1)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0")
  return `${nextYear}-${nextMonth}`
}

export const getMonthDaysCount = (month: string) => {
  const [year, mon] = month.split("-").map(Number)
  return new Date(year, mon, 0).getDate()
}

export const buildDateFromMonthDay = (month: string, day: number) => {
  const safeDay = String(day).padStart(2, "0")
  return `${month}-${safeDay}`
}

export const getMonthLabel = (month: string) => {
  const [year, mon] = month.split("-").map(Number)
  return new Date(year, mon - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  })
}

export const getLocalDayOfMonth = () => {
  return Number(getLocalDate().slice(8, 10))
}

export const getYesterday = () => {
  const now = new Date()
  now.setDate(now.getDate() - 1)

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}
