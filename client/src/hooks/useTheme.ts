import { useEffect, useState } from "react"

export const useTheme = () => {
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Apply theme on first load
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null

    const currentTheme = saved || "light"
    setTheme(currentTheme)

    if (currentTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"

    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)

    if (newTheme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }

  return { theme, toggleTheme }
}