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

const BRAND_NAME = process.env.BRAND_NAME || "HabitFlow"

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

const renderActionEmail = ({ heading, intro, ctaText, ctaUrl, outro, note }) => {
  const safeHeading = escapeHtml(heading)
  const safeIntro = escapeHtml(intro)
  const safeOutro = outro ? escapeHtml(outro) : ""
  const safeNote = note ? escapeHtml(note) : ""
  const safeCtaText = escapeHtml(ctaText)
  const safeCtaUrl = String(ctaUrl || "")

  const text = [
    `${heading}`,
    "",
    `${intro}`,
    "",
    `${ctaText}: ${ctaUrl}`,
    note ? `\nNote: ${note}` : "",
    "",
    outro ? `${outro}\n` : "",
    `If you did not request this, you can ignore this email.`,
    `${BRAND_NAME}`
  ]
    .filter(Boolean)
    .join("\n")

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>${safeHeading}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f8fc;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">
    <div style="max-width:560px;margin:0 auto;padding:24px 16px;">
      <div style="padding:14px 16px;margin-bottom:14px;">
        <div style="display:inline-block;padding:6px 10px;border-radius:10px;background:#111827;color:#fff;font-weight:700;letter-spacing:0.2px;font-size:14px;">
          ${escapeHtml(BRAND_NAME)}
        </div>
      </div>

      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">
        <div style="padding:22px 20px 10px 20px;">
          <h1 style="margin:0 0 8px 0;font-size:20px;line-height:1.3;color:#111827;">${safeHeading}</h1>
          <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#374151;">${safeIntro}</p>
        </div>

        <div style="padding:0 20px 18px 20px;">
          <a href="${safeCtaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 16px;border-radius:12px;">
            ${safeCtaText}
          </a>
          <p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;">
            If the button doesn’t work, copy and paste this link:<br />
            <span style="word-break:break-all;color:#374151;">${escapeHtml(safeCtaUrl)}</span>
          </p>
          ${safeNote ? `<p style="margin:10px 0 0 0;font-size:12px;line-height:1.6;color:#6b7280;"><strong style="color:#374151;">Note:</strong> ${safeNote}</p>` : ""}
        </div>

        <div style="border-top:1px solid #e5e7eb;padding:14px 20px;">
          ${safeOutro ? `<p style="margin:0 0 6px 0;font-size:12px;line-height:1.6;color:#6b7280;">${safeOutro}</p>` : ""}
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>

      <p style="margin:14px 4px 0 4px;font-size:11px;line-height:1.6;color:#9ca3af;">
        © ${new Date().getFullYear()} ${escapeHtml(BRAND_NAME)}
      </p>
    </div>
  </body>
</html>`

  return { text, html }
}

export const buildVerifyEmailEmail = ({ link }) =>
  renderActionEmail({
    heading: "Verify your email",
    intro: "Thanks for signing up. Please verify your email address to activate your account.",
    ctaText: "Verify email",
    ctaUrl: link,
    note: "This link expires in 24 hours."
  })

export const buildResetPasswordEmail = ({ link }) =>
  renderActionEmail({
    heading: "Reset your password",
    intro: "We received a request to reset your password. Click the button below to choose a new one.",
    ctaText: "Reset password",
    ctaUrl: link,
    note: "This link expires in 1 hour."
  })

const sendViaResendApi = async ({ apiKey, from, to, subject, text, html }) => {
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
      text,
      ...(html ? { html } : {})
    })
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = data?.message || data?.error?.message || "Failed to send email"
    throw new Error(`Resend API error: ${message}`)
  }

  return { delivered: true, fallback: false, provider: "resend_api" }
}

export const sendEmail = async ({ to, subject, text, html }) => {
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
        text,
        html
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
    await transporter.sendMail({ from, to, subject, text, ...(html ? { html } : {}) })
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
