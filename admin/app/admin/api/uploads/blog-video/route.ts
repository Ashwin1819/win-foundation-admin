import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Video file is required" },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "video/mp4",
      "video/webm",
      "video/ogg",
      "video/quicktime",
      "video/x-m4v",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Invalid video format. Use MP4, WebM, OGG, M4V or MOV.",
        },
        { status: 400 }
      );
    }

    const maxSize = 100 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Video must be 100 MB or smaller." },
        { status: 400 }
      );
    }

    const extension =
      path.extname(file.name) ||
      (file.type === "video/mp4" ? ".mp4" : ".webm");

    const safeName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    const uploadDirectory = path.join(
      process.cwd(),
      "public",
      "uploads",
      "blog-videos"
    );

    await mkdir(uploadDirectory, { recursive: true });

    const filePath = path.join(
      uploadDirectory,
      safeName
    );

    const bytes = await file.arrayBuffer();

    await writeFile(
      filePath,
      Buffer.from(bytes)
    );

    const videoUrl =
      `/uploads/blog-videos/${safeName}`;

    return NextResponse.json({
      success: true,
      videoUrl,
    });
  } catch (error) {
    console.error("Blog video upload error:", error);

    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    );
  }
}