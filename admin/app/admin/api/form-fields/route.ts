import { NextResponse } from "next/server";
import { backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// Proxies the backend's FormField model — the admin-managed field definitions
// for the Partner, Internship, and CV Building public forms.

// GET — admin only, all fields (optionally filtered by ?formType=)
export async function GET(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const formType = searchParams.get("formType");
    const path = formType ? `/form-fields/all?formType=${encodeURIComponent(formType)}` : "/form-fields/all";

    const response = await backendAdminFetch(path, getAdminTokenFromRequest(req)!);
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("GET form-fields error:", error);

    return NextResponse.json({ error: "Failed to fetch form fields" }, { status: 500 });
  }
}

// POST — Create a new form field
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const response = await backendAdminFetch("/form-fields", getAdminTokenFromRequest(req)!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("POST form-field error:", error);

    return NextResponse.json({ error: "Failed to create form field" }, { status: 500 });
  }
}

// PUT — Update an existing form field
export async function PUT(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id) {
      return NextResponse.json({ error: "Form field ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/form-fields/${id}`, getAdminTokenFromRequest(req)!, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("PUT form-field error:", error);

    return NextResponse.json({ error: "Failed to update form field" }, { status: 500 });
  }
}

// DELETE — Delete a form field
export async function DELETE(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Form field ID is required" }, { status: 400 });
    }

    const response = await backendAdminFetch(`/form-fields/${id}`, getAdminTokenFromRequest(req)!, { method: "DELETE" });
    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("DELETE form-field error:", error);

    return NextResponse.json({ error: "Failed to delete form field" }, { status: 500 });
  }
}
