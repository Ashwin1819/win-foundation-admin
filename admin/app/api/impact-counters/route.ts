import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma ImpactCounter model has incompatible
// ids/fields (value/description here vs the backend's number/icon, no isActive on
// either side). See prisma/contract.prisma for the now-unused legacy model.
//
// Unlike Testimonials/FAQ/HeroSlides, the backend's ImpactCounter has no isActive
// field at all — the public GET returns everything, so there's no separate admin
// "/all" endpoint needed; this reuses the public GET directly (no auth needed).

// GET — public (no auth needed, see note above)
export async function GET() {
  try {
    const response = await backendGet("/impact-counters");
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET impact counters error:", error);

    return NextResponse.json({ error: "Failed to fetch impact counters" }, { status: 500 });
  }
}

// POST — Create a new impact counter
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { label, number, icon, order } = body;

    const response = await backendAdminFetch("/impact-counters", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, number, icon, order }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST impact counter error:", error);

    return NextResponse.json({ error: "Failed to create impact counter" }, { status: 500 });
  }
}

// PUT — Update an existing impact counter
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Impact counter ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/impact-counters/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT impact counter error:", error);

    return NextResponse.json({ error: "Failed to update impact counter" }, { status: 500 });
  }
}

// DELETE — Delete an impact counter
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Impact counter ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/impact-counters/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE impact counter error:", error);

    return NextResponse.json({ error: "Failed to delete impact counter" }, { status: 500 });
  }
}
