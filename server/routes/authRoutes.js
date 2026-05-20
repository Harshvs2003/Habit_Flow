import crypto from "crypto"
import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import rateLimit from "express-rate-limit"
import User from "../models/User.js"
import authMiddleware from "../middleware/authMiddleware.js"
import { buildResetPasswordLink, buildVerifyEmailLink, sendEmail } from "../utils/email.js"
import { validateEmail, validateName, validatePassword } from "../utils/validators.js"

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const isProd = process.env.NODE_ENV === "production"
const forgotPasswordLimiter = rateLimit({
  windowMs: 2 * 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Please wait before requesting another reset link." }
})

const setAuthCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan || "free",
  subscription: user.subscription || {
    billingType: "none",
    interval: null,
    status: "inactive",
    subscriptionId: null,
    currentPeriodStart: null,
    currentPeriodEnd: null,
    cancelAtCycleEnd: false,
    cancelledAt: null
  },
  isEmailVerified: Boolean(user.isEmailVerified)
})

const getCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";")
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=")
    if (name === key) return decodeURIComponent(rest.join("="))
  }
  return null
}

const getRequestToken = (req) => {
  const bearerToken = req.headers.authorization?.split(" ")[1]
  const cookieToken = getCookieValue(req.headers.cookie, "token")
  return bearerToken || cookieToken
}

const signAuthToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" })

const createSecureToken = () => crypto.randomBytes(32).toString("hex")
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex")

const issueEmailVerificationToken = async (user) => {
  const token = createSecureToken()
  user.emailVerificationTokenHash = sha256(token)
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await user.save()
  return token
}

const sendVerificationEmail = async (user) => {
  const token = await issueEmailVerificationToken(user)
  const link = buildVerifyEmailLink(token)
  await sendEmail({
    to: user.email,
    subject: "Verify your HabitFlow email",
    text: `Verify your email by visiting: ${link}`
  })
}

// REGISTER
router.post("/register", async (req, res, next) => {
  try {
    const nameCheck = validateName(req.body?.name)
    if (!nameCheck.ok) return res.status(400).json({ message: nameCheck.message })

    const emailCheck = validateEmail(req.body?.email)
    if (!emailCheck.ok) return res.status(400).json({ message: emailCheck.message })

    const passwordCheck = validatePassword(req.body?.password)
    if (!passwordCheck.ok) return res.status(400).json({ message: passwordCheck.message })

    const existing = await User.findOne({ email: emailCheck.value })
    if (existing) return res.status(400).json({ message: "User already exists" })

    const hashed = await bcrypt.hash(passwordCheck.value, 10)
    const user = await User.create({
      name: nameCheck.value,
      email: emailCheck.value,
      password: hashed,
      isEmailVerified: false
    })

    await sendVerificationEmail(user)

    const token = signAuthToken(user._id)
    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user), message: "Account created. Please verify your email." })
  } catch (err) {
    next(err)
  }
})

// LOGIN
router.post("/login", async (req, res, next) => {
  try {
    const emailCheck = validateEmail(req.body?.email)
    if (!emailCheck.ok) return res.status(400).json({ message: "Invalid credentials" })
    const password = typeof req.body?.password === "string" ? req.body.password : ""

    const user = await User.findOne({ email: emailCheck.value })
    if (!user || !user.password) return res.status(400).json({ message: "Invalid credentials" })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(400).json({ message: "Invalid credentials" })

    const token = signAuthToken(user._id)
    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

// GOOGLE LOGIN
router.post("/google", async (req, res, next) => {
  try {
    const { credential } = req.body
    if (!credential) return res.status(400).json({ message: "Missing Google credential" })

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })
    const payload = ticket.getPayload()
    if (!payload?.email) return res.status(400).json({ message: "Invalid Google token payload" })

    const email = payload.email.trim().toLowerCase()
    const { name, sub } = payload
    let user = await User.findOne({ email })
    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        googleId: sub,
        isEmailVerified: true
      })
    } else if (!user.isEmailVerified) {
      user.isEmailVerified = true
      await user.save()
    }

    const token = signAuthToken(user._id)
    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    next(err)
  }
})

router.post("/forgot-password", forgotPasswordLimiter, async (req, res, next) => {
  try {
    const emailCheck = validateEmail(req.body?.email)
    if (!emailCheck.ok) {
      return res.json({ message: "If that email exists, a reset link has been sent." })
    }

    const user = await User.findOne({ email: emailCheck.value })
    if (!user) return res.json({ message: "If that email exists, a reset link has been sent." })

    const rawToken = createSecureToken()
    user.passwordResetTokenHash = sha256(rawToken)
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await user.save()

    const link = buildResetPasswordLink(rawToken)
    await sendEmail({
      to: user.email,
      subject: "Reset your HabitFlow password",
      text: `Reset your password by visiting: ${link}`
    })

    res.json({ message: "If that email exists, a reset link has been sent." })
  } catch (err) {
    next(err)
  }
})

router.post("/reset-password", async (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : ""
    const passwordCheck = validatePassword(req.body?.password)
    if (!token || !passwordCheck.ok) {
      return res.status(400).json({ message: passwordCheck.ok ? "Invalid token" : passwordCheck.message })
    }

    const tokenHash = sha256(token)
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() }
    })
    if (!user) return res.status(400).json({ message: "Invalid or expired token" })

    user.password = await bcrypt.hash(passwordCheck.value, 10)
    user.passwordResetTokenHash = undefined
    user.passwordResetExpiresAt = undefined
    await user.save()

    res.json({ message: "Password reset successful. Please log in." })
  } catch (err) {
    next(err)
  }
})

router.post("/verify-email", async (req, res, next) => {
  try {
    const token = typeof req.body?.token === "string" ? req.body.token.trim() : ""
    if (!token) return res.status(400).json({ message: "Token is required" })

    const tokenHash = sha256(token)
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpiresAt: { $gt: new Date() }
    })
    if (!user) return res.status(400).json({ message: "Invalid or expired token" })

    user.isEmailVerified = true
    user.emailVerificationTokenHash = undefined
    user.emailVerificationExpiresAt = undefined
    await user.save()

    res.json({ message: "Email verified successfully." })
  } catch (err) {
    next(err)
  }
})

router.post("/resend-verification", authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) return res.status(404).json({ message: "User not found" })
    if (user.isEmailVerified) return res.json({ message: "Email is already verified." })

    await sendVerificationEmail(user)
    res.json({ message: "Verification email sent." })
  } catch (err) {
    next(err)
  }
})

router.get("/me", async (req, res) => {
  try {
    const token = getRequestToken(req)
    if (!token) return res.status(401).json({ message: "Not authenticated" })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")
    if (!user) return res.status(401).json({ message: "Not authenticated" })

    res.json({ user: sanitizeUser(user) })
  } catch {
    res.status(401).json({ message: "Not authenticated" })
  }
})

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax"
  })
  res.json({ message: "Logged out" })
})

export default router
