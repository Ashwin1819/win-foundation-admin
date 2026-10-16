import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma HeroSlide model has incompatible
// ids/fields (title/subtitle/buttonText/buttonLink here vs the backend's
// headline/subtext/ctaText/ctaLink). See prisma/contract.prisma for the now-unused
// legacy model.
//
// The backend's public GET only returns active slides — the admin list needs
// inactive ones too, so this calls the admin-only GET /api/hero-slides/all.

// GET — admin only
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await backendAdminFetch("/hero-slides/all", getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET hero slides error:", error);

    return NextResponse.json({ error: "Failed to fetch hero slides" }, { status: 500 });
  }
}

// POST — Create a new hero slide
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { image, headline, subtext, ctaText, ctaLink, order, isActive } = body;

    const response = await backendAdminFetch("/hero-slides", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image, headline, subtext, ctaText, ctaLink, order, isActive }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST hero slide error:", error);

    return NextResponse.json({ error: "Failed to create hero slide" }, { status: 500 });
  }
}

// PUT — Update an existing hero slide
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Hero slide ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/hero-slides/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT hero slide error:", error);

    return NextResponse.json({ error: "Failed to update hero slide" }, { status: 500 });
  }
}

// DELETE — Delete a hero slide
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Hero slide ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/hero-slides/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE hero slide error:", error);

    return NextResponse.json({ error: "Failed to delete hero slide" }, { status: 500 });
  }
}
