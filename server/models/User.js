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
  subscription: {
    billingType: {
      type: String,
      enum: ["none", "one_time", "recurring"],
      default: "none"
    },
    interval: {
      type: String,
      enum: ["monthly", "yearly", null],
      default: null
    },
    status: {
      type: String,
      enum: ["inactive", "created", "authenticated", "active", "charged", "halted", "cancelled"],
      default: "inactive"
    },
    subscriptionId: {
      type: String
    },
    currentPeriodStart: {
      type: Date
    },
    currentPeriodEnd: {
      type: Date
    },
    cancelAtCycleEnd: {
      type: Boolean,
      default: false
    },
    cancelledAt: {
      type: Date
    }
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
