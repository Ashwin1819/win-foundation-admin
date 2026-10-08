import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma CampaignUpdate model has incompatible
// ids/fields. See prisma/contract.prisma for the now-unused legacy model.
//
// isPublished/publishedAt (added to the backend's CampaignUpdate model in the
// Phase 5 follow-up) are now forwarded like any other field — sortOrder is still
// dropped, since the backend model has no order concept for updates.
//
// Calling convention kept identical to the previous lib/db.ts version: GET takes
// ?campaignId=, POST takes campaignId in the body, PUT/DELETE take id.

// GET — updates for a campaign (admin only)
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

    const response = await backendAdminFetch(`/campaigns/${campaignId}/updates`, getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET campaign updates error:", error);

    return NextResponse.json({ error: "Failed to fetch campaign updates" }, { status: 500 });
  }
}

// POST — Create a campaign update
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { campaignId, sortOrder, ...fields } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${campaignId}/updates`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST campaign update error:", error);

    return NextResponse.json({ error: "Failed to create campaign update" }, { status: 500 });
  }
}

// PUT — Update an existing campaign update
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, sortOrder, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Update ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/updates/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT campaign update error:", error);

    return NextResponse.json({ error: "Failed to update campaign update" }, { status: 500 });
  }
}

// DELETE — Delete a campaign update
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Update ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/updates/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE campaign update error:", error);

    return NextResponse.json({ error: "Failed to delete campaign update" }, { status: 500 });
  }
}
