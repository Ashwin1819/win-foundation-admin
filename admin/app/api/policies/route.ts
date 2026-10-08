import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's PolicyPage model (Privacy Policy / Terms & Conditions
// content shown at /privacy-policy and /terms-conditions on the public site).

// GET — public. Returns both policies at once: { PRIVACY: "...", TERMS: "..." }
export async function GET() {
  try {
    const [privacyRes, termsRes] = await Promise.all([
      backendGet("/policies/PRIVACY"),
      backendGet("/policies/TERMS"),
    ]);

    const privacy = privacyRes.ok ? await privacyRes.json() : null;
    const terms = termsRes.ok ? await termsRes.json() : null;

    return NextResponse.json({
      PRIVACY: privacy?.content ?? "",
      TERMS: terms?.content ?? "",
    });
  } catch (error) {
    console.error("GET policies error:", error);

    return NextResponse.json({ error: "Failed to fetch policies" }, { status: 500 });
  }
}

// PUT — admin only. Body: { type: "PRIVACY" | "TERMS", content: string }
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, content } = body;

    if (!type || typeof content !== "string") {
      return NextResponse.json({ error: "type and content are required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/policies/${type}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT policy error:", error);

    return NextResponse.json({ error: "Failed to save policy" }, { status: 500 });
  }
}
