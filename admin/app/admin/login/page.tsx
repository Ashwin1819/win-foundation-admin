"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Invalid email or password.");
      }

      router.push("/admin");
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error instanceof Error ? error.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();

    setForgotMessage("");
    setForgotLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      // Always show the backend's generic message, whether or not the
      // account exists — don't let the UI leak anything the API doesn't.
      setForgotMessage(data?.message || "If that email is registered, a password reset link has been sent.");
    } catch (error) {
      console.error("Forgot password error:", error);
      setForgotMessage("Something went wrong. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f7f7",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "8px" }}>
          WIN Foundations
        </h1>

        <p style={{ color: "#666", marginBottom: "30px" }}>
          Admin Panel Login
        </p>

        {!showForgotForm ? (
          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                marginBottom: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />

            <label>Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                marginBottom: "8px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />

            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowForgotForm(true);
                  setForgotEmail(email);
                  setForgotMessage("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2563eb",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            {error && (
              <p style={{ color: "red", marginBottom: "15px" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                background: "#111",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword}>
            <label>Email</label>

            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your admin email"
              required
              style={{
                width: "100%",
                padding: "12px",
                marginTop: "8px",
                marginBottom: "20px",
                border: "1px solid #ddd",
                borderRadius: "8px",
              }}
            />

            {forgotMessage && (
              <p style={{ color: "#15803d", marginBottom: "15px", fontSize: "14px" }}>
                {forgotMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={forgotLoading}
              style={{
                width: "100%",
                padding: "13px",
                background: "#111",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                marginBottom: "12px",
              }}
            >
              {forgotLoading ? "Sending..." : "Send reset link"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotForm(false);
                setForgotMessage("");
              }}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
