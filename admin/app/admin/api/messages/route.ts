import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma ContactMessage model has an
// incompatible status enum (NEW/READ/REPLIED here vs the backend's
// NEW/CONTACTED/CLOSED). See app/admin/messages/page.tsx for the UI.

// GET — admin only, all contact messages
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/contact/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET messages error:", error);

    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

// POST — Public (contact form submission)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST message error:", error);

    return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
  }
}

// PUT — Update message status only (admin only). Accepts {id, status}.
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/contact/${id}/status`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT message error:", error);

    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

// DELETE — admin only. Accepts ?id= query string, matching the existing admin page.
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/contact/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE message error:", error);

    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
