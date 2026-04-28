import express from "express"
import mongoose from "mongoose"
import Entry from "../models/Entry.js"

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
  const { habitId, date } = req.body

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
})

export default router