import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

export const runtime = "nodejs";

// Previously wrote the file to this admin app's own public/uploads directory
// (a separate Next.js process from the backend) and returned a root-relative
// "/uploads/campaign-products/..." URL — but nginx routes every /uploads/*
// request on the public domain to the backend, not this app, so the file was
// never actually reachable. Forwards to the backend's centralized media
// upload endpoint instead, same as every other upload in the app.
export async function POST(req: Request) {
  try {
    const admin = await verifyAdmin(req);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const incomingFormData = await req.formData();
    const file = incomingFormData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Only JPG, PNG, WEBP and GIF images are allowed",
        },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Image must be smaller than 10MB",
        },
        { status: 400 }
      );
    }

    const token = getAdminTokenFromRequest(req)!;
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

    return NextResponse.json({
      success: true,
      imageUrl: data.url,
    });
  } catch (error) {
    console.error(
      "Campaign product upload error:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to upload image",
      },
      { status: 500 }
    );
  }
}