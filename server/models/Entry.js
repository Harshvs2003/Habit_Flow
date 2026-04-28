import mongoose from "mongoose"

const entrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  habitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Habit",
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
})

// prevent duplicates
entrySchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true })

export default mongoose.model("Entry", entrySchema)