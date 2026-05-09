import express from "express"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
router.use(authMiddleware)
const USER_NAME_MAX_LENGTH = 30
const PLAN_RANK = { free: 0, pro: 1, gold: 2 }

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan
})

router.patch("/plan", async (req, res) => {
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
    res.status(500).json({ message: err.message })
  }
})

router.patch("/name", async (req, res) => {
  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name : ""
    const name = rawName.trim()

    if (!name) {
      return res.status(400).json({ message: "Name is required" })
    }

    if (name.length > USER_NAME_MAX_LENGTH) {
      return res.status(400).json({
        message: `Name must be ${USER_NAME_MAX_LENGTH} characters or fewer`
      })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name },
      { returnDocument: "after" }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({ user: sanitizeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
