"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one from the login page.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to reset password.");
      }

      setSuccess(true);

      setTimeout(() => {
        router.push("/admin/login");
      }, 2000);
    } catch (error) {
      console.error("Reset password error:", error);
      setError(error instanceof Error ? error.message : "Failed to reset password.");
    } finally {
      setLoading(false);
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
          Set a new password
        </p>

        {success ? (
          <p style={{ color: "#15803d" }}>
            Password updated. Redirecting to login...
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New password</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

            <label>Confirm new password</label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the new password"
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
              {loading ? "Saving..." : "Set new password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
