import crypto from "crypto"
import express from "express"
import rateLimit from "express-rate-limit"
import User from "../models/User.js"
import Payment from "../models/Payment.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
const PLAN_RANK = { free: 0, pro: 1, gold: 2 }
const VALID_INTERVALS = ["monthly", "yearly"]

const paymentActionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many payment requests, please try again later." }
})

const getRazorpayConfig = () => ({
  keyId: process.env.RAZORPAY_KEY_ID,
  keySecret: process.env.RAZORPAY_KEY_SECRET,
  webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  subscriptionPlans: {
    pro: {
      monthly: process.env.RAZORPAY_PLAN_PRO_MONTHLY,
      yearly: process.env.RAZORPAY_PLAN_PRO_YEARLY
    },
    gold: {
      monthly: process.env.RAZORPAY_PLAN_GOLD_MONTHLY,
      yearly: process.env.RAZORPAY_PLAN_GOLD_YEARLY
    }
  }
})

const createPaymentRecord = async (payload) => {
  try {
    return await Payment.create(payload)
  } catch (err) {
    if (err?.code === 11000) return null
    throw err
  }
}

const isPaidPlan = (plan) => Boolean(plan && plans[plan] && plan !== "free")

const assertUpgradeablePlan = async (userId, plan) => {
  const user = await User.findById(userId).select("plan")
  if (!user) {
    return { error: { status: 404, message: "User not found" } }
  }

  const currentPlan = user.plan || "free"
  if (PLAN_RANK[plan] <= PLAN_RANK[currentPlan]) {
    return {
      error: {
        status: 400,
        message: "Please choose a higher plan than your current plan"
      }
    }
  }

  return { user, currentPlan }
}

router.post("/create-order", paymentActionLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { plan } = req.body

    if (!isPaidPlan(plan)) {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    const validation = await assertUpgradeablePlan(req.userId, plan)
    if (validation.error) {
      return res.status(validation.error.status).json({ message: validation.error.message })
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
          plan,
          billingType: "one_time"
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
      billingType: "one_time",
      status: "created",
      source: "client_verify"
    })

    res.json({
      keyId,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      plan,
      billingType: "one_time"
    })
  } catch (err) {
    next(err)
  }
})

router.post("/create-subscription", paymentActionLimiter, authMiddleware, async (req, res, next) => {
  try {
    const { plan, interval } = req.body

    if (!isPaidPlan(plan)) {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    if (!VALID_INTERVALS.includes(interval)) {
      return res.status(400).json({ message: "Invalid billing interval" })
    }

    const validation = await assertUpgradeablePlan(req.userId, plan)
    if (validation.error) {
      return res.status(validation.error.status).json({ message: validation.error.message })
    }

    const { keyId, keySecret, subscriptionPlans } = getRazorpayConfig()
    if (!keyId || !keySecret) {
      return res.status(500).json({ message: "Payment is not configured" })
    }

    const planId = subscriptionPlans?.[plan]?.[interval]
    if (!planId) {
      return res.status(500).json({ message: "Recurring plan is not configured" })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    const subscriptionRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan_id: planId,
        customer_notify: 1,
        total_count: 120,
        notes: {
          userId: req.userId,
          plan,
          billingType: "recurring",
          billingInterval: interval
        }
      })
    })

    const subscriptionData = await subscriptionRes.json()
    if (!subscriptionRes.ok) {
      return res.status(400).json({
        message: subscriptionData?.error?.description || "Unable to create subscription"
      })
    }

    await createPaymentRecord({
      userId: req.userId,
      plan,
      subscriptionId: subscriptionData.id,
      amount: plans[plan].amountInPaise,
      billingType: "recurring",
      billingInterval: interval,
      status: "created",
      source: "client_verify"
    })

    res.json({
      keyId,
      subscriptionId: subscriptionData.id,
      plan,
      interval,
      billingType: "recurring"
    })
  } catch (err) {
    next(err)
  }
})

