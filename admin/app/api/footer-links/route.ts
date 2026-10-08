import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's FooterLink model — the Quick Links / Get Involved
// lists shown in the public site's footer.

// GET — admin only, all links
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/footer-links/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET footer-links error:", error);

    return NextResponse.json({ error: "Failed to fetch footer links" }, { status: 500 });
  }
}

// POST — Create a new footer link
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/footer-links", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST footer-link error:", error);

    return NextResponse.json({ error: "Failed to create footer link" }, { status: 500 });
  }
}

// PUT — Update an existing footer link
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Footer link ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/footer-links/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT footer-link error:", error);

    return NextResponse.json({ error: "Failed to update footer link" }, { status: 500 });
  }
}

// DELETE — Delete a footer link
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Footer link ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/footer-links/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE footer-link error:", error);

    return NextResponse.json({ error: "Failed to delete footer link" }, { status: 500 });
  }
}
