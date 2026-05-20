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
    subscriptionId: {
      type: String
    },
    paymentId: {
      type: String
    },
    billingType: {
      type: String,
      enum: ["one_time", "recurring"],
      default: "one_time"
    },
    billingInterval: {
      type: String,
      enum: ["monthly", "yearly"]
    },
    amount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        "created",
        "authenticated",
        "verified",
        "captured",
        "charged",
        "active",
        "cancelled",
        "halted",
        "failed",
        "ignored"
      ],
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
paymentSchema.index({ subscriptionId: 1 }, { sparse: true })
paymentSchema.index({ webhookEventId: 1 }, { unique: true, sparse: true })

export default mongoose.model("Payment", paymentSchema)
