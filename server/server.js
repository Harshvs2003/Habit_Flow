import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./utils/db.js"

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

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})