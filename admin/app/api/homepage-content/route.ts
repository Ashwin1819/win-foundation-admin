import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Thin proxy to the backend's generic SiteConfig key/value store, used for the
// homepage's static content blocks (Get Involved banner, Mission section) that
// don't need their own dedicated model — just a handful of text/image fields.
// Shares the same store as the Site Settings page's foundationName/footerText/
// seoTitle/seoDescription keys; PUT only touches the keys it's given.

// GET — public
export async function GET() {
  try {
    const response = await backendGet("/site-config");
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET homepage content error:", error);

    return NextResponse.json({ error: "Failed to fetch homepage content" }, { status: 500 });
  }
}

// PUT — admin only. Body is a partial { key: value, ... } object.
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/site-config", getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT homepage content error:", error);

    return NextResponse.json({ error: "Failed to save homepage content" }, { status: 500 });
  }
}
