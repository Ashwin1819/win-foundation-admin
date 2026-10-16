import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma GalleryAlbum/GalleryItem models have
// incompatible ids/fields, and conflate photos and videos into one "GalleryItem"
// list; the backend splits these into GalleryAlbum (+ nested GalleryPhoto) and a
// separate standalone GalleryVideo. See app/api/gallery/videos/route.ts for videos,
// and prisma/contract.prisma for the now-unused legacy models.
//
// The backend's public GET only returns active albums — the admin list needs
// inactive ones too, so this calls the admin-only GET /api/gallery/albums/all.

// GET — admin only
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/gallery/albums/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET gallery albums error:", error);

    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}

// POST — Create a new album
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/gallery/albums", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST gallery album error:", error);

    return NextResponse.json({ error: "Failed to create album" }, { status: 500 });
  }
}

// PUT — Update an existing album
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/gallery/albums/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT gallery album error:", error);

    return NextResponse.json({ error: "Failed to update album" }, { status: 500 });
  }
}

// DELETE — Delete an album
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/gallery/albums/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE gallery album error:", error);

    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 });
  }
}
