"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

type PageKey = "updates" | "blog" | "gallery" | "initiatives" | "contact";

const PAGES: { key: PageKey; label: string; path: string; hasEyebrow?: boolean }[] = [
  { key: "updates", label: "Updates & News", path: "/updates" },
  { key: "blog", label: "Blog", path: "/blog" },
  { key: "gallery", label: "Gallery", path: "/gallery" },
  { key: "initiatives", label: "Our Initiatives", path: "/initiatives" },
  { key: "contact", label: "Contact Us", path: "/contact", hasEyebrow: true },
];

type HeaderForm = { eyebrow: string; heading: string; subtext: string };

export default function PageHeadersAdmin() {
  const [forms, setForms] = useState<Record<PageKey, HeaderForm>>({
    updates: { eyebrow: "", heading: "", subtext: "" },
    blog: { eyebrow: "", heading: "", subtext: "" },
    gallery: { eyebrow: "", heading: "", subtext: "" },
    initiatives: { eyebrow: "", heading: "", subtext: "" },
    contact: { eyebrow: "", heading: "", subtext: "" },
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<PageKey | null>(null);

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch("/api/homepage-content", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setForms({
          updates: { eyebrow: "", heading: data.updatesHeroHeading || "", subtext: data.updatesHeroSubtext || "" },
          blog: { eyebrow: "", heading: data.blogHeroHeading || "", subtext: data.blogHeroSubtext || "" },
          gallery: { eyebrow: "", heading: data.galleryHeroHeading || "", subtext: data.galleryHeroSubtext || "" },
          initiatives: { eyebrow: "", heading: data.initiativesHeroHeading || "", subtext: data.initiativesHeroSubtext || "" },
          contact: { eyebrow: data.contactHeroEyebrow || "", heading: data.contactHeroHeading || "", subtext: data.contactHeroSubtext || "" },
        });
      }
    } catch (error) {
      console.error("Failed to fetch page headers:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void fetchContent();
  }, [fetchContent]);

  async function savePage(key: PageKey) {
    try {
      setSaving(key);
      const form = forms[key];
      const patch: Record<string, string> =
        key === "contact"
          ? { contactHeroEyebrow: form.eyebrow, contactHeroHeading: form.heading, contactHeroSubtext: form.subtext }
          : { [`${key}HeroHeading`]: form.heading, [`${key}HeroSubtext`]: form.subtext };

      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert(`${PAGES.find((p) => p.key === key)?.label} header saved.`);
    } catch (error) {
      console.error(`Save ${key} header error:`, error);
      alert(error instanceof Error ? error.message : "Failed to save.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Page Headers</h1>
          <p style={subtitleStyle}>
            Edit the heading/subtext banner shown at the top of Updates, Blog, Gallery, Initiatives,
            and Contact Us. The actual content on each page (posts, albums, submissions) is managed
            from its own section in the sidebar.
          </p>
        </div>
      </div>

      {PAGES.map((page) => (
        <div key={page.key} style={cardStyle}>
          <div style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>{page.label}</h2>
            <span style={pathBadgeStyle}>{page.path}</span>
          </div>

          {page.hasEyebrow && (
            <>
              <label style={labelStyle}>Eyebrow Label</label>
              <input
                value={forms[page.key].eyebrow}
                onChange={(e) =>
                  setForms((f) => ({ ...f, [page.key]: { ...f[page.key], eyebrow: e.target.value } }))
                }
                disabled={!loaded}
                style={inputStyle}
              />
            </>
          )}

          <label style={labelStyle}>Heading</label>
          <input
            value={forms[page.key].heading}
            onChange={(e) => setForms((f) => ({ ...f, [page.key]: { ...f[page.key], heading: e.target.value } }))}
            disabled={!loaded}
            style={inputStyle}
          />

          <label style={labelStyle}>Subtext</label>
          <textarea
            value={forms[page.key].subtext}
            onChange={(e) => setForms((f) => ({ ...f, [page.key]: { ...f[page.key], subtext: e.target.value } }))}
            disabled={!loaded}
            rows={2}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <div style={{ marginTop: "14px" }}>
            <button
              type="button"
              onClick={() => void savePage(page.key)}
              disabled={saving === page.key || !loaded}
              style={primaryButtonStyle}
            >
              {saving === page.key ? "Saving..." : `Save ${page.label}`}
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 30px 50px",
  background: "#f7f8fc",
  fontFamily: "Arial, Helvetica, sans-serif",
  color: "#101828",
};

const headerStyle: CSSProperties = { marginBottom: "22px" };
const titleStyle: CSSProperties = { margin: 0, fontSize: "26px", fontWeight: 700 };
const subtitleStyle: CSSProperties = { margin: "7px 0 0", color: "#667085", fontSize: "14px", maxWidth: "680px" };

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  padding: "18px 20px",
  marginBottom: "18px",
};

const cardHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "10px",
};

const cardTitleStyle: CSSProperties = { margin: 0, fontSize: "16px", fontWeight: 700 };

const pathBadgeStyle: CSSProperties = {
  fontSize: "11px",
  fontFamily: "monospace",
  color: "#667085",
  background: "#f2f4f7",
  padding: "3px 8px",
  borderRadius: "999px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  marginTop: "12px",
  color: "#344054",
  fontSize: "12px",
  fontWeight: 600,
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "7px",
  padding: "10px 11px",
  fontSize: "13px",
  color: "#344054",
  background: "#ffffff",
  outline: "none",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "9px 15px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
