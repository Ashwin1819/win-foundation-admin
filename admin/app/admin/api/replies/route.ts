import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — Reply is a brand-new backend model (Phase 10 migration).
// app/admin/replies/page.tsx is untouched; it only ever calls GET and DELETE on
// this route, so PUT below exists for parity with the backend's status endpoint
// but nothing in the UI currently calls it.

// GET — admin only. Supports the page's ?sort=newest|oldest and ?search= params,
// filtered/sorted here since the backend's GET /all has neither.
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/replies/all", getAdminTokenFromRequest(req)!);

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    let replies = await response.json();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim().toLowerCase() || "";
    const sort = searchParams.get("sort") || "newest";

    if (search) {
      replies = replies.filter(
        (reply: { name: string; email: string; message: string }) =>
          reply.name.toLowerCase().includes(search) ||
          reply.email.toLowerCase().includes(search) ||
          reply.message.toLowerCase().includes(search)
      );
    }

    replies = [...replies].sort((a: { createdAt: string }, b: { createdAt: string }) =>
      sort === "oldest"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(replies);
  } catch (error) {
    console.error("GET replies error:", error);

    return NextResponse.json({ error: "Failed to fetch replies" }, { status: 500 });
  }
}

// POST — Public
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/replies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST reply error:", error);

    return NextResponse.json({ error: "Failed to create reply" }, { status: 500 });
  }
}

// PUT — admin only, status update
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/replies/${id}/status`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT reply error:", error);

    return NextResponse.json({ error: "Failed to update reply" }, { status: 500 });
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
      return NextResponse.json({ error: "Reply ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/replies/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE reply error:", error);

    return NextResponse.json({ error: "Failed to delete reply" }, { status: 500 });
  }
}
