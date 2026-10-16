import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend's SiteUpdate model instead of
// using lib/db.ts — the backend's own Update model (category/coverImage
// required, no shortDescription/featuredImage/sortOrder) is a different,
// unrelated resource and is not used here. app/admin/updates/page.tsx is
// untouched; the proxy returns the same shape it already expects.

// GET — admin only, all updates
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/site-updates/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET updates error:", error);

    return NextResponse.json({ error: "Failed to fetch updates" }, { status: 500 });
  }
}

// POST — Create a new update (admin only)
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, shortDescription, content, featuredImage, publishedAt, isActive, sortOrder } = body;

    if (!title || !slug || !shortDescription || !content) {
      return NextResponse.json(
        { error: "Title, slug, short description and content are required" },
        { status: 400 }
      );
    }

    const response = await backendAdminFetch("/site-updates", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, shortDescription, content, featuredImage, publishedAt, isActive, sortOrder }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST update error:", error);

    return NextResponse.json({ error: "Failed to create update" }, { status: 500 });
  }
}

// PUT — Update an existing update (admin only)
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, slug, shortDescription, content, featuredImage, publishedAt, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Update ID is required" }, { status: 400 });
    }

    if (!title || !slug || !shortDescription || !content) {
      return NextResponse.json(
        { error: "Title, slug, short description and content are required" },
        { status: 400 }
      );
    }

    const response = await backendAdminFetch(`/site-updates/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, shortDescription, content, featuredImage, publishedAt, isActive, sortOrder }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT update error:", error);

    return NextResponse.json({ error: "Failed to update update" }, { status: 500 });
  }
}

// DELETE — admin only
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Update ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/site-updates/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE update error:", error);

    return NextResponse.json({ error: "Failed to delete update" }, { status: 500 });
  }
}
