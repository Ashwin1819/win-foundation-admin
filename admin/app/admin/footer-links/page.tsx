"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

type FooterLink = {
  id: number;
  section: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
};

type FormDataType = {
  section: string;
  label: string;
  url: string;
  order: number;
  isActive: boolean;
};

const SECTIONS = [
  { value: "QUICK_LINKS", label: "Footer: Quick Links" },
  { value: "GET_INVOLVED", label: "Footer: Get Involved" },
  { value: "HEADER_CONNECT", label: "Header: \"Connect With Us\" Menu" },
];

const emptyForm: FormDataType = {
  section: "QUICK_LINKS",
  label: "",
  url: "",
  order: 0,
  isActive: true,
};

export default function FooterLinksPage() {
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [formData, setFormData] = useState<FormDataType>(emptyForm);

  const [logo, setLogo] = useState("");
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const [footerBgColor, setFooterBgColor] = useState("#14532d");
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceLoaded, setAppearanceLoaded] = useState(false);

  const [tagline, setTagline] = useState("");
  const [taglineSaving, setTaglineSaving] = useState(false);
  const [taglineLoaded, setTaglineLoaded] = useState(false);

  const [contact, setContact] = useState({ phone: "", email: "", address: "" });
  const [contactSaving, setContactSaving] = useState(false);
  const [contactLoaded, setContactLoaded] = useState(false);

  const [social, setSocial] = useState({ facebook: "", twitter: "", instagram: "", youtube: "", linkedin: "" });
  const [socialSaving, setSocialSaving] = useState(false);
  const [socialLoaded, setSocialLoaded] = useState(false);

  const [policies, setPolicies] = useState({ PRIVACY: "", TERMS: "" });
  const [policiesLoaded, setPoliciesLoaded] = useState(false);
  const [policySaving, setPolicySaving] = useState<"PRIVACY" | "TERMS" | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/footer-links", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch footer links");
      setLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch footer links:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSiteSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/site-settings", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setLogo(data?.logo || "");
        setTagline(data?.footerTagline || "");
        setContact({ phone: data?.phone || "", email: data?.email || "", address: data?.address || "" });
        setSocial({
          facebook: data?.facebook || "",
          twitter: data?.twitter || "",
          instagram: data?.instagram || "",
          youtube: data?.youtube || "",
          linkedin: data?.linkedin || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
    } finally {
      setLogoLoaded(true);
      setTaglineLoaded(true);
      setContactLoaded(true);
      setSocialLoaded(true);
    }
  }, []);

  const fetchAppearance = useCallback(async () => {
    try {
      const response = await fetch("/api/homepage-content", { cache: "no-store" });
      const data = await response.json();
      if (response.ok && data?.footerBgColor) {
        setFooterBgColor(data.footerBgColor);
      }
    } catch (error) {
      console.error("Failed to fetch footer appearance:", error);
    } finally {
      setAppearanceLoaded(true);
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const response = await fetch("/api/policies", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setPolicies({ PRIVACY: data?.PRIVACY || "", TERMS: data?.TERMS || "" });
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error);
    } finally {
      setPoliciesLoaded(true);
    }
  }, []);

  useEffect(() => {
    void fetchLinks();
    void fetchSiteSettings();
    void fetchAppearance();
    void fetchPolicies();
  }, [fetchLinks, fetchSiteSettings, fetchAppearance, fetchPolicies]);

  // Fetch current site-settings, apply a partial patch, and save — used by the
  // Tagline/Contact/Social cards so each can save independently without
  // clobbering the others or the fields the existing Site Settings page owns.
  async function patchSiteSettings(patch: Record<string, string>) {
    const current = await fetch("/api/site-settings", { cache: "no-store" }).then((r) => r.json());
    const response = await fetch("/api/site-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...current, ...patch }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Failed to save");
    return data;
  }

  async function uploadLogo(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Logo image must be smaller than 10MB.");
      return;
    }

    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/media", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to upload logo");

      const uploaded = Array.isArray(data) ? data[0] : null;
      if (!uploaded?.imageUrl) throw new Error("Upload did not return an image URL");

      setLogo(uploaded.imageUrl);
    } catch (error) {
      console.error("Upload logo error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload logo.");
    } finally {
      setLogoUploading(false);
    }
  }

  async function saveLogo() {
    try {
      setLogoSaving(true);
      await patchSiteSettings({ logo });
      alert("Logo saved. This logo is shared by the header and footer.");
    } catch (error) {
      console.error("Save logo error:", error);
      alert(error instanceof Error ? error.message : "Failed to save logo.");
    } finally {
      setLogoSaving(false);
    }
  }

  async function saveAppearance() {
    try {
      setAppearanceSaving(true);
      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ footerBgColor }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert("Footer background color saved.");
    } catch (error) {
      console.error("Save footer appearance error:", error);
      alert(error instanceof Error ? error.message : "Failed to save footer background color.");
    } finally {
      setAppearanceSaving(false);
    }
  }

  async function saveContact() {
    try {
      setContactSaving(true);
      await patchSiteSettings(contact);
      alert("Contact info saved.");
    } catch (error) {
      console.error("Save contact error:", error);
      alert(error instanceof Error ? error.message : "Failed to save contact info.");
    } finally {
      setContactSaving(false);
    }
  }

  async function saveSocial() {
    try {
      setSocialSaving(true);
      await patchSiteSettings(social);
      alert("Social media links saved.");
    } catch (error) {
      console.error("Save social error:", error);
      alert(error instanceof Error ? error.message : "Failed to save social links.");
    } finally {
      setSocialSaving(false);
    }
  }

  async function savePolicy(type: "PRIVACY" | "TERMS") {
    try {
      setPolicySaving(type);
      const response = await fetch("/api/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content: policies[type] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save policy");
      alert(`${type === "PRIVACY" ? "Privacy Policy" : "Terms & Conditions"} saved.`);
    } catch (error) {
      console.error("Save policy error:", error);
      alert(error instanceof Error ? error.message : "Failed to save policy.");
    } finally {
      setPolicySaving(null);
    }
  }

  const grouped = useMemo(() => {
    const bySection: Record<string, FooterLink[]> = {};
    for (const link of links) {
      (bySection[link.section] ||= []).push(link);
    }
    for (const key of Object.keys(bySection)) {
      bySection[key].sort((a, b) => a.order - b.order);
    }
    return bySection;
  }, [links]);

  function openAddModal(section?: string) {
    setEditingLink(null);
    setFormData({
      ...emptyForm,
      section: section || "QUICK_LINKS",
      order: (grouped[section || "QUICK_LINKS"]?.length || 0) + 1,
    });
    setShowModal(true);
  }

  function openEditModal(link: FooterLink) {
    setEditingLink(link);
    setFormData({
      section: link.section,
      label: link.label,
      url: link.url,
      order: link.order,
      isActive: link.isActive,
    });
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingLink(null);
    setFormData(emptyForm);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type } = event.target;
    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : name === "order"
            ? Number(value)
            : value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.label.trim() || !formData.url.trim()) {
      alert("Label and URL are required.");
      return;
    }

    try {
      setSaving(true);
      const method = editingLink ? "PUT" : "POST";
      const body = editingLink ? { id: editingLink.id, ...formData } : formData;

      const response = await fetch("/api/footer-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to save footer link");
        return;
      }

      if (editingLink) {
        setLinks((current) => current.map((l) => (l.id === editingLink.id ? data : l)));
      } else {
        setLinks((current) => [...current, data]);
      }

      closeModal();
    } catch (error) {
      console.error("Save footer link error:", error);
      alert("Failed to save footer link.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteLink(id: number) {
    const confirmed = window.confirm("Delete this footer link? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingId(id);
      const response = await fetch("/api/footer-links", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to delete footer link");
        return;
      }

      setLinks((current) => current.filter((l) => l.id !== id));
    } catch (error) {
      console.error("Delete footer link error:", error);
      alert("Failed to delete footer link.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(link: FooterLink) {
    try {
      const response = await fetch("/api/footer-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, isActive: !link.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Failed to update footer link");
        return;
      }
      setLinks((current) => current.map((l) => (l.id === link.id ? data : l)));
    } catch (error) {
      console.error("Toggle footer link error:", error);
      alert("Failed to update footer link.");
    }
  }

  async function saveTagline() {
    try {
      setTaglineSaving(true);
      const current = await fetch("/api/site-settings", { cache: "no-store" }).then((r) => r.json());
      const response = await fetch("/api/site-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, footerTagline: tagline }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Failed to save tagline");
        return;
      }
      alert("Footer tagline saved.");
    } catch (error) {
      console.error("Save tagline error:", error);
      alert("Failed to save tagline.");
    } finally {
      setTaglineSaving(false);
    }
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>Loading footer links...</div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Footer &amp; Menu Links</h1>
          <p style={subtitleStyle}>
            Manage the Quick Links and Get Involved lists shown in the website footer, plus extra
            items in the header&apos;s &quot;Connect With Us&quot; dropdown menu.
          </p>
        </div>
        <button type="button" onClick={() => openAddModal()} style={addButtonStyle}>
          + Add Link
        </button>
      </div>

      {/* Footer Logo & Background */}
      <div style={taglineCardStyle}>
        <label style={labelStyle}>Footer Logo</label>
        <p style={taglineHintStyle}>
          This logo is shared with the site header — changing it here updates both.
        </p>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          {logo && (
            <img
              src={logo}
              alt="Footer logo preview"
              style={{ width: "64px", height: "64px", objectFit: "contain", borderRadius: "8px", border: "1px solid #eaecf0", background: "#f9fafb", padding: "6px" }}
            />
          )}
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flex: 1, minWidth: "260px", flexWrap: "wrap" }}>
            <input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              disabled={!logoLoaded}
              placeholder="https://... or upload a file"
              style={{ ...inputStyle, flex: 1, minWidth: "200px" }}
            />
            <label
              style={{
                ...primaryButtonStyle,
                opacity: !logoLoaded || logoUploading ? 0.6 : 1,
                cursor: !logoLoaded || logoUploading ? "not-allowed" : "pointer",
              }}
            >
              {logoUploading ? "Uploading..." : "Upload"}
              <input
                type="file"
                accept="image/*"
                disabled={!logoLoaded || logoUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadLogo(file);
                  e.currentTarget.value = "";
                }}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void saveLogo()}
            disabled={logoSaving || !logoLoaded}
            style={primaryButtonStyle}
          >
            {logoSaving ? "Saving..." : "Save Logo"}
          </button>
        </div>

        <div style={{ borderTop: "1px solid #eaecf0", margin: "20px 0 16px" }} />

        <label style={labelStyle}>Footer Background Color</label>
        <p style={taglineHintStyle}>Changes only the footer section&apos;s background color.</p>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="color"
            value={footerBgColor}
            onChange={(e) => setFooterBgColor(e.target.value)}
            disabled={!appearanceLoaded}
            style={{ width: "48px", height: "40px", padding: "2px", border: "1px solid #d0d5dd", borderRadius: "7px", cursor: appearanceLoaded ? "pointer" : "not-allowed" }}
          />
          <input
            value={footerBgColor}
            onChange={(e) => setFooterBgColor(e.target.value)}
            disabled={!appearanceLoaded}
            placeholder="#14532d"
            style={{ ...inputStyle, flex: 1, maxWidth: "160px" }}
          />
        </div>
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void saveAppearance()}
            disabled={appearanceSaving || !appearanceLoaded}
            style={primaryButtonStyle}
          >
            {appearanceSaving ? "Saving..." : "Save Background Color"}
          </button>
        </div>
      </div>

      {/* Footer Tagline */}
      <div style={taglineCardStyle}>
        <label style={labelStyle}>Footer Tagline</label>
        <p style={taglineHintStyle}>The short blurb shown under the logo in the footer&apos;s About column.</p>
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <textarea
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            disabled={!taglineLoaded}
            rows={2}
            style={{ ...inputStyle, flex: 1, resize: "vertical" }}
          />
          <button
            type="button"
            onClick={() => void saveTagline()}
            disabled={taglineSaving || !taglineLoaded}
            style={primaryButtonStyle}
          >
            {taglineSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Contact Info */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Contact Info</h2>
        <p style={taglineHintStyle}>Shown in the footer&apos;s Contact column and used across the public site.</p>
        <label style={labelStyle}>Phone</label>
        <input
          value={contact.phone}
          onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
          disabled={!contactLoaded}
          placeholder="+91 ..."
          style={inputStyle}
        />
        <label style={labelStyle}>Email</label>
        <input
          value={contact.email}
          onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
          disabled={!contactLoaded}
          placeholder="info@..."
          style={inputStyle}
        />
        <label style={labelStyle}>Address</label>
        <textarea
          value={contact.address}
          onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))}
          disabled={!contactLoaded}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void saveContact()}
            disabled={contactSaving || !contactLoaded}
            style={primaryButtonStyle}
          >
            {contactSaving ? "Saving..." : "Save Contact Info"}
          </button>
        </div>
      </div>

      {/* Social Media Links */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Social Media Links</h2>
        <p style={taglineHintStyle}>Full URLs — leave blank to hide that icon in the footer.</p>
        {([
          ["facebook", "Facebook"],
          ["twitter", "X (Twitter)"],
          ["instagram", "Instagram"],
          ["youtube", "YouTube"],
          ["linkedin", "LinkedIn"],
        ] as const).map(([key, label]) => (
          <div key={key}>
            <label style={labelStyle}>{label}</label>
            <input
              value={social[key]}
              onChange={(e) => setSocial((s) => ({ ...s, [key]: e.target.value }))}
              disabled={!socialLoaded}
              placeholder={`https://...`}
              style={inputStyle}
            />
          </div>
        ))}
        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void saveSocial()}
            disabled={socialSaving || !socialLoaded}
            style={primaryButtonStyle}
          >
            {socialSaving ? "Saving..." : "Save Social Links"}
          </button>
        </div>
      </div>

      {/* Legal Pages */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Legal Pages</h2>
        <p style={taglineHintStyle}>
          Content for the Privacy Policy and Terms &amp; Conditions pages linked at the bottom of the footer. Supports Markdown.
        </p>

        <label style={labelStyle}>Privacy Policy</label>
        <textarea
          value={policies.PRIVACY}
          onChange={(e) => setPolicies((p) => ({ ...p, PRIVACY: e.target.value }))}
          disabled={!policiesLoaded}
          rows={8}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
        />
        <div style={{ marginTop: "10px", marginBottom: "20px" }}>
          <button
            type="button"
            onClick={() => void savePolicy("PRIVACY")}
            disabled={policySaving === "PRIVACY" || !policiesLoaded}
            style={primaryButtonStyle}
          >
            {policySaving === "PRIVACY" ? "Saving..." : "Save Privacy Policy"}
          </button>
        </div>

        <label style={labelStyle}>Terms &amp; Conditions</label>
        <textarea
          value={policies.TERMS}
          onChange={(e) => setPolicies((p) => ({ ...p, TERMS: e.target.value }))}
          disabled={!policiesLoaded}
          rows={8}
          style={{ ...inputStyle, resize: "vertical", fontFamily: "monospace", fontSize: "12px" }}
        />
        <div style={{ marginTop: "10px" }}>
          <button
            type="button"
            onClick={() => void savePolicy("TERMS")}
            disabled={policySaving === "TERMS" || !policiesLoaded}
            style={primaryButtonStyle}
          >
            {policySaving === "TERMS" ? "Saving..." : "Save Terms & Conditions"}
          </button>
        </div>
      </div>

      {SECTIONS.map(({ value, label }) => (
        <div key={value} style={sectionCardStyle}>
          <div style={sectionHeaderStyle}>
            <h2 style={sectionTitleStyle}>{label}</h2>
            <button type="button" onClick={() => openAddModal(value)} style={smallAddButtonStyle}>
              + Add
            </button>
          </div>

          {(grouped[value] || []).length === 0 ? (
            <p style={emptyTextStyle}>No links yet in this section.</p>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Order</th>
                  <th style={thStyle}>Label</th>
                  <th style={thStyle}>URL</th>
                  <th style={thStyle}>Status</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(grouped[value] || []).map((link) => (
                  <tr key={link.id}>
                    <td style={tdStyle}>{link.order}</td>
                    <td style={tdStyle}>{link.label}</td>
                    <td style={{ ...tdStyle, color: "#667085" }}>{link.url}</td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => void toggleActive(link)}
                        style={{
                          ...statusBadgeStyle,
                          ...(link.isActive ? activeStyle : inactiveStyle),
                        }}
                      >
                        {link.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, textAlign: "right" }}>
                      <div style={actionGroupStyle}>
                        <button type="button" onClick={() => openEditModal(link)} style={editButtonStyle}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteLink(link.id)}
                          disabled={deletingId === link.id}
                          style={deleteButtonStyle}
                        >
                          {deletingId === link.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {showModal && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>{editingLink ? "Edit Footer Link" : "New Footer Link"}</h2>
              <button type="button" onClick={closeModal} style={closeButtonStyle}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formBodyStyle}>
                <label style={labelStyle}>Section</label>
                <select name="section" value={formData.section} onChange={handleChange} style={inputStyle}>
                  {SECTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <label style={labelStyle}>Label *</label>
                <input
                  name="label"
                  value={formData.label}
                  onChange={handleChange}
                  placeholder="e.g. Volunteer"
                  style={inputStyle}
                  required
                />

                <label style={labelStyle}>URL *</label>
                <input
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="e.g. /volunteer"
                  style={inputStyle}
                  required
                />

                <label style={labelStyle}>Display Order</label>
                <input
                  name="order"
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={handleChange}
                  style={inputStyle}
                />

                <label style={checkboxRowStyle}>
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} />
                  <span>Show this link in the footer</span>
                </label>
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={closeModal} disabled={saving} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={primaryButtonStyle}>
                  {saving ? "Saving..." : editingLink ? "Save Changes" : "Add Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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

const loadingStyle: CSSProperties = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#667085",
  fontSize: "15px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "26px",
  fontWeight: 700,
};

const subtitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#667085",
  fontSize: "14px",
};

const addButtonStyle: CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "10px 15px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const smallAddButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "7px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const taglineCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  padding: "18px 20px",
  marginBottom: "20px",
};

const taglineHintStyle: CSSProperties = {
  margin: "0 0 10px",
  fontSize: "12px",
  color: "#667085",
};

const sectionCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  padding: "18px 20px",
  marginBottom: "20px",
};

const sectionHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: "14px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
};

const emptyTextStyle: CSSProperties = {
  color: "#667085",
  fontSize: "13px",
  margin: 0,
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle: CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  background: "#f9fafb",
  color: "#667085",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
};

const tdStyle: CSSProperties = {
  padding: "12px",
  borderTop: "1px solid #f2f4f7",
  verticalAlign: "middle",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
  border: "none",
};

const activeStyle: CSSProperties = {
  background: "#ecfdf3",
  color: "#027a48",
};

const inactiveStyle: CSSProperties = {
  background: "#fef3f2",
  color: "#b42318",
};

const actionGroupStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "6px",
};

const editButtonStyle: CSSProperties = {
  border: "1px solid #b2ddff",
  background: "#eff8ff",
  color: "#175cd3",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "11px",
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
  borderRadius: "6px",
  padding: "6px 10px",
  fontSize: "11px",
  cursor: "pointer",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(16, 24, 40, 0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 20px 50px rgba(16, 24, 40, 0.2)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "20px 22px",
  borderBottom: "1px solid #eaecf0",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 700,
};

const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "#f2f4f7",
  width: "30px",
  height: "30px",
  borderRadius: "7px",
  fontSize: "21px",
  color: "#667085",
  cursor: "pointer",
};

const formBodyStyle: CSSProperties = {
  padding: "20px 22px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  marginTop: "16px",
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

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  marginTop: "18px",
  color: "#344054",
  fontSize: "13px",
  cursor: "pointer",
};

const modalFooterStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "9px",
  padding: "14px 22px",
  borderTop: "1px solid #eaecf0",
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

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "7px",
  padding: "9px 15px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};
