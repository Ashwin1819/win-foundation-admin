import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma CampaignProduct model has incompatible
// ids/fields, notably `requiredQuantity` where the backend's real field is
// `availableQty` (same underlying concept, renamed — see Phase 5 report for the
// flagged question of whether it should actually decrement on funding, which it
// currently doesn't anywhere in the backend). See prisma/contract.prisma for the
// now-unused legacy model.
//
// Calling convention kept identical to the previous lib/db.ts version: GET takes
// ?campaignId=, POST takes campaignId in the body, PUT/DELETE take id.

// GET — products for a campaign (admin only, includes inactive)
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

    const response = await backendAdminFetch(`/campaigns/${campaignId}/products`, getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET campaign products error:", error);

    return NextResponse.json({ error: "Failed to fetch campaign products" }, { status: 500 });
  }
}

// POST — Add a product to a campaign
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { campaignId, name, availableQty, pricePerUnit, image, order, isActive } = body;

    if (!campaignId) {
      return NextResponse.json({ error: "Campaign ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/${campaignId}/products`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, availableQty, pricePerUnit, image, order, isActive }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST campaign product error:", error);

    return NextResponse.json({ error: "Failed to create campaign product" }, { status: 500 });
  }
}

// PUT — Update an existing product
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/products/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT campaign product error:", error);

    return NextResponse.json({ error: "Failed to update campaign product" }, { status: 500 });
  }
}

// DELETE — Delete a product
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaigns/products/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE campaign product error:", error);

    return NextResponse.json({ error: "Failed to delete campaign product" }, { status: 500 });
  }
}
