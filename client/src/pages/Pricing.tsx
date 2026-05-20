import { useState } from "react"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import { plans, type PlanKey } from "../config/plans"
import { useAuthStore } from "../store/useAuthStore"

declare global {
  interface RazorpayPaymentResponse {
    razorpay_payment_id: string
    razorpay_subscription_id: string
    razorpay_signature: string
  }

  interface RazorpayOptions {
    key: string
    amount: number
    currency: string
    name: string
    description: string
    subscription_id: string
    prefill: {
      name: string
      email: string
    }
    handler: (response: RazorpayPaymentResponse) => void | Promise<void>
    modal: {
      ondismiss: () => void
    }
    theme: {
      color: string
    }
  }

  interface RazorpayInstance {
    open: () => void
  }

  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance
  }
}

const loadRazorpayScript = () =>
  new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

const planRank: Record<PlanKey, number> = { free: 0, pro: 1, gold: 2 }
const intervalRank: Record<"monthly" | "yearly", number> = { monthly: 1, yearly: 2 }

const promoPricing: Record<"monthly" | "yearly", Record<PlanKey, { current: number; original: number }>> = {
  monthly: {
    free: { current: 0, original: 0 },
    pro: { current: 29, original: 49 },
    gold: { current: 49, original: 99 }
  },
  yearly: {
    free: { current: 0, original: 0 },
    pro: { current: 319, original: 349 },
    gold: { current: 539, original: 589 }
  }
}

const Pricing = () => {
  const user = useAuthStore(state => state.user)
  const setUser = useAuthStore(state => state.setUser)
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | "">("")
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const currentPlan = user?.plan || "free"
  const currentInterval = user?.subscription?.interval || null
  const currentStatus = user?.subscription?.status || "inactive"

  const handleChoosePlan = async (plan: PlanKey) => {
    const currentPlanRank = planRank[currentPlan]
    const nextPlanRank = planRank[plan]

    try {
      setError("")
      setSuccessMessage("")
      setLoadingPlan(plan)

      if (plan === "free") {
        throw new Error("Free plan cannot be selected from paid subscription flow")
      }

      if (nextPlanRank < currentPlanRank) {
        throw new Error("Lower plans cannot be selected from your current plan")
      }

      if (nextPlanRank === currentPlanRank && currentInterval) {
        if (intervalRank[billingInterval] <= intervalRank[currentInterval]) {
          throw new Error("Select a higher billing interval or plan to continue")
        }
      }

      if (
        currentPlan === plan &&
        currentInterval === billingInterval &&
        ["created", "authenticated", "active", "charged"].includes(currentStatus)
      ) {
        throw new Error("You are already on this subscription")
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway")
      }

      const checkoutRes = await fetchWithAuth(`${API}/payment/create-subscription`, {
        method: "POST",
        body: JSON.stringify({ plan, interval: billingInterval })
      })
      const checkoutData = await parseResponseBody(checkoutRes)

      if (!checkoutRes.ok) {
        throw new Error(checkoutData.message || "Failed to initialize payment")
      }

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: checkoutData.keyId,
          amount: checkoutData.amount || plans[plan].price * 100,
          currency: checkoutData.currency || "INR",
          name: "HabitFlow",
          description: `${plan.toUpperCase()} Plan (${billingInterval})`,
          subscription_id: checkoutData.subscriptionId,
          prefill: {
            name: user?.name || "",
            email: user?.email || ""
          },
          handler: async (response: RazorpayPaymentResponse) => {
            try {
              const verifyRes = await fetchWithAuth(`${API}/payment/verify`, {
                method: "POST",
                body: JSON.stringify({
                  plan,
                  billingType: "recurring",
                  billingInterval,
                  ...response
                })
              })
              const verifyData = await parseResponseBody(verifyRes)

              if (!verifyRes.ok) {
                throw new Error(verifyData.message || "Payment verification failed")
              }

              setUser({
                plan: verifyData.user.plan,
                subscription: verifyData.user.subscription
              })
              setSuccessMessage("Subscription active. Keep tracking habits and keep growing every day.")
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          modal: {
            ondismiss: () => reject(new Error("Payment cancelled"))
          },
          theme: {
            color: "#4f46e5"
          }
        })

        razorpay.open()
      })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoadingPlan("")
    }
  }

  const planOrder: PlanKey[] = ["free", "pro", "gold"]

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-6 md:px-10 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Upgrade Plan</h1>
        <p className="text-sm text-gray-500 mb-6">Choose the plan that fits your habit journey.</p>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b1220] p-4 mb-6">
          <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white text-center mb-3">
            Choose Your Plan
          </p>
          <div className="flex items-center justify-center">
            <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-900 p-1">
              <button
                onClick={() => setBillingInterval("monthly")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  billingInterval === "monthly"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval("yearly")}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  billingInterval === "yearly"
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 mb-4">{successMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planOrder.map((plan) => {
            const config = plans[plan]
            const isCurrentTier = currentPlan === plan
            const isLowerThanCurrent = planRank[plan] < planRank[currentPlan]
            const isCurrentOrLowerInterval =
              isCurrentTier &&
              currentInterval !== null &&
              intervalRank[billingInterval] <= intervalRank[currentInterval]
            const isBlocked = plan === "free" || isLowerThanCurrent || isCurrentOrLowerInterval
            const isGold = plan === "gold"

            return (
              <div
                key={plan}
                className={`rounded-2xl border p-5 ${
                  isLowerThanCurrent || plan === "free"
                    ? "border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900/40 opacity-70"
                    : isGold
                      ? "border-amber-400 bg-amber-50/60 dark:bg-amber-900/10"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b1220]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{config.label}</h2>
                  {isGold && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-200 text-amber-800">Recommended</span>
                  )}
                </div>

                <div className="mb-2">
                  <p className="inline-flex items-center rounded-full bg-linear-to-r from-red-600 to-rose-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm mb-2">
                    Limited Time Offer
                  </p>
                  <p className="text-base md:text-lg font-semibold text-gray-500/90 line-through decoration-2 decoration-gray-500">
                    Rs {promoPricing[billingInterval][plan].original}
                  </p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Rs {promoPricing[billingInterval][plan].current}
                  </p>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {Number.isFinite(config.maxHabits) ? `${config.maxHabits} habits` : "Unlimited habits"} • {billingInterval}
                </p>

                <button
                  disabled={isBlocked || loadingPlan === plan}
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full py-2 rounded-xl text-sm ${
                    isBlocked
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {plan === "free"
                    ? "Free Tier"
                    : isCurrentTier && !isCurrentOrLowerInterval
                      ? "Switch to Yearly"
                      : isCurrentOrLowerInterval
                        ? "Current Plan"
                        : isLowerThanCurrent
                          ? "Lower Plan"
                          : loadingPlan === plan
                            ? "Processing..."
                            : "Choose Plan"}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Pricing
