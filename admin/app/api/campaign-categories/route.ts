import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// New resource (Phase 5, decision 7) — proxied straight to the backend's
// CampaignCategory model. No isActive field on this model, so the public GET
// already returns everything; the admin list reuses it directly.

// GET — public (no auth needed)
export async function GET() {
  try {
    const response = await backendGet("/campaign-categories");
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET campaign categories error:", error);

    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

// POST — Create a new category
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/campaign-categories", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST campaign category error:", error);

    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

// PUT — Update an existing category
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaign-categories/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT campaign category error:", error);

    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE — Delete a category
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/campaign-categories/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE campaign category error:", error);

    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
