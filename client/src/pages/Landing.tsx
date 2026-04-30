import { Link } from "react-router-dom"

const features = [
  {
    title: "Smart Habit Tracking",
    description: "Track daily progress with a clean timeline designed for consistency.",
    icon: "HT"
  },
  {
    title: "Flexible Skips",
    description: "Skip days when needed while keeping your momentum visible and realistic.",
    icon: "SK"
  },
  {
    title: "Progress Insights",
    description: "See completion patterns and monthly trends that help you improve faster.",
    icon: "IN"
  },
  {
    title: "Focused Experience",
    description: "Distraction-free design that keeps your goals front and center every day.",
    icon: "FX"
  }
]

const steps = [
  {
    number: "1",
    title: "Create Your Habits",
    description: "Add routines that matter to your day-to-day growth."
  },
  {
    number: "2",
    title: "Track Daily Progress",
    description: "Mark completed habits and stay in rhythm over time."
  },
  {
    number: "3",
    title: "Review and Improve",
    description: "Use insights to refine your routine and keep moving."
  }
]

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10 sm:py-14">
        <section className="flex flex-col md:flex-row items-center gap-10 md:gap-14">
          <div className="w-full md:w-1/2">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-500 font-semibold mb-4">
              HabitFlow
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl leading-tight text-gray-800 font-semibold">
              Build Better Habits.
              <br />
              Build a <span className="text-indigo-500">Better You.</span>
            </h1>
            <p className="text-gray-400 mt-5 max-w-xl">
              HabitFlow helps you stay consistent with a simple, modern system for
              tracking habits, understanding progress, and building routines that
              actually last.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link
                to="/register"
                className="inline-flex justify-center bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition"
              >
                Get Started
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex justify-center border border-gray-200 px-5 py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="w-full md:w-1/2">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_20px_60px_rgba(99,102,241,0.2)] p-4 sm:p-5">
              <div className="rounded-xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-800">Monthly Snapshot</span>
                  <span className="text-xs text-gray-400">This Month</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Morning Run</span>
                      <span>84%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[84%] bg-indigo-500 rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Reading</span>
                      <span>72%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[72%] bg-indigo-500 rounded-full" />
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>Hydration</span>
                      <span>91%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-[91%] bg-indigo-500 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mt-16 sm:mt-20">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl text-gray-800 font-semibold">
              Why Choose HabitFlow?
            </h2>
            <p className="text-gray-400 mt-2">
              Everything you need to build consistency without complexity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-500 text-xs font-semibold flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-gray-800 font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="mt-16 sm:mt-20">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl text-gray-800 font-semibold">
              How It Works
            </h2>
            <p className="text-gray-400 mt-2">Simple steps to build lasting routines.</p>
          </div>

          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {steps.map((step) => (
              <div
                key={step.number}
                className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-6 text-center"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-500 text-white text-sm font-semibold flex items-center justify-center mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="text-gray-800 font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-20 bg-indigo-50 rounded-2xl p-6 sm:p-8 md:p-10">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="w-full sm:w-3/5">
              <h2 className="text-2xl sm:text-3xl text-gray-800 font-semibold">
                Ready to stay consistent every day?
              </h2>
              <p className="text-gray-400 mt-3 max-w-lg">
                Start using HabitFlow and turn your intentions into a system that
                helps you improve one day at a time.
              </p>
              <Link
                to="/register"
                className="inline-flex mt-6 bg-indigo-500 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-600 transition"
              >
                Start Free
              </Link>
            </div>

            <div className="w-full sm:w-2/5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] p-5">
                <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/60 h-32 flex items-center justify-center">
                  <span className="text-sm text-indigo-400">Illustration Placeholder</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#0b1220] mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold text-lg">HabitFlow</h3>
              <p className="text-gray-400 text-sm mt-2">
                Build better habits with clarity and consistency.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Product</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Features</li>
                <li>Pricing</li>
                <li>Roadmap</li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Company</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>About</li>
                <li>Careers</li>
                <li>Blog</li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-3">Support</p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Help Center</li>
                <li>Contact</li>
                <li>Status</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-5 text-sm text-gray-400">
            © {new Date().getFullYear()} HabitFlow. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
