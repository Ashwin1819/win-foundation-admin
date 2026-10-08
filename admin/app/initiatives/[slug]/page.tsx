import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { backendGet } from "@/lib/backendApi";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

// Backend's Initiative shape (backend/prisma/schema.prisma): shortDesc/fullDesc
// instead of shortDescription/description, coverImage/featureImage instead of
// bannerImage, keyActivities/impactNumbers are already JSON arrays (not
// newline/comma strings), gallery comes from the `photos` relation instead of a
// flat galleryImages string, and `order` instead of `sortOrder`.
type BackendInitiative = {
  id: number;
  title: string;
  slug: string;
  shortDesc: string;
  fullDesc: string;
  coverImage: string;
  featureImage: string | null;
  keyActivities: string[];
  impactNumbers: string[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  photos: { id: number; url: string; order: number }[];
};

type Initiative = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  bannerImage: string | null;
  keyActivities: string[];
  impactNumbers: string[];
  galleryImages: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

async function getInitiative(
  slug: string
): Promise<Initiative | null> {
  const response = await backendGet(`/initiatives/${encodeURIComponent(slug)}`);

  if (!response.ok) {
    return null;
  }

  const initiative: BackendInitiative = await response.json();

  return {
    id: String(initiative.id),
    title: initiative.title,
    slug: initiative.slug,
    shortDescription: initiative.shortDesc,
    description: initiative.fullDesc,
    bannerImage: initiative.featureImage || initiative.coverImage || null,
    keyActivities: initiative.keyActivities,
    impactNumbers: initiative.impactNumbers,
    galleryImages: initiative.photos.map((photo) => photo.url),
    isActive: initiative.isActive,
    sortOrder: initiative.order,
    createdAt: initiative.createdAt,
    updatedAt: initiative.updatedAt,
  };
}

function escapeCssUrl(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const initiative =
    await getInitiative(slug);

  if (!initiative) {
    return {
      title: "Initiative | WIN Foundations",
    };
  }

  return {
    title: `${initiative.title} | WIN Foundations`,
    description:
      initiative.shortDescription,
  };
}

export default async function InitiativeDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const initiative =
    await getInitiative(slug);

  if (!initiative) {
    notFound();
  }

  const activities = initiative.keyActivities;

  const impactItems = initiative.impactNumbers;

  const galleryImages = initiative.galleryImages;

  return (
    <main style={pageStyle}>
      {/* HEADER */}

      <header style={headerStyle}>
        <div style={headerInnerStyle}>
          <Link
  href="/"
  style={logoLinkStyle}
>
            <div style={logoBoxStyle}>
              W
            </div>

            <div>
              <div
                style={logoTitleStyle}
              >
                WIN Foundations
              </div>

              <div
                style={logoSubtitleStyle}
              >
                Together We Can Make a Difference
              </div>
            </div>
          </Link>

          <nav style={navStyle}>
            <Link
              href="/"
              style={navLinkStyle}
            >
              Home
            </Link>

            <a
              href="/about"
              style={navLinkStyle}
            >
              About Us
            </a>

            <a
              href="/initiatives"
              style={{
                ...navLinkStyle,
                color: "#0f5c5e",
                fontWeight: 700,
              }}
            >
              Initiatives
            </a>

            <a
              href="/campaigns"
              style={navLinkStyle}
            >
              Campaigns
            </a>

            <a
              href="/updates"
              style={navLinkStyle}
            >
              Updates
            </a>

            <a
              href="/gallery"
              style={navLinkStyle}
            >
              Gallery
            </a>

            <a
              href="/contact"
              style={navLinkStyle}
            >
              Contact
            </a>

            <a
              href="/donate"
              style={donateButtonStyle}
            >
              Donate
            </a>
          </nav>
        </div>
      </header>

      {/* BREADCRUMB */}

      <section
        style={breadcrumbSectionStyle}
      >
        <div
          style={containerStyle}
        >
          <Link
            href="/"
            style={breadcrumbLinkStyle}
          >
            Home
          </Link>

          <span style={breadcrumbSeparatorStyle}>
            /
          </span>

          <a
            href="/initiatives"
            style={breadcrumbLinkStyle}
          >
            Initiatives
          </a>

          <span style={breadcrumbSeparatorStyle}>
            /
          </span>

          <span>
            {initiative.title}
          </span>
        </div>
      </section>

      {/* HERO */}

      <section
        style={heroSectionStyle}
      >
        <div
          style={{
            ...heroCardStyle,
            backgroundImage:
              initiative.bannerImage
                ? `linear-gradient(rgba(18,53,54,0.48), rgba(18,53,54,0.72)), url("${escapeCssUrl(
                    initiative.bannerImage
                  )}")`
                : "linear-gradient(135deg, #0f5c5e, #123536)",
          }}
        >
          <div
            style={heroContentStyle}
          >
            <div style={heroBadgeStyle}>
              OUR INITIATIVE
            </div>

            <h1 style={heroTitleStyle}>
              {initiative.title}
            </h1>

            <p style={heroDescriptionStyle}>
              {initiative.shortDescription}
            </p>
          </div>
        </div>
      </section>

      {/* CONTENT */}

      <section
        style={contentSectionStyle}
      >
        <div style={contentGridStyle}>
          {/* LEFT */}

          <div>
            <section style={contentCardStyle}>
              <div
                style={
                  sectionEyebrowStyle
                }
              >
                ABOUT THIS INITIATIVE
              </div>

              <h2 style={sectionHeadingStyle}>
                {initiative.title}
              </h2>

              <div
                style={bodyTextStyle}
              >
                {initiative.description}
              </div>
            </section>

            {/* KEY ACTIVITIES */}

            {activities.length > 0 && (
              <section
                style={{
                  ...contentCardStyle,
                  marginTop: "22px",
                }}
              >
                <div
                  style={
                    sectionEyebrowStyle
                  }
                >
                  WHAT WE DO
                </div>

                <h2
                  style={
                    sectionHeadingStyle
                  }
                >
                  Key Activities
                </h2>

                <div
                  style={activityListStyle}
                >
                  {activities.map(
                    (activity, index) => (
                      <div
                        key={`${activity}-${index}`}
                        style={activityItemStyle}
                      >
                        <div
                          style={
                            activityIconStyle
                          }
                        >
                          ✓
                        </div>

                        <div
                          style={
                            activityTextStyle
                          }
                        >
                          {activity}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* GALLERY */}

            {galleryImages.length > 0 && (
              <section
                style={{
                  ...contentCardStyle,
                  marginTop: "22px",
                }}
              >
                <div
                  style={
                    sectionEyebrowStyle
                  }
                >
                  IN ACTION
                </div>

                <h2
                  style={
                    sectionHeadingStyle
                  }
                >
                  Initiative Gallery
                </h2>

                <div
                  style={galleryGridStyle}
                >
                  {galleryImages.map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        style={{
                          ...galleryImageStyle,
                          backgroundImage: `url("${escapeCssUrl(
                            image
                          )}")`,
                        }}
                      />
                    )
                  )}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT */}

          <aside>
            {/* IMPACT */}

            {impactItems.length > 0 && (
              <section
                style={impactCardStyle}
              >
                <div
                  style={
                    impactEyebrowStyle
                  }
                >
                  OUR IMPACT
                </div>

                <h2
                  style={impactHeadingStyle}
                >
                  Making a Difference
                </h2>

                <div
                  style={impactListStyle}
                >
                  {impactItems.map(
                    (impact, index) => (
                      <div
                        key={`${impact}-${index}`}
                        style={impactItemStyle}
                      >
                        {impact}
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* SUPPORT */}

            <section
              style={{
                ...supportCardStyle,
                marginTop:
                  impactItems.length > 0
                    ? "18px"
                    : "0",
              }}
            >
              <div
                style={supportIconStyle}
              >
                ♥
              </div>

              <h2
                style={supportHeadingStyle}
              >
                Support This Initiative
              </h2>

              <p
                style={supportTextStyle}
              >
                Your support helps us
                continue this work and
                reach more communities.
              </p>

              <Link
                href="/donate"
                style={supportDonateStyle}
              >
                Donate Now
              </Link>

              <Link
                href="/volunteer"
                style={supportVolunteerStyle}
              >
                Become a Volunteer
              </Link>
            </section>
          </aside>
        </div>
      </section>

      {/* FOOTER */}

      <footer style={footerStyle}>
        <div
          style={footerInnerStyle}
        >
          <div>
            <div
              style={footerTitleStyle}
            >
              WIN Foundations
            </div>

            <div
              style={footerTextStyle}
            >
              Together We Can Make a Difference.
            </div>
          </div>

          <div
            style={footerLinksStyle}
          >
            <Link
              href="/"
              style={footerLinkStyle}
            >
              Home
            </Link>

            <Link
              href="/about"
              style={footerLinkStyle}
            >
              About
            </Link>

            <Link
              href="/initiatives"
              style={footerLinkStyle}
            >
              Initiatives
            </Link>

            <Link
              href="/contact"
              style={footerLinkStyle}
            >
              Contact
            </Link>
          </div>
        </div>

        <div
          style={copyrightStyle}
        >
          © {new Date().getFullYear()} WIN
          Foundation. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

/* =========================================
   PAGE
========================================= */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#fffdf8",
  color: "#1f2933",
  fontFamily:
    "Arial, Helvetica, sans-serif",
};

/* =========================================
   HEADER
========================================= */

const headerStyle: CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "#ffffff",
  borderBottom:
    "1px solid #e5e7eb",
};

const headerInnerStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "13px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "25px",
};

const logoLinkStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textDecoration: "none",
  color: "#123536",
};

const logoBoxStyle: CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "9px",
  background: "#0f5c5e",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  fontWeight: 800,
};

const logoTitleStyle: CSSProperties = {
  fontSize: "15px",
  fontWeight: 800,
};

const logoSubtitleStyle: CSSProperties = {
  marginTop: "2px",
  fontSize: "9px",
  color: "#6b7280",
};

const navStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "17px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const navLinkStyle: CSSProperties = {
  color: "#334155",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 600,
};

const donateButtonStyle: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "11px",
  fontWeight: 700,
  background: "#e6a23c",
  padding: "9px 15px",
  borderRadius: "6px",
};

/* =========================================
   BREADCRUMB
========================================= */

const breadcrumbSectionStyle: CSSProperties = {
  background: "#f1f6f3",
  borderBottom:
    "1px solid #e2ebe6",
};

const containerStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "13px 24px",
  fontSize: "11px",
  color: "#64748b",
};

const breadcrumbLinkStyle: CSSProperties = {
  color: "#0f5c5e",
  textDecoration: "none",
  fontWeight: 650,
};

const breadcrumbSeparatorStyle: CSSProperties = {
  margin: "0 8px",
  color: "#94a3b8",
};

/* =========================================
   HERO
========================================= */

const heroSectionStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "36px 24px 24px",
};

