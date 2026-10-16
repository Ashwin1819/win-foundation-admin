import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma InternshipApplication model has
// incompatible ids/fields: admin's `college`/`course` have no backend equivalent
// (kept in the UI, not sent here), the backend's `city`/`availability` have no
// admin UI (shown read-only in the detail view), and `preferredArea` renames to
// the backend's `areaOfInterest`. Status workflow uses the same expanded
// ApplicationStatus enum as Partner/Volunteer applications. See
// prisma/contract.prisma for the now-unused legacy model.

// GET — admin only, all applications
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/internships", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET internship applications error:", error);

    return NextResponse.json({ error: "Failed to fetch internship applications" }, { status: 500 });
  }
}

// POST — Submit an internship application (public; kept for parity, though the
// real public frontend submits directly to the backend)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${(process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "")}/internships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: body.fullName,
        email: body.email,
        phone: body.phone,
        city: body.city,
        education: body.education,
        areaOfInterest: body.preferredArea ?? body.areaOfInterest,
        availability: body.availability,
        message: body.message,
      }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST internship application error:", error);

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
      return NextResponse.json({ error: "Internship application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/internships/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT internship application error:", error);

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
      return NextResponse.json({ error: "Internship application ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/internships/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE internship application error:", error);

    return NextResponse.json({ error: "Failed to delete application" }, { status: 500 });
  }
}
