import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Volunteer model has one incompatible
// field (`name` vs the backend's `fullName`); everything else already matched.
// Status workflow uses the same expanded ApplicationStatus enum as Partner/
// Internship applications. See prisma/contract.prisma for the now-unused legacy
// model.

// GET — admin only, all applications
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/volunteers", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET volunteer applications error:", error);

    return NextResponse.json({ error: "Failed to fetch volunteer applications" }, { status: 500 });
  }
}

// POST — Submit a volunteer application (public; kept for parity, though the
// real public frontend submits directly to the backend)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/volunteers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: body.name ?? body.fullName,
        email: body.email,
        phone: body.phone,
        city: body.city,
        age: body.age,
        occupation: body.occupation,
        skills: body.skills,
        areaOfInterest: body.areaOfInterest,
        availability: body.availability,
        message: body.message,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST volunteer application error:", error);

    return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
  }
}

// PUT — Update application status (admin UI only ever sends {id, status})
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Volunteer application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/volunteers/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT volunteer application error:", error);

    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }
}

// DELETE — Delete an application
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Volunteer application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/volunteers/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE volunteer application error:", error);

    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
