import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Donation model has incompatible
// ids/fields (donorEmail/donorPhone/flat campaign string here vs the backend's
// email/phone/campaign relation). See prisma/contract.prisma for the now-unused
// legacy model.
//
// paymentStatus is deliberately restricted on PUT — see
// backend/src/types/validation.ts's updateDonationStatusSchema. SUCCESS only ever
// happens through the real payment flow (receipt generation, Campaign.raisedAmount
// increment, donor email), never a raw admin edit.

// GET — admin only, all donations
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/donations/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET donations error:", error);

    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}

// POST — Public (kept for parity; no admin page actually calls this — donations
// are created through the backend's real payment/checkout flow, not this route)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/donations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donorName: body.donorName,
        email: body.donorEmail ?? body.email,
        phone: body.donorPhone ?? body.phone,
        address: body.address,
        amount: body.amount !== undefined ? Number(body.amount) : undefined,
        donationType: body.donationType,
        campaignId: body.campaignId || undefined,
        paymentMethod: body.paymentMethod || "manual",
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST donation error:", error);

    return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
  }
}

// PUT — Update payment status only (admin only). Accepts {id, paymentStatus}
// matching the existing admin page's call shape; forwards only paymentStatus to
// the backend's restricted PUT /:id/status.
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, paymentStatus } = body;

    if (!id) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/donations/${id}/status`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT donation error:", error);

    return NextResponse.json({ error: "Failed to update donation" }, { status: 500 });
  }
}

// DELETE — Delete a donation
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Donation ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/donations/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE donation error:", error);

    return NextResponse.json({ error: "Failed to delete donation" }, { status: 500 });
  }
}
