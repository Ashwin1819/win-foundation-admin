import jwt from "jsonwebtoken";

// Replaces the old Firebase-ID-token check. The admin panel no longer has its own
// identity provider — human login goes through the backend's existing AdminUser/JWT
// system (POST /api/auth/login), and the resulting token is stored here as an
// httpOnly cookie (see app/api/auth/login/route.ts) rather than a client-readable
// Firebase ID token. This file verifies that cookie locally using the same
// JWT_SECRET the backend signs with — the backend's own requireAdmin middleware
// remains the real authority for every write that reaches it.

export const ADMIN_COOKIE_NAME = "admin_token";

export interface AdminTokenPayload {
  id: number;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR";
}

export function getAdminTokenFromRequest(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE_NAME}=([^;]+)`)
  );

  return match ? decodeURIComponent(match[1]) : null;
}

export async function verifyAdmin(
  req: Request,
  requiredRole?: "SUPER_ADMIN" | "EDITOR"
): Promise<AdminTokenPayload | null> {
  const token = getAdminTokenFromRequest(req);
  if (!token) return null;

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET is not configured in the admin app");
    return null;
  }

  try {
    const payload = jwt.verify(token, secret) as AdminTokenPayload;

    if (requiredRole && payload.role !== requiredRole) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Admin token verification error:", error);
    return null;
  }
}
