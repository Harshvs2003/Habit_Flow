import crypto from "crypto"
import express from "express"
import rateLimit from "express-rate-limit"
import User from "../models/User.js"
import Payment from "../models/Payment.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { plans } from "../config/plans.js"

const router = express.Router()
const PLAN_RANK = { free: 0, pro: 1, gold: 2 }
const INTERVAL_RANK = { monthly: 1, yearly: 2 }
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

const defaultSubscription = {
  billingType: "none",
  interval: null,
  status: "inactive",
  subscriptionId: null,
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtCycleEnd: false,
  cancelledAt: null
}

const isPaidPlan = (plan) => Boolean(plan && plans[plan] && plan !== "free")

const isTransitionAllowed = ({ currentPlan, currentInterval, nextPlan, nextInterval }) => {
  if (!isPaidPlan(nextPlan) || !VALID_INTERVALS.includes(nextInterval)) return false

  const currentPlanRank = PLAN_RANK[currentPlan] ?? 0
  const nextPlanRank = PLAN_RANK[nextPlan] ?? 0

  if (nextPlanRank > currentPlanRank) return true
  if (nextPlanRank < currentPlanRank) return false

  if (!currentInterval) return true

  const currentIntervalRank = INTERVAL_RANK[currentInterval] ?? 0
  const nextIntervalRank = INTERVAL_RANK[nextInterval] ?? 0
  return nextIntervalRank > currentIntervalRank
}

const getAuthHeader = (keyId, keySecret) => `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`

const syncUserSubscription = async ({
  userId,
  plan,
  interval,
  status,
  subscriptionId,
  periodStart,
  periodEnd,
  cancelAtCycleEnd,
  cancelledAt
}) => {
  const updates = {
    plan,
    subscription: {
      billingType: plan === "free" ? "none" : "recurring",
      interval: plan === "free" ? null : interval || null,
      status,
      subscriptionId: subscriptionId || null,
      currentPeriodStart: periodStart || null,
      currentPeriodEnd: periodEnd || null,
      cancelAtCycleEnd: Boolean(cancelAtCycleEnd),
      cancelledAt: cancelledAt || null
    }
  }

  return User.findByIdAndUpdate(userId, updates, { returnDocument: "after" }).select("-password")
}

const sanitizeUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  subscription: user.subscription || defaultSubscription
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

    const user = await User.findById(req.userId).select("plan subscription")
    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentPlan = user.plan || "free"
    const currentInterval = user.subscription?.interval || null
    const currentStatus = user.subscription?.status || "inactive"

    if (
      currentPlan === plan &&
      currentInterval === interval &&
      ["created", "authenticated", "active", "charged"].includes(currentStatus)
    ) {
      return res.status(400).json({ message: "This subscription is already active for your account" })
    }

    if (!isTransitionAllowed({ currentPlan, currentInterval, nextPlan: plan, nextInterval: interval })) {
      return res.status(400).json({ message: "Only upgrades are allowed from your current subscription" })
    }

    const { keyId, keySecret, subscriptionPlans } = getRazorpayConfig()
    if (!keyId || !keySecret) {
      return res.status(500).json({ message: "Payment is not configured" })
    }

    const planId = subscriptionPlans?.[plan]?.[interval]
    if (!planId) {
      return res.status(500).json({ message: "Recurring plan is not configured" })
    }

    const subscriptionRes = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        Authorization: getAuthHeader(keyId, keySecret),
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
      billingType = "recurring",
      billingInterval,
      razorpay_subscription_id: subscriptionId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature
    } = req.body

    if (!isPaidPlan(plan)) {
      return res.status(400).json({ message: "Invalid paid plan" })
    }

    if (billingType !== "recurring") {
      return res.status(400).json({ message: "Only recurring billing verification is supported" })
    }

    if (!VALID_INTERVALS.includes(billingInterval)) {
      return res.status(400).json({ message: "Invalid billing interval" })
    }

    if (!subscriptionId || !paymentId || !signature) {
      return res.status(400).json({ message: "Missing subscription verification fields" })
    }

    const { keyId, keySecret } = getRazorpayConfig()
    if (!keySecret || !keyId) {
      return res.status(500).json({ message: "Payment verification is not configured" })
    }

    const generated = crypto
      .createHmac("sha256", keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex")

    if (generated !== signature) {
      await createPaymentRecord({
        userId: req.userId,
        plan,
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
        subscriptionId,
        paymentId,
        amount: plans[plan].amountInPaise,
        billingType,
        billingInterval,
        status: "authenticated",
        source: "client_verify"
      })
    }

    const user = await syncUserSubscription({
      userId: req.userId,
      plan,
      interval: billingInterval,
      status: "authenticated",
      subscriptionId
    })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      message: "Subscription authenticated successfully",
      user: sanitizeUserPayload(user)
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
    const paymentId = paymentEntity.id
    const subscriptionId = paymentEntity.subscription_id || subscriptionEntity.id
    const amount = paymentEntity.amount || subscriptionEntity?.plan?.item?.amount || 0

    const startAt = subscriptionEntity?.start_at ? new Date(subscriptionEntity.start_at * 1000) : null
    const endAt = subscriptionEntity?.end_at ? new Date(subscriptionEntity.end_at * 1000) : null
    const cancelledAt = subscriptionEntity?.ended_at ? new Date(subscriptionEntity.ended_at * 1000) : null

    const activationEvents = ["subscription.authenticated", "subscription.activated", "subscription.charged"]
    if (activationEvents.includes(eventType) && userId && plan && plans[plan]) {
      const status =
        eventType === "subscription.authenticated"
          ? "authenticated"
          : eventType === "subscription.charged"
            ? "charged"
            : "active"

      await syncUserSubscription({
        userId,
        plan,
        interval: billingInterval,
        status,
        subscriptionId,
        periodStart: startAt,
        periodEnd: endAt,
        cancelAtCycleEnd: Boolean(subscriptionEntity?.cancel_at_cycle_end),
        cancelledAt
      })

      await createPaymentRecord({
        userId,
        plan,
        subscriptionId,
        paymentId,
        amount,
        billingType: "recurring",
        billingInterval,
        status,
        source: "webhook",
        webhookEventId: eventId ? String(eventId) : undefined,
        eventType
      })

      return res.json({ received: true, applied: true })
    }

    const stopEvents = ["subscription.halted", "subscription.cancelled", "subscription.completed", "subscription.expired"]
    if (stopEvents.includes(eventType) && userId) {
      await syncUserSubscription({
        userId,
        plan: "free",
        interval: null,
        status: eventType === "subscription.halted" ? "halted" : "cancelled",
        subscriptionId,
        periodStart: startAt,
        periodEnd: endAt,
        cancelAtCycleEnd: true,
        cancelledAt: cancelledAt || new Date()
      })

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
      subscriptionId,
      paymentId,
      amount,
      billingType: "recurring",
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

