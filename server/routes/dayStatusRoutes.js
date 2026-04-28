import express from "express"
import mongoose from "mongoose"
import DayStatus from "../models/DayStatus.js"

const router = express.Router()

const userId = new mongoose.Types.ObjectId("64b8f1c2a1b2c3d4e5f67890")

// GET month statuses
router.get("/", async (req, res) => {
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
    const { date } = req.body

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10)

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
