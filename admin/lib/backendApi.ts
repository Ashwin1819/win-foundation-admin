// Server-to-server client for calling the real win-foundation backend (Express/Prisma)
// from this admin app's API routes. Used only by the Blog/CampLocation/Media proxy
// routes — every other admin resource keeps using lib/db.ts against its own database.

const BACKEND_API_URL = (process.env.BACKEND_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

/** Calls a public (unauthenticated) backend GET endpoint. */
export async function backendGet(path: string): Promise<Response> {
  return fetch(`${BACKEND_API_URL}${path}`, { cache: "no-store" });
}

/**
 * Calls an admin-only backend endpoint, authenticating as the signed-in admin.
 * `token` is the same JWT this app already verified via verifyAdmin() (lifted from
 * the httpOnly admin_token cookie) — since both apps now speak the backend's own
 * AdminUser/JWT format, forwarding it directly lets the backend's requireAdmin
 * middleware see the real admin identity, rather than a generic service credential.
 */
export async function backendAdminFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(`${BACKEND_API_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}
