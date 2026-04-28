import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./utils/db.js"
import habitRoutes from "./routes/habitRoutes.js"
import entryRoutes from "./routes/entryRoutes.js"
import dayStatusRoutes from "./routes/dayStatusRoutes.js"
import authRoutes from "./routes/authRoutes.js"

dotenv.config()

const app = express()

// Connect DB
connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Test route
app.get("/", (req, res) => {
  res.send("API is running...")
})

app.use("/api/habits", habitRoutes)
app.use("/api/entries", entryRoutes)
app.use("/api/day-status", dayStatusRoutes)
app.use("/api/auth", authRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})