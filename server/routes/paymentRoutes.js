import crypto from "crypto"
import express from "express"
import User from "../models/User.js"
import Payment from "../models/Payment.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
const PLAN_RANK = { free: 0, pro: 1, gold: 2 }

const getRazorpayConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
})

const createPaymentRecord = async (payload) => {
  try {
    return await Payment.create(payload)
  } catch (err) {
    if (err?.code === 11000) return null
    throw err
  }
}

router.post("/create-order", authMiddleware, async (req, res) => {
  try {
    const { plan } = req.body

    if (!plan || !plans[plan] || plan === "free") {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    const user = await User.findById(req.userId).select("plan")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }
    const currentPlan = user.plan || "free"
    if (PLAN_RANK[plan] <= PLAN_RANK[currentPlan]) {
      return res.status(400).json({ message: "Please choose a higher plan than your current plan" })
    }

    const { keyId, keySecret } = getRazorpayConfig()

    if (!keyId || !keySecret) {
      return res.status(500).json({ message: "Payment is not configured" })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    const receipt = `hf_${req.userId.slice(-10)}_${Date.now().toString().slice(-10)}`

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

    await createPaymentRecord({
      userId: req.userId,
      plan,
      orderId: orderData.id,
      amount: orderData.amount,
      status: "created",
      source: "client_verify"
    })

    res.json({
      keyId,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      plan
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/verify", authMiddleware, async (req, res) => {
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

    const { keySecret } = getRazorpayConfig()
    if (!keySecret) {
      return res.status(500).json({ message: "Payment verification is not configured" })
    }

    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex")

    if (generated !== signature) {
      await createPaymentRecord({
        userId: req.userId,
        plan,
        orderId,
        paymentId,
        amount: plans[plan].amountInPaise,
        status: "failed",
        source: "client_verify"
      })
      return res.status(400).json({ message: "Invalid payment signature" })
    }

    const existing = await Payment.findOne({ paymentId })
    if (!existing) {
      await createPaymentRecord({
        userId: req.userId,
        plan,
        orderId,
        paymentId,
        amount: plans[plan].amountInPaise,
        status: "verified",
        source: "client_verify"
      })
    }

    const currentUser = await User.findById(req.userId).select("plan")
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentPlan = currentUser.plan || "free"
    const nextPlan = PLAN_RANK[plan] >= PLAN_RANK[currentPlan] ? plan : currentPlan

    const user = await User.findByIdAndUpdate(
      req.userId,
      { plan: nextPlan },
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

router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"]
    const eventId = req.headers["x-razorpay-event-id"]
    const { webhookSecret } = getRazorpayConfig()

    if (!signature || !webhookSecret) {
      return res.status(400).json({ message: "Webhook signature config missing" })
    }

    if (!Buffer.isBuffer(req.body)) {
      return res.status(400).json({ message: "Webhook body must be raw" })
    }

    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex")

    if (expected !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" })
    }

    const eventBody = JSON.parse(req.body.toString("utf8"))
    const eventType = eventBody?.event || "unknown"

    if (eventId) {
      const alreadyProcessed = await Payment.findOne({ webhookEventId: String(eventId) })
      if (alreadyProcessed) {
        return res.json({ received: true, duplicate: true })
      }
    }

    const paymentEntity = eventBody?.payload?.payment?.entity || {}
    const notes = paymentEntity?.notes || {}
    const plan = notes.plan
    const userId = notes.userId
    const orderId = paymentEntity.order_id
    const paymentId = paymentEntity.id
    const amount = paymentEntity.amount || 0

    if (eventType === "payment.captured" && userId && plan && plans[plan]) {
      const targetUser = await User.findById(userId).select("plan")
      if (targetUser) {
        const currentPlan = targetUser.plan || "free"
        if (PLAN_RANK[plan] > PLAN_RANK[currentPlan]) {
          await User.findByIdAndUpdate(userId, { plan }, { returnDocument: "after" })
        }
      }

      await createPaymentRecord({
        userId,
        plan,
        orderId,
        paymentId,
        amount,
        status: "captured",
        source: "webhook",
        webhookEventId: eventId ? String(eventId) : undefined,
        eventType
      })

      return res.json({ received: true, applied: true })
    }

    await createPaymentRecord({
      userId: userId || undefined,
      plan: plans[plan] ? plan : "free",
      orderId,
      paymentId,
      amount,
      status: "ignored",
      source: "webhook",
      webhookEventId: eventId ? String(eventId) : undefined,
      eventType
    })

    res.json({ received: true, applied: false })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
