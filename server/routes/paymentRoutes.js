import crypto from "crypto"
import express from "express"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
router.use(authMiddleware)

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body

    if (!plan || !plans[plan] || plan === "free") {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment is not configured" })
    }

    const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64")
    const receipt = `hf_${req.userId}_${Date.now()}`

    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: plans[plan].amountInPaise,
        currency: "INR",
        receipt,
        notes: {
          userId: req.userId,
          plan
        }
      })
    })

    const orderData = await orderRes.json()
    if (!orderRes.ok) {
      return res.status(400).json({
        message: orderData?.error?.description || "Unable to create order"
      })
    }

    res.json({
      keyId: RAZORPAY_KEY_ID,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      plan
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/verify", async (req, res) => {
  try {
    const {
      plan,
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    } = req.body

    if (!plan || !plans[plan] || plan === "free") {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing payment verification fields" })
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({ message: "Payment verification is not configured" })
    }

    const generated = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex")

    if (generated !== signature) {
      return res.status(400).json({ message: "Invalid payment signature" })
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { plan },
      { returnDocument: "after" }
    ).select("-password")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Payment verified and plan updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
