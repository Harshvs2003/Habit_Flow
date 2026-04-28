import express from "express"
import DayStatus from "../models/DayStatus.js"
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()
router.use(authMiddleware)

const getLocalDate = () => {
  const now = new Date()
  return now.toLocaleDateString("en-CA")
}

const getYesterday = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toLocaleDateString("en-CA")
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

    const today = getLocalDate()
    const yesterday = getYesterday()

    if (date !== today && date !== yesterday) {
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
