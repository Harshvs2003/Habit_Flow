const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Terms & Conditions</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: May 2, 2026</p>
        <div className="space-y-4 text-sm text-gray-700">
          <p>By using HabitFlow, you agree to use the service lawfully and avoid misuse, abuse, or unauthorized access.</p>
          <p>Paid plans provide higher usage limits and are billed through Razorpay.</p>
          <p>We may update features, pricing, or these terms with reasonable notice on the website.</p>
          <p>You are responsible for maintaining account confidentiality and notifying us of suspicious account activity.</p>
          <p>For support, contact support@habitflow.hvslabs.online.</p>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions
