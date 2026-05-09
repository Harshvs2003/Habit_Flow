const getBaseUrl = () => process.env.CLIENT_URL || "http://localhost:5173"

export const buildVerifyEmailLink = (token) => `${getBaseUrl()}/verify-email?token=${encodeURIComponent(token)}`
export const buildResetPasswordLink = (token) => `${getBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`

export const sendEmail = async ({ to, subject, text }) => {
  const from = process.env.EMAIL_FROM || "no-reply@habitflow.local"

  // If SMTP is not configured, log for local/dev usage.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL:FALLBACK] to=${to} subject="${subject}" body="${text}" from=${from}`)
    return { delivered: false, fallback: true }
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

  await transporter.sendMail({ from, to, subject, text })
  return { delivered: true, fallback: false }
}

