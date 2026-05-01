const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: May 2, 2026</p>
        <div className="space-y-4 text-sm text-gray-700">
          <p>Subscription payments are generally non-refundable once successfully processed.</p>
          <p>If you were charged incorrectly or experienced a technical billing issue, please contact us within 7 days.</p>
          <p>Verified duplicate or failed-but-debited transactions will be resolved according to Razorpay and banking timelines.</p>
          <p>For refund requests, write to support@habitflow.hvslabs.online with payment details and your account email.</p>
        </div>
      </div>
    </div>
  )
}

export default RefundPolicy
