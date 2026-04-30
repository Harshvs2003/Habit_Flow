import jwt from "jsonwebtoken"

const getCookieValue = (cookieHeader, key) => {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(";")
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.trim().split("=")
    if (name === key) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return null
}

const authMiddleware = (req, res, next) => {
  try {
    const bearerToken = req.headers.authorization?.split(" ")[1]
    const cookieToken = getCookieValue(req.headers.cookie, "token")
    const token = bearerToken || cookieToken

    if (!token) {
      return res.status(401).json({ message: "No token" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.userId = decoded.userId
    next()

  } catch (err) {
    res.status(401).json({ message: "Invalid token" })
  }
}

export default authMiddleware
