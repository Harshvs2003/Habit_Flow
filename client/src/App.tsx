import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import VerifyEmail from "./pages/VerifyEmail"

import ProtectedRoute from "./components/ProtectedRoute"
import PublicRoute from "./components/PublicRoute"
import MainLayout from "./components/layout/MainLayout"

import Today from "./pages/Today"
import Grid from "./pages/Grid"
import Month from "./pages/Month"
import AddHabit from "./pages/AddHabit"
import Insights from "./pages/Insights"
import Pricing from "./pages/Pricing"
import PrivacyPolicy from "./pages/PrivacyPolicy"
import TermsAndConditions from "./pages/TermsAndConditions"
import RefundPolicy from "./pages/RefundPolicy"
import Contact from "./pages/Contact"
import { useAuthStore } from "./store/useAuthStore"

function App() {
  const hydrateAuth = useAuthStore(state => state.hydrateAuth)
  const clearAuth = useAuthStore(state => state.clearAuth)

  useEffect(() => {
    hydrateAuth()
  }, [hydrateAuth])

  useEffect(() => {
    const channel = new BroadcastChannel("auth")
    const onMessage = (event: MessageEvent) => {
      if (event.data === "logout") {
        clearAuth()
      }
    }

    channel.addEventListener("message", onMessage)
    return () => {
      channel.removeEventListener("message", onMessage)
      channel.close()
    }
  }, [clearAuth])

  useEffect(() => {
    const handleFocus = () => {
      hydrateAuth()
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [hydrateAuth])

  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Landing />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/contact" element={<Contact />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Today />} />
        <Route path="grid" element={<Grid />} />
        <Route path="month" element={<Month />} />
        <Route path="add" element={<AddHabit />} />
        <Route path="insights" element={<Insights />} />
      </Route>

      <Route
        path="/today"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Today />} />
      </Route>

      <Route
        path="/grid"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Grid />} />
      </Route>

      <Route
        path="/month"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Month />} />
      </Route>

      <Route
        path="/upgrade"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Pricing />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
