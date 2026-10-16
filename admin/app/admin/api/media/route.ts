import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// The backend serves uploaded files from its own origin (e.g. localhost:3000),
// not this admin app's — Media.url comes back as a backend-relative path
// ("/uploads/media-xxx.jpg"), so it needs the backend's origin prefixed before
// the browser can load it.
const BACKEND_ORIGIN = (process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/api\/?$/, "");

type BackendMedia = {
  id: number;
  url: string | null;
  title: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
};

function toMediaItem(item: BackendMedia) {
  return {
    id: String(item.id),
    imageUrl: item.url ? `${BACKEND_ORIGIN}${item.url}` : "",
    title: item.title,
    caption: item.caption,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// This resource is proxied to the real backend (Express/Prisma) over HTTP instead
// of using lib/db.ts — the contract.prisma Media model has incompatible ids/fields
// and no real blogId/campLocationId relations. See prisma/contract.prisma for the
// now-unused legacy model.
//
// The backend's Media normally attaches to exactly one of a Blog or a
// CampLocation. To back this page's standalone gallery, the backend's POST
// /media/upload now also accepts neither (a fully standalone row), and
// GET /media/all / PUT /media/:id were added for listing and title/caption edits.

export const runtime = "nodejs";

// GET — admin only, all media (standalone and attached)
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "newest";

    const response = await backendAdminFetch(`/media/all?sort=${sort}`, getAdminTokenFromRequest(req)!);

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const data: BackendMedia[] = await response.json();

    return NextResponse.json(data.map(toMediaItem));
  } catch (error) {
    console.error("GET media error:", error);

    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}

// POST — Upload one or more images/videos (field name "files"), standalone
// (no blogId/campLocationId) — uploaded one at a time to the backend's
// single-file endpoint.
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const incomingFormData = await req.formData();
    const files = incomingFormData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ error: "At least one file is required" }, { status: 400 });
    }

    const token = getAdminTokenFromRequest(req)!;
    const uploaded: unknown[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await backendAdminFetch("/media/upload", token, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(data, { status: response.status });
      }

      uploaded.push(toMediaItem(data as BackendMedia));
    }

    return NextResponse.json(uploaded, { status: 201 });
  } catch (error) {
    console.error("POST media error:", error);

    return NextResponse.json({ error: "Failed to upload media" }, { status: 500 });
  }
}

// PUT — Update title/caption only
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, caption } = body;

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/media/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, caption }),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT media error:", error);

    return NextResponse.json({ error: "Failed to update media" }, { status: 500 });
  }
}

// DELETE — Remove a media item by id
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/media/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE media error:", error);

    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
