import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Testimonial model has incompatible
// ids/fields. See prisma/contract.prisma for the now-unused legacy model.
//
// The backend's public GET only returns active testimonials — the admin list
// needs inactive ones too, so this calls the admin-only GET /api/testimonials/all,
// same as Team Members.

// GET — admin only
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/testimonials/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET testimonials error:", error);

    return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 });
  }
}

// POST — Create a new testimonial
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, designation, photo, quote, order, isActive } = body;

    const response = await backendAdminFetch("/testimonials", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, designation, photo, quote, order, isActive }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST testimonial error:", error);

    return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 });
  }
}

// PUT — Update an existing testimonial
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/testimonials/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT testimonial error:", error);

    return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 });
  }
}

// DELETE — Delete a testimonial
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Testimonial ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/testimonials/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE testimonial error:", error);

    return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 });
  }
}
