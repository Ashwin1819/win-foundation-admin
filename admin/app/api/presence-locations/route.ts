import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's PresenceLocation model — the map pins / presence
// badges shown on the homepage's "Where We Make An Impact" section.

// GET — admin only, all locations
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/presence-locations/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET presence-locations error:", error);

    return NextResponse.json({ error: "Failed to fetch presence locations" }, { status: 500 });
  }
}

// POST — Create a new presence location
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/presence-locations", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST presence-location error:", error);

    return NextResponse.json({ error: "Failed to create presence location" }, { status: 500 });
  }
}

// PUT — Update an existing presence location
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Presence location ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/presence-locations/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT presence-location error:", error);

    return NextResponse.json({ error: "Failed to update presence location" }, { status: 500 });
  }
}

// DELETE — Delete a presence location
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Presence location ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/presence-locations/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE presence-location error:", error);

    return NextResponse.json({ error: "Failed to delete presence location" }, { status: 500 });
  }
}
