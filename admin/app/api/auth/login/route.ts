import { NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME } from "@/lib/verifyAdmin";

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

// Forwards admin login to the backend's real AdminUser/JWT system and stores the
// returned token as an httpOnly cookie — never exposed to client-side JS.
export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const backendResponse = await fetch(`${BACKEND_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok || !data.token) {
      return NextResponse.json(
        { error: data.error || "Invalid email or password" },
        { status: backendResponse.status || 401 }
      );
    }

    const response = NextResponse.json({ success: true, admin: data.admin });

    response.cookies.set(ADMIN_COOKIE_NAME, data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days, matches the backend's JWT expiry
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
