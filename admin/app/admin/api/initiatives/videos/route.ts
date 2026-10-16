import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's InitiativeVideo model — YouTube videos attached to an
// initiative's detail page.

// POST — Add a video to an initiative. Body: { initiativeId, title, youtubeUrl, order? }
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { initiativeId, ...fields } = body;

    if (!initiativeId) {
      return NextResponse.json({ error: "initiativeId is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/initiatives/${initiativeId}/videos`, getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST initiative video error:", error);

    return NextResponse.json({ error: "Failed to add video" }, { status: 500 });
  }
}

// PUT — Update a video. Body: { id, title?, youtubeUrl?, order? }
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/initiatives/videos/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT initiative video error:", error);

    return NextResponse.json({ error: "Failed to update video" }, { status: 500 });
  }
}

// DELETE — Remove a video by id
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/initiatives/videos/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE initiative video error:", error);

    return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
  }
}
