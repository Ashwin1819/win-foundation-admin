import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Initiative model has incompatible
// ids/fields (flattened keyActivities/impactNumbers/galleryImages strings here vs
// the backend's real structured JSON fields + InitiativePhoto relation). See
// prisma/contract.prisma for the now-unused legacy model.
//
// The backend's public GET only returns active initiatives — the admin list needs
// inactive ones too, so this calls the admin-only GET /api/initiatives/all.

// GET — admin only
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/initiatives/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET initiatives error:", error);

    return NextResponse.json({ error: "Failed to fetch initiatives" }, { status: 500 });
  }
}

// POST — Create a new initiative
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/initiatives", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST initiative error:", error);

    return NextResponse.json({ error: "Failed to create initiative" }, { status: 500 });
  }
}

// PUT — Update an existing initiative
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Initiative ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/initiatives/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT initiative error:", error);

    return NextResponse.json({ error: "Failed to update initiative" }, { status: 500 });
  }
}

// DELETE — Delete an initiative
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Initiative ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/initiatives/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE initiative error:", error);

    return NextResponse.json({ error: "Failed to delete initiative" }, { status: 500 });
  }
}
