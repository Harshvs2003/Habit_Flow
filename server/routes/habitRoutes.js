import express from "express"
import mongoose from "mongoose"
import Habit from "../models/Habit.js"

const router = express.Router()

const userId = new mongoose.Types.ObjectId("64b8f1c2a1b2c3d4e5f67890")

// GET habits
router.get("/", async (req, res) => {
  const habits = await Habit.find({ userId })
  res.json(habits)
})

// ADD habit
router.post("/", async (req, res) => {
  const { title, category } = req.body

  const habit = await Habit.create({
    userId,
    title,
    category
  })

  res.json(habit)
})

// DELETE habit
router.delete("/:id", async (req, res) => {
  await Habit.findByIdAndDelete(req.params.id)
  res.json({ message: "Deleted" })
})

export default router