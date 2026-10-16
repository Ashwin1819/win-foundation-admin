import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma CampLocation model has incompatible
// ids/fields and no real initiativeId relation. See prisma/contract.prisma for the
// now-unused legacy model.

// GET — Fetch camp locations (public on the backend, no auth needed)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const initiativeId = searchParams.get("initiativeId");
    const query = initiativeId ? `?initiativeId=${encodeURIComponent(initiativeId)}` : "";

    const response = await backendGet(`/camp-locations${query}`);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET camp locations error:", error);

    return NextResponse.json(
      { error: "Failed to fetch camp locations" },
      { status: 500 }
    );
  }
}

// POST — Create a new camp location
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const {
      initiativeId,
      name,
      address,
      city,
      state,
      latitude,
      longitude,
      campDate,
      description,
      order,
      isActive,
    } = body;

    const response = await backendAdminFetch("/camp-locations", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        initiativeId,
        name,
        address,
        city,
        state,
        latitude,
        longitude,
        campDate,
        description,
        order,
        isActive,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST camp location error:", error);

    return NextResponse.json(
      { error: "Failed to create camp location" },
      { status: 500 }
    );
  }
}

// PUT — Update an existing camp location
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Camp location ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/camp-locations/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT camp location error:", error);

    return NextResponse.json(
      { error: "Failed to update camp location" },
      { status: 500 }
    );
  }
}

// DELETE — Delete a camp location
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Camp location ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/camp-locations/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE camp location error:", error);

    return NextResponse.json(
      { error: "Failed to delete camp location" },
      { status: 500 }
    );
  }
}
