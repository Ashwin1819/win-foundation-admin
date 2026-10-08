import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

export const runtime = "nodejs";

// POST — Upload a photo to an initiative. Expects multipart/form-data with
// fields: file, initiativeId, caption?, order?
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const initiativeId = formData.get("initiativeId");

    if (!initiativeId) {
      return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
    }

    // The backend takes the initiative id in the URL path, not the form body.
    formData.delete("initiativeId");

    const response = await backendAdminFetch(`/initiatives/${initiativeId}/photos`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST initiative photo error:", error);

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

    const response = await backendAdminFetch(`/initiatives/photos/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE initiative photo error:", error);

    return NextResponse.json({ error: "Failed to delete photo" }, { status: 500 });
  }
}