router.post("/verify", paymentActionLimiter, authMiddleware, async (req, res, next) => {
  try {
    const {
      plan,
      billingType = "one_time",
      billingInterval,
      razorpay_order_id: orderId,
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    } = req.body

    if (!isPaidPlan(plan)) {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    if (!["one_time", "recurring"].includes(billingType)) {
      return res.status(400).json({ message: "Invalid billing type" })
    }

    if (!paymentId || !signature) {
      return res.status(400).json({ message: "Missing payment verification fields" })
    }

    if (billingType === "one_time" && !orderId) {
      return res.status(400).json({ message: "Missing order id for one-time payment verification" })
    }

    if (billingType === "recurring" && !subscriptionId) {
      return res.status(400).json({ message: "Missing subscription id for recurring payment verification" })
    }

    const { keyId, keySecret } = getRazorpayConfig()
    if (!keySecret || !keyId) {
      return res.status(500).json({ message: "Payment verification is not configured" })
    }

    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(billingType === "recurring" ? `${paymentId}|${subscriptionId}` : `${orderId}|${paymentId}`)
      .digest("hex")

    if (generated !== signature) {
      await createPaymentRecord({
        userId: req.userId,
        plan,
        orderId,
        subscriptionId,
        paymentId,
        amount: plans[plan].amountInPaise,
        billingType,
        billingInterval,
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
        subscriptionId,
        paymentId,
        amount: plans[plan].amountInPaise,
        billingType,
        billingInterval,
        status: billingType === "recurring" ? "authenticated" : "verified",
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
      message:
        billingType === "recurring"
          ? "Subscription verified and plan updated"
          : "Payment verified and plan updated",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan
      }
    })
  } catch (err) {
    next(err)
  }
})

router.post("/webhook", async (req, res, next) => {
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
    const subscriptionEntity = eventBody?.payload?.subscription?.entity || {}
    const paymentNotes = paymentEntity?.notes || {}
    const subscriptionNotes = subscriptionEntity?.notes || {}

    const plan = paymentNotes.plan || subscriptionNotes.plan
    const userId = paymentNotes.userId || subscriptionNotes.userId
    const billingInterval = paymentNotes.billingInterval || subscriptionNotes.billingInterval
    const billingType =
      paymentNotes.billingType ||
      subscriptionNotes.billingType ||
      (subscriptionEntity?.id ? "recurring" : "one_time")
    const orderId = paymentEntity.order_id
    const paymentId = paymentEntity.id
    const subscriptionId = paymentEntity.subscription_id || subscriptionEntity.id
    const amount = paymentEntity.amount || subscriptionEntity?.plan?.item?.amount || 0

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
        subscriptionId,
        paymentId,
        amount,
        billingType,
        billingInterval,
        status: "captured",
        source: "webhook",
        webhookEventId: eventId ? String(eventId) : undefined,
        eventType
      })

      return res.json({ received: true, applied: true })
    }

    const subscriptionActivationEvents = [
      "subscription.authenticated",
      "subscription.activated",
      "subscription.charged"
    ]

    if (subscriptionActivationEvents.includes(eventType) && userId && plan && plans[plan]) {
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
        subscriptionId,
        paymentId,
        amount,
        billingType: "recurring",
        billingInterval,
        status:
          eventType === "subscription.authenticated"
            ? "authenticated"
            : eventType === "subscription.charged"
              ? "charged"
              : "active",
        source: "webhook",
        webhookEventId: eventId ? String(eventId) : undefined,
        eventType
      })

      return res.json({ received: true, applied: true })
    }

    const subscriptionStopEvents = ["subscription.halted", "subscription.cancelled"]
    if (subscriptionStopEvents.includes(eventType) && userId) {
      await User.findByIdAndUpdate(userId, { plan: "free" }, { returnDocument: "after" })

      await createPaymentRecord({
        userId,
        plan: plans[plan] ? plan : "free",
        subscriptionId,
        paymentId,
        amount,
        billingType: "recurring",
        billingInterval,
        status: eventType === "subscription.halted" ? "halted" : "cancelled",
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
      subscriptionId,
      paymentId,
      amount,
      billingType,
      billingInterval,
      status: "ignored",
      source: "webhook",
      webhookEventId: eventId ? String(eventId) : undefined,
      eventType
    })

    res.json({ received: true, applied: false })
  } catch (err) {
    next(err)
  }
})

export default router
