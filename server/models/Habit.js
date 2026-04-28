import mongoose from "mongoose"

const habitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  category: {
    type: String
  }
}, { timestamps: true })

export default mongoose.model("Habit", habitSchema)