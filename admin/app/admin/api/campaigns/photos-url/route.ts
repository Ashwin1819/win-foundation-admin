import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

export const runtime = "nodejs";

// POST — Add a photo to a campaign's gallery from an already-hosted URL (e.g.
// Supabase Storage, uploaded directly from the browser) rather than a file
// passed through this server. JSON body: { campaignId, image, caption?, order? }
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, ...fields } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${campaignId}/photos/url`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST campaign photo (url) error:", error);

    return NextResponse.json({ error: "Failed to add photo" }, { status: 500 });
  }
}
