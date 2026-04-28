import mongoose from "mongoose"

const dayStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  status: {
    type: String,
    enum: ["active", "skipped"],
    default: "active"
  }
})

// one status per day
dayStatusSchema.index({ userId: 1, date: 1 }, { unique: true })

export default mongoose.model("DayStatus", dayStatusSchema)