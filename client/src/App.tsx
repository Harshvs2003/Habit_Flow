import { Routes, Route, Navigate } from "react-router-dom"
import { useEffect } from "react"

import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"

import ProtectedRoute from "./components/ProtectedRoute"
import PublicRoute from "./components/PublicRoute"
import MainLayout from "./components/layout/MainLayout"

import Today from "./pages/Today"
import Grid from "./pages/Grid"
import Month from "./pages/Month"
import AddHabit from "./pages/AddHabit"
import Insights from "./pages/Insights"
import Settings from "./pages/Settings"
import { useAuthStore } from "./store/useAuthStore"

function App() {
  const hydrateAuth = useAuthStore(state => state.hydrateAuth)

  useEffect(() => {
    hydrateAuth()
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
        <Route path="settings" element={<Settings />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
