import mongoose from "mongoose"

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    plan: {
      type: String,
      enum: ["free", "pro", "gold"],
      required: true
    },
    orderId: {
      type: String
    },
    paymentId: {
      type: String
    },
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["created", "verified", "captured", "failed", "ignored"],
      required: true
    },
    source: {
      type: String,
      enum: ["client_verify", "webhook"],
      required: true
    },
    webhookEventId: {
      type: String
    },
    eventType: {
      type: String
    }
  },
  { timestamps: true }
)

paymentSchema.index({ paymentId: 1 }, { unique: true, sparse: true })
paymentSchema.index({ orderId: 1 }, { sparse: true })
paymentSchema.index({ webhookEventId: 1 }, { unique: true, sparse: true })

export default mongoose.model("Payment", paymentSchema)