const heroCardStyle: CSSProperties = {
  minHeight: "390px",
  borderRadius: "17px",
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  alignItems: "flex-end",
  padding: "45px",
  boxSizing: "border-box",
};

const heroContentStyle: CSSProperties = {
  maxWidth: "780px",
  color: "#ffffff",
};

const heroBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "6px 10px",
  borderRadius: "20px",
  background:
    "rgba(255,255,255,0.14)",
  border:
    "1px solid rgba(255,255,255,0.25)",
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.8px",
  marginBottom: "12px",
};

const heroTitleStyle: CSSProperties = {
  margin: 0,
  fontSize:
    "clamp(30px, 5vw, 52px)",
  lineHeight: 1.08,
  fontWeight: 800,
};

const heroDescriptionStyle: CSSProperties = {
  margin: "14px 0 0",
  fontSize: "15px",
  lineHeight: 1.65,
  color:
    "rgba(255,255,255,0.92)",
};

/* =========================================
   CONTENT
========================================= */

const contentSectionStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "8px 24px 70px",
};

const contentGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) 290px",
  gap: "25px",
};

const contentCardStyle: CSSProperties = {
  background: "#ffffff",
  border:
    "1px solid #e5e7eb",
  borderRadius: "13px",
  padding: "27px",
};

const sectionEyebrowStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "1px",
  color: "#0f5c5e",
  marginBottom: "7px",
};

const sectionHeadingStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "25px",
  lineHeight: 1.2,
  color: "#123536",
};

const bodyTextStyle: CSSProperties = {
  fontSize: "13px",
  lineHeight: 1.85,
  color: "#4b5563",
  whiteSpace: "pre-line",
};

/* =========================================
   ACTIVITIES
========================================= */

const activityListStyle: CSSProperties = {
  display: "grid",
  gap: "0",
};

const activityItemStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "11px",
  padding: "12px 0",
  borderBottom:
    "1px solid #eef2f1",
};

const activityIconStyle: CSSProperties = {
  width: "25px",
  height: "25px",
  flexShrink: 0,
  borderRadius: "50%",
  background: "#e7f2f0",
  color: "#0f5c5e",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 800,
};

const activityTextStyle: CSSProperties = {
  fontSize: "12px",
  lineHeight: 1.7,
  color: "#475569",
  paddingTop: "2px",
};

/* =========================================
   GALLERY
========================================= */

const galleryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "11px",
};

const galleryImageStyle: CSSProperties = {
  height: "180px",
  borderRadius: "8px",
  backgroundColor: "#edf2ef",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

/* =========================================
   IMPACT
========================================= */

const impactCardStyle: CSSProperties = {
  background: "#123536",
  borderRadius: "13px",
  padding: "23px",
  color: "#ffffff",
};

const impactEyebrowStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 800,
  letterSpacing: "1px",
  color: "#e6a23c",
  marginBottom: "7px",
};

