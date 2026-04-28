import express from "express"
import Habit from "../models/Habit.js"
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router()
router.use(authMiddleware)

// GET habits
router.get("/", async (req, res) => {
  const userId = req.userId
  const habits = await Habit.find({ userId })
  res.json(habits)
})

// ADD habit
router.post("/", async (req, res) => {
  const userId = req.userId
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
  const userId = req.userId
  await Habit.findOneAndDelete({ _id: req.params.id, userId })
  res.json({ message: "Deleted" })
})

export default router
