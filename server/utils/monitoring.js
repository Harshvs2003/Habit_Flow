let sentryClient = null

export const initMonitoring = async () => {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return

  try {
    const sentry = await import("@sentry/node")
    sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0)
    })
    sentryClient = sentry
  } catch (err) {
    console.warn("Sentry DSN provided but @sentry/node is not installed.")
  }
}

export const captureError = (err, context = {}) => {
  const payload = {
    message: err?.message || "Unknown error",
    stack: err?.stack,
    ...context
  }
  console.error("[SERVER_ERROR]", payload)

  if (sentryClient) {
    sentryClient.captureException(err, { extra: context })
  }
}

