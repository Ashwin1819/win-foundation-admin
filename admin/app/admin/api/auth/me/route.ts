import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/verifyAdmin";

// Lets client components check "am I logged in" without ever reading the httpOnly
// cookie themselves — used by AdminLayout and page-level auth gates.
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ admin });
}
