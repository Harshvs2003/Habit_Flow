import express from "express"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
router.use(authMiddleware)

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

export default router
