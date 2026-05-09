import express from "express"
import bcrypt from "bcryptjs"
import User from "../models/User.js"
import Habit from "../models/Habit.js"
import Entry from "../models/Entry.js"
import DayStatus from "../models/DayStatus.js"
import Payment from "../models/Payment.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"
import { validateName } from "../utils/validators.js"

const router = express.Router()
router.use(authMiddleware)
const PLAN_RANK = { free: 0, pro: 1, gold: 2 }

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan
})

router.patch("/plan", async (req, res, next) => {
  try {
    const { plan } = req.body

    if (!plan || !plans[plan]) {
      return res.status(400).json({ message: "Invalid plan" })
    }

    if (plan !== "free") {
      return res.status(400).json({ message: "Paid plans can only be activated after payment" })
    }

    const currentUser = await User.findById(req.userId).select("plan")
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentPlan = currentUser.plan || "free"
    if (PLAN_RANK[plan] < PLAN_RANK[currentPlan]) {
      return res.status(400).json({ message: "Downgrading plans is not allowed" })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { plan },
      { returnDocument: "after" }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.patch("/name", async (req, res, next) => {
  try {
    const nameCheck = validateName(req.body?.name)
    if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message })

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name: nameCheck.value },
      { returnDocument: "after" }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.delete("/account", async (req, res, next) => {
  try {
    const password = typeof req.body?.password === "string" ? req.body.password : ""
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })

    if (user.password) {
      const match = await bcrypt.compare(password, user.password)
      if (!match) return res.status(400).json({ message: "Incorrect password" })
    }

    await Promise.all([
      Habit.deleteMany({ userId: user._id }),
      Entry.deleteMany({ userId: user._id }),
      DayStatus.deleteMany({ userId: user._id }),
      Payment.deleteMany({ userId: user._id }),
      User.deleteOne({ _id: user._id })
    ])

    res.json({ message: "Account deleted successfully" })
  } catch (err) {
    next(err)
  }
})

export default router
