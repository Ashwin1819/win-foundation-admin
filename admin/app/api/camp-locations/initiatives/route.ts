import { NextResponse } from "next/server";
import { backendGet } from "@/lib/backendApi";

// Backs the "Initiative" dropdown on the Camp Location form. CampLocation.initiativeId
// is a foreign key into the real backend's Initiative table (numeric ids) — NOT this
// admin app's own local Initiative model (a separate, unrelated resource with its own
// ids/DB). Public endpoint on the backend, no auth needed.
export async function GET() {
  try {
    const response = await backendGet("/initiatives");
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET backend initiatives error:", error);

    return NextResponse.json(
      { error: "Failed to fetch initiatives" },
      { status: 500 }
    );
  }
}
