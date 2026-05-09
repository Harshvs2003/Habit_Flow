import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  plan: {
    type: String,
    enum: ["free", "pro", "gold"],
    default: "free"
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationTokenHash: {
    type: String
  },
  emailVerificationExpiresAt: {
    type: Date
  },
  passwordResetTokenHash: {
    type: String
  },
  passwordResetExpiresAt: {
    type: Date
  }
}, { timestamps: true })

export default mongoose.model("User", userSchema)
