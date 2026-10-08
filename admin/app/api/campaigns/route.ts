import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Campaign model has incompatible
// ids/fields (shortDescription/description/bannerImage/sortOrder here vs the
// backend's summary/story/coverImage/order, no category/status/costBreakdown/
// presetAmounts/videoUrl fields at all). See prisma/contract.prisma for the
// now-unused legacy model.
//
// raisedAmount is intentionally never accepted here — it's a stored aggregate the
// backend maintains from real Donation records (see markDonationSuccessful in the
// backend's routes/donations.ts), not something this proxy lets admins overwrite.
//
// The backend's public GET only returns active campaigns — the admin list needs
// inactive ones too, so this calls the admin-only GET /api/campaigns/all.

// GET — admin only
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/campaigns/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET campaigns error:", error);

    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST — Create a new campaign
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { raisedAmount, ...fields } = body;
    void raisedAmount; // never admin-settable, see note above

    const response = await backendAdminFetch("/campaigns", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST campaign error:", error);

    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}

// PUT — Update an existing campaign
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, raisedAmount, ...fields } = body;
    void raisedAmount;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT campaign error:", error);

    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE — Delete a campaign
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE campaign error:", error);

    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