const impactHeadingStyle: CSSProperties = {
  margin: "0 0 16px",
  fontSize: "21px",
  lineHeight: 1.25,
};

const impactListStyle: CSSProperties = {
  display: "grid",
  gap: "9px",
};

const impactItemStyle: CSSProperties = {
  padding: "12px",
  borderRadius: "8px",
  background:
    "rgba(255,255,255,0.08)",
  border:
    "1px solid rgba(255,255,255,0.07)",
  fontSize: "13px",
  fontWeight: 700,
};

/* =========================================
   SUPPORT
========================================= */

const supportCardStyle: CSSProperties = {
  background: "#f1f6f3",
  border:
    "1px solid #dfeae4",
  borderRadius: "13px",
  padding: "23px",
};

const supportIconStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  borderRadius: "8px",
  background: "#e6a23c",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "15px",
  marginBottom: "12px",
};

const supportHeadingStyle: CSSProperties = {
  margin: 0,
  fontSize: "19px",
  color: "#123536",
};

const supportTextStyle: CSSProperties = {
  margin: "8px 0 16px",
  fontSize: "11px",
  lineHeight: 1.65,
  color: "#64748b",
};

const supportDonateStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  background: "#e6a23c",
  color: "#ffffff",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 800,
  marginBottom: "8px",
};

const supportVolunteerStyle: CSSProperties = {
  display: "block",
  textAlign: "center",
  background: "#0f5c5e",
  color: "#ffffff",
  textDecoration: "none",
  padding: "10px 12px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 800,
};

/* =========================================
   FOOTER
========================================= */

const footerStyle: CSSProperties = {
  background: "#123536",
  color: "#ffffff",
};

const footerInnerStyle: CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "28px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const footerTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 800,
};

const footerTextStyle: CSSProperties = {
  marginTop: "4px",
  fontSize: "10px",
  color:
    "rgba(255,255,255,0.68)",
};

const footerLinksStyle: CSSProperties = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
};

const footerLinkStyle: CSSProperties = {
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "10px",
};

const copyrightStyle: CSSProperties = {
  borderTop:
    "1px solid rgba(255,255,255,0.10)",
  textAlign: "center",
  padding: "12px 20px",
  color:
    "rgba(255,255,255,0.55)",
  fontSize: "9px",
};