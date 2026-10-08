import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

export const runtime = "nodejs";

// POST — Upload a photo to an album. Expects multipart/form-data with
// fields: file, albumId, caption?, order?
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const albumId = formData.get("albumId");

    if (!albumId) {
      return NextResponse.json({ error: "albumId is required" }, { status: 400 });
    }

    // The backend takes the album id in the URL path, not the form body.
    formData.delete("albumId");

    const response = await backendAdminFetch(`/gallery/albums/${albumId}/photos`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST gallery photo error:", error);

    return NextResponse.json({ error: "Failed to upload photo" }, { status: 500 });
  }
}

// DELETE — Remove a photo by id
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Photo ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/gallery/photos/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE gallery photo error:", error);

    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
