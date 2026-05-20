import { useState } from "react"
import API, { fetchWithAuth, parseResponseBody } from "../services/api"
import { plans, type PlanKey } from "../config/plans"
import { useAuthStore } from "../store/useAuthStore"

declare global {
  interface Window {
    Razorpay: any
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

const Pricing = () => {
  const user = useAuthStore(state => state.user)
  const updatePlan = useAuthStore(state => state.updatePlan)
  const setUser = useAuthStore(state => state.setUser)
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | "">("")
  const [billingType, setBillingType] = useState<"one_time" | "recurring">("one_time")
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const currentPlan = user?.plan || "free"

  const handleChoosePlan = async (plan: PlanKey) => {
    const planRank: Record<PlanKey, number> = { free: 0, pro: 1, gold: 2 }

    try {
      setError("")
      setSuccessMessage("")
      setLoadingPlan(plan)

      if (planRank[plan] < planRank[currentPlan]) {
        throw new Error("Lower plans cannot be selected from your current plan")
      }

      if (plan === "free") {
        await updatePlan(plan)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway")
      }

      const endpoint =
        billingType === "recurring" ? `${API}/payment/create-subscription` : `${API}/payment/create-order`
      const checkoutRes = await fetchWithAuth(endpoint, {
        method: "POST",
        body: JSON.stringify(
          billingType === "recurring" ? { plan, interval: billingInterval } : { plan }
        )
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
          description:
            billingType === "recurring"
              ? `${plan.toUpperCase()} Plan (${billingInterval})`
              : `${plan.toUpperCase()} Plan`,
          order_id: billingType === "one_time" ? checkoutData.orderId : undefined,
          subscription_id:
            billingType === "recurring" ? checkoutData.subscriptionId : undefined,
          prefill: {
            name: user?.name || "",
            email: user?.email || ""
          },
          handler: async (response: any) => {
            try {
              const verifyRes = await fetchWithAuth(`${API}/payment/verify`, {
                method: "POST",
                body: JSON.stringify({
                  plan,
                  billingType,
                  billingInterval: billingType === "recurring" ? billingInterval : undefined,
                  ...response
                })
              })
              const verifyData = await parseResponseBody(verifyRes)

              if (!verifyRes.ok) {
                throw new Error(verifyData.message || "Payment verification failed")
              }

              setUser({ plan: verifyData.user.plan })
              setSuccessMessage(
                billingType === "recurring"
                  ? "Subscription active. Keep tracking habits and keep growing every day."
                  : "Thank you for purchasing. Keep tracking habits and keep growing every day."
              )
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
  const planRank: Record<PlanKey, number> = { free: 0, pro: 1, gold: 2 }

  return (
    <div className="min-h-screen bg-[#f6f7fb] dark:bg-black px-6 md:px-10 py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">Upgrade Plan</h1>
        <p className="text-sm text-gray-500 mb-6">Choose the plan that fits your habit journey.</p>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0b1220] p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Billing Type</p>
              <p className="text-xs text-gray-500">Choose one-time payment or recurring subscription.</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setBillingType("one_time")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  billingType === "one_time"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                One-time
              </button>
              <button
                onClick={() => setBillingType("recurring")}
                className={`px-3 py-2 rounded-lg text-sm ${
                  billingType === "recurring"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                }`}
              >
                Recurring
              </button>
            </div>
          </div>

          {billingType === "recurring" && (
            <div className="mt-3">
              <label className="text-xs text-gray-500 mr-2">Interval:</label>
              <select
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as "monthly" | "yearly")}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 mb-4">{successMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planOrder.map((plan) => {
            const config = plans[plan]
            const isCurrent = currentPlan === plan
            const isLowerThanCurrent = planRank[plan] < planRank[currentPlan]
            const isBlocked = isCurrent || isLowerThanCurrent
            const isGold = plan === "gold"

            return (
              <div
                key={plan}
                className={`rounded-2xl border p-5 ${
                  isLowerThanCurrent
                    ? "border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-900/40 opacity-70"
                    : 
                  isGold
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

                <p className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Rs {config.price}</p>
                <p className="text-sm text-gray-500 mb-4">
                  {Number.isFinite(config.maxHabits) ? `${config.maxHabits} habits` : "Unlimited habits"}
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
                  {isCurrent
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
