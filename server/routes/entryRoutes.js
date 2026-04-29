import express from "express"
import Entry from "../models/Entry.js"
import Habit from "../models/Habit.js"
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

const formatLocalDate = (dateValue) => {
  return toLocalYMD(dateValue)
}

const parseLocalYMD = (value) => {
  if (typeof value !== "string") return new Date(NaN)
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

// GET entries by month
router.get("/", async (req, res) => {
  const userId = req.userId
  const { month } = req.query

  const entries = await Entry.find({
    userId,
    date: { $regex: `^${month}` }
  })

  res.json(entries)
})

// TOGGLE entry
router.post("/", async (req, res) => {
  try {
    const userId = req.userId
    const { habitId, date } = req.body

    const inputDate = parseLocalYMD(date)
    const now = new Date()

    inputDate.setHours(0, 0, 0, 0)
    now.setHours(0, 0, 0, 0)

    const diff = Math.floor((now - inputDate) / (1000 * 60 * 60 * 24))

    if (!Number.isFinite(diff) || diff < -1 || diff > 1) {
      return res.status(400).json({ message: "Invalid date" })
    }

    const habit = await Habit.findOne({ _id: habitId, userId })
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" })
    }

    const habitStart = formatLocalDate(habit.createdAt)
    if (date < habitStart) {
      return res.status(400).json({
        message: "Cannot mark before habit was created"
      })
    }

    const day = await DayStatus.findOne({ userId, date })
    if (day && day.status === "skipped") {
      return res.status(400).json({
        message: "Cannot mark on skipped day"
      })
    }

    const existing = await Entry.findOne({
      userId,
      habitId,
      date
    })

    if (existing) {
      existing.completed = !existing.completed
      await existing.save()
      return res.json(existing)
    }

    const newEntry = await Entry.create({
      userId,
      habitId,
      date,
      completed: true
    })

    res.json(newEntry)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
