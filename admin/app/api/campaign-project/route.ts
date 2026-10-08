import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts. CampaignProject is one-to-one with Campaign on the backend;
// its single PUT endpoint upserts (creates or updates), so both this route's POST
// and PUT map to the same backend call — matching the existing admin UI, which
// already does its own "does a project exist yet" check and picks POST vs PUT
// accordingly before calling this route.
//
// Calling convention kept identical to the previous lib/db.ts version: GET takes
// ?campaignId=, POST/PUT take campaignId in the body.

async function upsert(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, description, videoUrl, images } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${campaignId}/project`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, videoUrl, images }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Save campaign project error:", error);

    return NextResponse.json({ error: "Failed to save campaign project" }, { status: 500 });
  }
}

// GET — project for a campaign (admin only)
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId");

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${campaignId}/project`, getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET campaign project error:", error);

    return NextResponse.json({ error: "Failed to fetch campaign project" }, { status: 500 });
  }
}

// POST — Create project for a campaign (upserts, see note above)
export async function POST(req: Request) {
  return upsert(req);
}

// PUT — Update project for a campaign (upserts, see note above)
export async function PUT(req: Request) {
  return upsert(req);
}
