import { NextResponse } from "next/server";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

// Plain forward to the backend — it owns the AdminUser table and the generic,
// non-leaking response. Nothing admin-specific to do here.
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Forgot password error:", error);

    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
