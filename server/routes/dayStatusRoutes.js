import express from "express"
import DayStatus from "../models/DayStatus.js"
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()
router.use(authMiddleware)

const toLocalYMD = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const getLocalDate = () => {
  return toLocalYMD(new Date())
}

const getYesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return toLocalYMD(d)
}

const parseLocalYMD = (value) => {
  if (typeof value !== "string") return new Date(NaN)
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// GET month statuses
router.get("/", async (req, res) => {
  const userId = req.userId
  const { month } = req.query

  const data = await DayStatus.find({
    userId,
    date: { $regex: `^${month}` }
  })

  res.json(data)
})

// TOGGLE day status
router.post("/", async (req, res) => {
  try {
    const userId = req.userId
    const { date } = req.body

    const inputDate = parseLocalYMD(date)
    const now = new Date()

    inputDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    const diff = Math.floor((now - inputDate) / (1000 * 60 * 60 * 24))

    if (!Number.isFinite(diff) || diff < -1 || diff > 1) {
      return res.status(400).json({ message: "Invalid date" })
    }

    const existing = await DayStatus.findOne({ userId, date })

    if (existing) {
      existing.status =
        existing.status === "active" ? "skipped" : "active"
      await existing.save()
      return res.json(existing)
    }

    const newStatus = await DayStatus.create({
      userId,
      date,
      status: "skipped"
    })

    res.json(newStatus)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
