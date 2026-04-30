import { Eye } from "lucide-react"

const Login = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        {/* LEFT - FORM */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">

          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 bg-indigo-500 rounded-md"></div>
            <span className="font-semibold text-gray-800">HabitFlow</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Welcome Back!
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Log in to continue your habit journey.
          </p>

          {/* Inputs */}
          <div className="flex flex-col gap-4">

            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <div className="relative">
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <Eye className="absolute right-3 top-3 text-gray-400" size={18} />
            </div>

            <div className="text-right text-sm">
              <span className="text-indigo-500 cursor-pointer hover:underline">
                Forgot Password?
              </span>
            </div>

            {/* Button */}
            <button className="mt-2 w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-2.5 rounded-lg hover:opacity-90 transition">
              Log In
            </button>

          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6 text-sm text-gray-400">
            <div className="flex-1 h-px bg-gray-200"></div>
            or continue with
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Google Button */}
          <button className="w-full border border-gray-200 py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-sm text-gray-400 mt-6 text-center">
            Don’t have an account?{" "}
            <span className="text-indigo-500 font-medium cursor-pointer">
              Sign up
            </span>
          </p>
        </div>

        {/* RIGHT - VISUAL */}
        <div className="hidden md:flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 relative p-10">

          <div className="text-center text-white max-w-xs">
            <p className="text-lg font-medium leading-relaxed">
              Small steps every day lead to big changes.
            </p>

            <div className="flex justify-center gap-2 mt-6">
              <div className="w-6 h-1 bg-white rounded-full"></div>
              <div className="w-2 h-1 bg-white/50 rounded-full"></div>
              <div className="w-2 h-1 bg-white/50 rounded-full"></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

export default Login