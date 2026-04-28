import React from "react"
import ReactDOM from "react-dom/client"
import { GoogleOAuthProvider } from "@react-oauth/google"
import App from "./App"
import "./index.css"
import { BrowserRouter } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
)
