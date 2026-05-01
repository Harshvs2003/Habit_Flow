import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from "google-auth-library"
import User from "../models/User.js"

const router = express.Router()
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
const isProd = process.env.NODE_ENV === "production"

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
  plan: user.plan || "free"
})

const getCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";")
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=")
    if (name === key) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

const getRequestToken = (req) => {
  const bearerToken = req.headers.authorization?.split(" ")[1]
  const cookieToken = getCookieValue(req.headers.cookie, "token")
  return bearerToken || cookieToken
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(400).json({ message: "User already exists" })
    }

    const hashed = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashed
    })

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return res.status(400).json({ message: "Invalid credentials" })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GOOGLE LOGIN
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body

    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" })
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    if (!payload?.email) {
      return res.status(400).json({ message: "Invalid Google token payload" })
    }

    const { email, name, sub } = payload

    let user = await User.findOne({ email })

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        googleId: sub
      })
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    setAuthCookie(res, token)
    res.json({ token, user: sanitizeUser(user) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get("/me", async (req, res) => {
  try {
    const token = getRequestToken(req)

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId).select("-password")

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" })
    }

    res.json({ user: sanitizeUser(user) })
  } catch (err) {
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
