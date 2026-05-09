import express from "express"
import Habit from "../models/Habit.js"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { getPlanLimit } from "../config/plans.js"

const router = express.Router()
router.use(authMiddleware)
const HABIT_TITLE_MAX_LENGTH = 60

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const normalizeTitle = (value) => (typeof value === "string" ? value.trim() : "")

// GET habits
router.get("/", async (req, res) => {
  const userId = req.userId
  const habits = await Habit.find({ userId })
  res.json(habits)
})

// ADD habit
router.post("/", async (req, res) => {
  try {
    const userId = req.userId
    const { title, category } = req.body
    const normalizedTitle = normalizeTitle(title)

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    if (!normalizedTitle) {
      return res.status(400).json({ message: "Habit name is required" })
    }

    if (normalizedTitle.length > HABIT_TITLE_MAX_LENGTH) {
      return res.status(400).json({
        message: `Habit name must be ${HABIT_TITLE_MAX_LENGTH} characters or fewer`
      })
    }

    const duplicateHabit = await Habit.findOne({
      userId,
      title: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" }
    })

    if (duplicateHabit) {
      return res.status(409).json({ message: "Habit with this name already exists" })
    }

    const count = await Habit.countDocuments({ userId })

    const { maxHabits } = getPlanLimit(user.plan)

    if (Number.isFinite(maxHabits) && count >= maxHabits) {
      return res.status(403).json({
        message: "Upgrade to add more habits"
      })
    }

    const habit = await Habit.create({
      userId,
      title: normalizedTitle,
      category
    })

    res.json(habit)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// RENAME habit (title only)
router.patch("/:id", async (req, res) => {
  try {
    const userId = req.userId
    const { title } = req.body
    const normalizedTitle = normalizeTitle(title)

    if (!normalizedTitle) {
      return res.status(400).json({ message: "Title is required" })
    }

    if (normalizedTitle.length > HABIT_TITLE_MAX_LENGTH) {
      return res.status(400).json({
        message: `Habit name must be ${HABIT_TITLE_MAX_LENGTH} characters or fewer`
      })
    }

    const duplicateHabit = await Habit.findOne({
      userId,
      _id: { $ne: req.params.id },
      title: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" }
    })

    if (duplicateHabit) {
      return res.status(409).json({ message: "Habit with this name already exists" })
    }

    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId },
      { title: normalizedTitle },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE habit
router.delete("/:id", async (req, res) => {
  const userId = req.userId
  await Habit.findOneAndDelete({ _id: req.params.id, userId })
  res.json({ message: "Deleted" })
})

export default router
