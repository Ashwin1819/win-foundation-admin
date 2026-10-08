import { NextResponse } from "next/server";
import { backendGet, backendAdminFetch } from "@/lib/backendApi";
import { verifyAdmin, getAdminTokenFromRequest } from "@/lib/verifyAdmin";

// This page's 12 flat fields are split across two different backend stores:
//
// - logo/email/phone/address/facebook/instagram/youtube/linkedin live on the
//   REAL SiteSettings model — the one the live frontend's Footer/Contact pages
//   actually read (GET/PUT /api/settings).
// - foundationName/footerText/seoTitle/seoDescription have no home on
//   SiteSettings, so they stay in the generic SiteConfig key/value store
//   (GET/PUT /api/site-config) as before.
//
// Previously this route only touched site-config, so saving the form here never
// reached the live site's logo/contact/social links at all — this GET/POST
// merges and splits across both so the existing page keeps working unchanged
// while actually updating what the public site displays.

type BackendSiteSettings = {
  logo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  socialLinks: Record<string, string> | null;
  footerTagline: string | null;
};

// GET — public
export async function GET() {
  try {
    const [configRes, settingsRes] = await Promise.all([
      backendGet("/site-config"),
      backendGet("/settings"),
    ]);

    const config = configRes.ok ? await configRes.json() : {};
    const settings: Partial<BackendSiteSettings> = settingsRes.ok ? await settingsRes.json() : {};
    const socialLinks = settings.socialLinks || {};

    return NextResponse.json({
      foundationName: config.foundationName ?? "",
      logo: settings.logo ?? "",
      email: settings.email ?? "",
      phone: settings.phone ?? "",
      address: settings.address ?? "",
      facebook: socialLinks.facebook ?? "",
      twitter: socialLinks.twitter ?? "",
      instagram: socialLinks.instagram ?? "",
      youtube: socialLinks.youtube ?? "",
      linkedin: socialLinks.linkedin ?? "",
      footerText: config.footerText ?? "",
      seoTitle: config.seoTitle ?? "",
      seoDescription: config.seoDescription ?? "",
      footerTagline: settings.footerTagline ?? "",
    });
  } catch (error) {
    console.error("GET site settings error:", error);

    return NextResponse.json({ error: "Failed to fetch site settings" }, { status: 500 });
  }
}

// POST — admin only. Splits the flat body across SiteConfig and the real
// SiteSettings model.
export async function POST(req: Request) {
  const admin = await verifyAdmin(req);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const token = getAdminTokenFromRequest(req)!;

    const {
      foundationName,
      logo,
      email,
      phone,
      address,
      facebook,
      twitter,
      instagram,
      youtube,
      linkedin,
      footerText,
      seoTitle,
      seoDescription,
      footerTagline,
    } = body;

    const [configResponse, settingsResponse] = await Promise.all([
      backendAdminFetch("/site-config", token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          foundationName: foundationName ?? "",
          footerText: footerText ?? "",
          seoTitle: seoTitle ?? "",
          seoDescription: seoDescription ?? "",
        }),
      }),
      backendAdminFetch("/settings", token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logo: logo ?? "",
          email: email ?? "",
          phone: phone ?? "",
          address: address ?? "",
          socialLinks: {
            facebook: facebook ?? "",
            ...(twitter !== undefined ? { twitter } : {}),
            instagram: instagram ?? "",
            youtube: youtube ?? "",
            linkedin: linkedin ?? "",
          },
          ...(footerTagline !== undefined ? { footerTagline } : {}),
        }),
      }),
    ]);

    if (!configResponse.ok) {
      const data = await configResponse.json();
      return NextResponse.json(data, { status: configResponse.status });
    }
    if (!settingsResponse.ok) {
      const data = await settingsResponse.json();
      return NextResponse.json(data, { status: settingsResponse.status });
    }

    return NextResponse.json(body);
  } catch (error) {
    console.error("SAVE site settings error:", error);

    return NextResponse.json({ error: "Failed to save site settings" }, { status: 500 });
  }
}
