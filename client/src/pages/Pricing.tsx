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
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const currentPlan = user?.plan || "free"

  const handleChoosePlan = async (plan: PlanKey) => {
    try {
      setError("")
      setSuccessMessage("")
      setLoadingPlan(plan)

      if (plan === "free") {
        await updatePlan(plan)
        return
      }

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error("Unable to load payment gateway")
      }

      const orderRes = await fetchWithAuth(`${API}/payment/create-order`, {
        method: "POST",
        body: JSON.stringify({ plan })
      })
      const orderData = await parseResponseBody(orderRes)

      if (!orderRes.ok) {
        throw new Error(orderData.message || "Failed to create payment order")
      }

      await new Promise<void>((resolve, reject) => {
        const razorpay = new window.Razorpay({
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "HabitFlow",
          description: `${plan.toUpperCase()} Plan`,
          order_id: orderData.orderId,
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
                  ...response
                })
              })
              const verifyData = await parseResponseBody(verifyRes)

              if (!verifyRes.ok) {
                throw new Error(verifyData.message || "Payment verification failed")
              }

              setUser({ plan: verifyData.user.plan })
              setSuccessMessage("Thank you for purchasing. Keep tracking habits and keep growing every day.")
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

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
        {successMessage && <p className="text-sm text-green-600 mb-4">{successMessage}</p>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planOrder.map((plan) => {
            const config = plans[plan]
            const isCurrent = currentPlan === plan
            const isGold = plan === "gold"

            return (
              <div
                key={plan}
                className={`rounded-2xl border p-5 ${
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
                  disabled={isCurrent || loadingPlan === plan}
                  onClick={() => handleChoosePlan(plan)}
                  className={`w-full py-2 rounded-xl text-sm ${
                    isCurrent
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 text-white"
                  }`}
                >
                  {isCurrent ? "Current Plan" : loadingPlan === plan ? "Processing..." : "Choose Plan"}
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
