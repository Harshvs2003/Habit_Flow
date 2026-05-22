const LOCAL_HOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?$/i

const toList = (value) =>
  (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

const getBaseUrl = () => {
  const explicit =
    process.env.PUBLIC_APP_URL ||
    process.env.APP_BASE_URL ||
    process.env.FRONTEND_URL

  if (explicit) return explicit

  const clientUrl = process.env.CLIENT_URL
  const clientUrls = toList(process.env.CLIENT_URLS)
  const all = [clientUrl, ...clientUrls].filter(Boolean)
  const nonLocalUrl = all.find((url) => !LOCAL_HOST_PATTERN.test(url))
  const isRender = String(process.env.RENDER || "").toLowerCase() === "true"

  if (process.env.NODE_ENV === "production" || isRender) {
    if (nonLocalUrl) return nonLocalUrl
  }

  if (clientUrl && !LOCAL_HOST_PATTERN.test(clientUrl)) {
    return clientUrl
  }

  if (clientUrl && LOCAL_HOST_PATTERN.test(clientUrl) && nonLocalUrl) {
    // Guard against mixed envs where CLIENT_URL is localhost but a real domain is available.
    return nonLocalUrl
  }

  return clientUrl || all[0] || "http://localhost:5173"
}

export const buildVerifyEmailLink = (token) => `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`
export const buildResetPasswordLink = (token) => `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`

const sendViaResendApi = async ({ apiKey, from, to, subject, text }) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.message || data?.error?.message || "Failed to send email"
    throw new Error(`Resend API error: ${message}`)
  }

  return { delivered: true, fallback: false, provider: "resend_api" }
}

export const sendEmail = async ({ to, subject, text }) => {
  const from = process.env.EMAIL_FROM || "no-reply@habitflow.local"
  const isDev = process.env.NODE_ENV !== "production"
  const hasSmtpConfig = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  const smtpHost = String(process.env.SMTP_HOST || "")
  const isResendSmtp = smtpHost.toLowerCase().includes("resend.com") && process.env.SMTP_USER === "resend"

  // In local/dev, allow fallback logging when SMTP is not configured.
  if (!hasSmtpConfig && isDev) {
    console.log(`[EMAIL:FALLBACK] to=${to} subject="${subject}" body="${text}" from=${from}`)
    return { delivered: false, fallback: true }
  }

  // In production, never pretend email was sent if SMTP is missing.
  if (!hasSmtpConfig) {
    throw new Error("SMTP is not configured on server")
  }

  // Render (and some providers) may block outbound SMTP ports; Resend API over HTTPS is more reliable.
  if (isResendSmtp) {
    try {
      return await sendViaResendApi({
        apiKey: process.env.SMTP_PASS,
        from,
        to,
        subject,
        text
      })
    } catch (err) {
      if (!isDev) throw err
      console.warn(`[EMAIL:DEV_FALLBACK] Resend API send failed: ${(err && err.message) || err}`)
      console.log(`[EMAIL:FALLBACK] to=${to} subject="${subject}" body="${text}" from=${from}`)
      return { delivered: false, fallback: true }
    }
  }

  const nodemailer = await import("nodemailer")
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  try {
    await transporter.sendMail({ from, to, subject, text })
    return { delivered: true, fallback: false }
  } catch (err) {
    if (isDev) {
      console.warn(`[EMAIL:DEV_FALLBACK] SMTP send failed: ${(err && err.message) || err}`)
      console.log(`[EMAIL:FALLBACK] to=${to} subject="${subject}" body="${text}" from=${from}`)
      return { delivered: false, fallback: true }
    }
    throw err
  }
}
