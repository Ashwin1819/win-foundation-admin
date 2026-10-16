import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma PartnerApplication model has
// incompatible ids/fields (organizationName/contactPersonName/partnershipMessage
// here vs the backend's organization/contactName/message) and a different status
// workflow (the backend's ApplicationStatus enum was expanded in this phase to
// NEW/REVIEWING/CONTACTED/APPROVED/REJECTED/CLOSED to match this admin page's
// existing status buttons). See prisma/contract.prisma for the now-unused legacy
// model.
//
// Submission inboxes have no draft/hide concept, so there's no "/all" split here
// — the admin GET is simply admin-only.

// GET — admin only, all applications
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/partner-applications", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET partner applications error:", error);

    return NextResponse.json({ error: "Failed to fetch partner applications" }, { status: 500 });
  }
}

// POST — Submit a partner application (public; kept for parity with the
// backend's own public endpoint, though the real public frontend submits
// directly to the backend rather than through this admin app)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/partner-applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organization: body.organizationName ?? body.organization,
        contactName: body.contactPersonName ?? body.contactName,
        email: body.email,
        phone: body.phone,
        website: body.website,
        partnershipType: body.partnershipType,
        message: body.partnershipMessage ?? body.message,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST partner application error:", error);

    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

// PUT — Update application status (admin UI only ever sends {id, status})
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Partner application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/partner-applications/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT partner application error:", error);

    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

// DELETE — Delete an application
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Partner application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/partner-applications/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE partner application error:", error);

    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
