import { captureError } from "../utils/monitoring.js"

export const notFoundHandler = (req, res) => {
  res.status(404).json({ message: "Route not found" })
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500

  captureError(err, {
    method: req.method,
    path: req.originalUrl,
    userId: req.userId || null,
    statusCode
  })

  const message = statusCode >= 500 ? "Server error" : err.message
  res.status(statusCode).json({ message })
}

