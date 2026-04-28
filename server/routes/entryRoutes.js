import express from "express"
import mongoose from "mongoose"
import Entry from "../models/Entry.js"
import Habit from "../models/Habit.js"
import DayStatus from "../models/DayStatus.js"

const router = express.Router()

const userId = new mongoose.Types.ObjectId("64b8f1c2a1b2c3d4e5f67890")

// GET entries by month
router.get("/", async (req, res) => {
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
    const { habitId, date } = req.body

    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10)

    if (date !== today && date !== yesterday) {
      return res.status(400).json({ message: "Invalid date" })
    }

    const habit = await Habit.findById(habitId)
    if (!habit) {
      return res.status(404).json({ message: "Habit not found" })
    }

    const habitStart = habit.createdAt.toISOString().slice(0, 10)
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
