const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 sm:px-6 md:px-10 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-6">Last updated: May 2, 2026</p>
        <div className="space-y-4 text-sm text-gray-700">
          <p>HabitFlow collects basic account information (name, email) and app usage data required to provide habit tracking features.</p>
          <p>Payment processing is handled by Razorpay. We do not store your card details on our servers.</p>
          <p>We use secure cookies and authentication tokens to keep your account signed in.</p>
          <p>We do not sell your personal data. Data is used only for service delivery, security, and support.</p>
          <p>For data requests or deletion requests, contact us at support@habitflow.hvslabs.online.</p>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
