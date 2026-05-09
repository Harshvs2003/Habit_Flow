import express from "express"
import Habit from "../models/Habit.js"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { getPlanLimit } from "../config/plans.js"
import { HABIT_TITLE_MAX_LENGTH, normalizeHabitTitle } from "../utils/validators.js"

const router = express.Router()
router.use(authMiddleware)
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const sortByPriority = { isPinned: -1, sortOrder: 1, createdAt: 1 }

// GET habits
router.get("/", async (req, res) => {
  const userId = req.userId
  const archivedQuery = req.query.archived
  const filter = { userId }

  if (archivedQuery === "true") {
    filter.archived = true
  } else if (archivedQuery === "all") {
    // include both active and archived
  } else {
    filter.archived = { $ne: true }
  }

  const habits = await Habit.find(filter).sort(sortByPriority)
  res.json(habits)
})

// ADD habit
router.post("/", async (req, res, next) => {
  try {
    const userId = req.userId
    const { title, category } = req.body
    const normalizedTitle = normalizeHabitTitle(title)

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
      archived: { $ne: true },
      title: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" }
    })

    if (duplicateHabit) {
      return res.status(409).json({ message: "Habit with this name already exists" })
    }

    const count = await Habit.countDocuments({ userId, archived: { $ne: true } })

    const { maxHabits } = getPlanLimit(user.plan)

    if (Number.isFinite(maxHabits) && count >= maxHabits) {
      return res.status(403).json({
        message: "Upgrade to add more habits"
      })
    }

    const lastHabit = await Habit.findOne({ userId, archived: { $ne: true } }).sort({ sortOrder: -1 })
    const nextSortOrder = lastHabit ? lastHabit.sortOrder + 1 : 0

    const habit = await Habit.create({
      userId,
      title: normalizedTitle,
      category,
      sortOrder: nextSortOrder
    })

    res.json(habit)
  } catch (err) {
    next(err)
  }
})

// RENAME habit (title only)
router.patch("/:id", async (req, res, next) => {
  try {
    const userId = req.userId
    const { title } = req.body
    const normalizedTitle = normalizeHabitTitle(title)

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
      archived: { $ne: true },
      title: { $regex: `^${escapeRegex(normalizedTitle)}$`, $options: "i" }
    })

    if (duplicateHabit) {
      return res.status(409).json({ message: "Habit with this name already exists" })
    }

    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId },
      { title: normalizedTitle },
      { returnDocument: "after" }
    )

    if (!updated) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.patch("/:id/archive", async (req, res, next) => {
  try {
    const userId = req.userId
    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId },
      { archived: true, isPinned: false },
      { returnDocument: "after" }
    )

    if (!updated) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.patch("/:id/unarchive", async (req, res, next) => {
  try {
    const userId = req.userId

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const count = await Habit.countDocuments({ userId, archived: { $ne: true } })
    const { maxHabits } = getPlanLimit(user.plan)
    if (Number.isFinite(maxHabits) && count >= maxHabits) {
      return res.status(403).json({
        message: "Upgrade to add more habits"
      })
    }

    const lastHabit = await Habit.findOne({ userId, archived: { $ne: true } }).sort({ sortOrder: -1 })
    const nextSortOrder = lastHabit ? lastHabit.sortOrder + 1 : 0

    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId },
      { archived: false, sortOrder: nextSortOrder },
      { returnDocument: "after" }
    )

    if (!updated) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.patch("/:id/pin", async (req, res, next) => {
  try {
    const userId = req.userId
    const { isPinned } = req.body
    if (typeof isPinned !== "boolean") {
      return res.status(400).json({ message: "isPinned must be boolean" })
    }

    const updated = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId, archived: { $ne: true } },
      { isPinned },
      { returnDocument: "after" }
    )

    if (!updated) {
      return res.status(404).json({ message: "Habit not found" })
    }

    res.json(updated)
  } catch (err) {
    next(err)
  }
})

router.patch("/reorder/list", async (req, res, next) => {
  try {
    const userId = req.userId
    const { orderedIds } = req.body

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ message: "orderedIds is required" })
    }

    const habits = await Habit.find({ userId, archived: { $ne: true } }, { _id: 1 })
    const existingIds = habits.map((h) => String(h._id))
    const hasMismatch = orderedIds.length !== existingIds.length ||
      orderedIds.some((id) => !existingIds.includes(String(id)))

    if (hasMismatch) {
      return res.status(400).json({ message: "Invalid reorder payload" })
    }

    await Promise.all(
      orderedIds.map((id, index) =>
        Habit.updateOne({ _id: id, userId }, { sortOrder: index })
      )
    )

    const updatedHabits = await Habit.find({ userId, archived: { $ne: true } }).sort(sortByPriority)
    res.json(updatedHabits)
  } catch (err) {
    next(err)
  }
})

// DELETE habit
router.delete("/:id", async (req, res) => {
  const userId = req.userId
  await Habit.findOneAndDelete({ _id: req.params.id, userId })
  res.json({ message: "Deleted" })
})

export default router
