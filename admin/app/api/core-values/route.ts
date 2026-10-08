import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's CoreValue model — the "Our Core Values" tiles on the
// About Us page.

// GET — admin only, all values
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/core-values/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET core-values error:", error);

    return NextResponse.json({ error: "Failed to fetch core values" }, { status: 500 });
  }
}

// POST — Create a new core value
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/core-values", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST core-value error:", error);

    return NextResponse.json({ error: "Failed to create core value" }, { status: 500 });
  }
}

// PUT — Update an existing core value
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Core value ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/core-values/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT core-value error:", error);

    return NextResponse.json({ error: "Failed to update core value" }, { status: 500 });
  }
}

// DELETE — Delete a core value
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Core value ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/core-values/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE core-value error:", error);

    return NextResponse.json({ error: "Failed to delete core value" }, { status: 500 });
  }
}
