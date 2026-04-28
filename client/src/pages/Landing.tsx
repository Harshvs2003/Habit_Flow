const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f6f7fb] dark:bg-black text-center px-6">

      <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
        HabitFlow
      </h1>

      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        Track habits with flexibility. Skip days without guilt. Build consistency that actually works.
      </p>

      <div className="flex gap-4">
        <a href="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-xl">
          Login
        </a>

        <a href="/register" className="border px-6 py-2 rounded-xl">
          Get Started
        </a>
      </div>

    </div>
  )
}

export default Landing