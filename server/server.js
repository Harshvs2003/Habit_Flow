import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import helmet from "helmet"
import rateLimit from "express-rate-limit"
import connectDB from "./utils/db.js"
import habitRoutes from "./routes/habitRoutes.js"
import entryRoutes from "./routes/entryRoutes.js"
import dayStatusRoutes from "./routes/dayStatusRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"

dotenv.config()

const app = express()
app.set("trust proxy", 1)

const allowedOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

const isLocalOrigin = (origin) => {
  // Allow typical local development hosts, including LAN testing.
  const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(:\d+)?$/i
  return localOriginPattern.test(origin)
}

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    if (!origin) return callback(null, true)

    if (isLocalOrigin(origin) || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error("Not allowed by CORS"))
  }
}

// Connect DB
connectDB()

// Middleware
app.use(cors(corsOptions))
app.use("/api/payment/webhook", express.raw({ type: "application/json" }))
app.use(express.json())
app.use(helmet())

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { message: "Too many login attempts, please try again later." }
})

app.use(generalLimiter)

// Test route
app.get("/", (req, res) => {
  res.send("API is running...")
})

app.use("/api/habits", habitRoutes)
app.use("/api/entries", entryRoutes)
app.use("/api/day-status", dayStatusRoutes)
app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/user", userRoutes)
app.use("/api/payment", paymentRoutes)

app.use((err, req, res, next) => {
  res.status(500).json({ message: "Server error" })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
