import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — CVRequest is a brand-new backend model (Phase 8 migration).
// See app/admin/cv-building/page.tsx for the UI, which expects the same field
// shape as before (status: PENDING/IN_PROGRESS/COMPLETED/REJECTED, adminNotes).

// GET — admin only, all CV requests
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/cv-requests/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET cv-requests error:", error);

    return NextResponse.json({ error: "Failed to fetch CV requests" }, { status: 500 });
  }
}

// POST — Public (CV building request submission)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/cv-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST cv-request error:", error);

    return NextResponse.json({ error: "Failed to submit CV request" }, { status: 500 });
  }
}

// PUT — Admin only. Accepts {id, status?, adminNotes?} matching the existing
// admin page's call shape; forwards to the backend's two restricted sub-routes.
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ error: "CV request ID is required" }, { status: 400 });
    }

    const token = getAdminTokenFromRequest(req)!;
    let data: unknown = null;
    let status_: number = 200;

    if (status !== undefined) {
      const response = await backendAdminFetch(`/cv-requests/${id}/status`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      data = await response.json();
      status_ = response.status;

      if (!response.ok) {
        return NextResponse.json(data, { status: status_ });
      }
    }

    if (adminNotes !== undefined) {
      const response = await backendAdminFetch(`/cv-requests/${id}/notes`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes }),
      });

      data = await response.json();
      status_ = response.status;
    }

    return NextResponse.json(data, { status: status_ });
  } catch (error) {
    console.error("PUT cv-request error:", error);

    return NextResponse.json({ error: "Failed to update CV request" }, { status: 500 });
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
      return NextResponse.json({ error: "CV request ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/cv-requests/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE cv-request error:", error);

    return NextResponse.json({ error: "Failed to delete CV request" }, { status: 500 });
  }
}
