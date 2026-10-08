"use client";

import { useCallback, useEffect, useState, type CSSProperties } from "react";

type CoreValue = {
  id: number;
  title: string;
  description: string;
  order: number;
  isActive: boolean;
};

type CoreValueForm = {
  title: string;
  description: string;
  order: number;
  isActive: boolean;
};

const emptyValueForm: CoreValueForm = {
  title: "",
  description: "",
  order: 0,
  isActive: true,
};

export default function AboutPageAdmin() {
  const [hero, setHero] = useState({ aboutHeroEyebrow: "", aboutHeroHeading: "", aboutHeroSubtext: "" });
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [heroSaving, setHeroSaving] = useState(false);

  const [mission, setMission] = useState({ missionHeading: "", missionText: "" });
  const [missionLoaded, setMissionLoaded] = useState(false);
  const [missionSaving, setMissionSaving] = useState(false);

  const [vision, setVision] = useState({ visionHeading: "", visionText: "" });
  const [visionLoaded, setVisionLoaded] = useState(false);
  const [visionSaving, setVisionSaving] = useState(false);

  const [story, setStory] = useState({ storyEyebrow: "", storyHeading: "", storyText1: "", storyText2: "" });
  const [storyLoaded, setStoryLoaded] = useState(false);
  const [storySaving, setStorySaving] = useState(false);

  const [cta, setCta] = useState({
    ctaHeading: "",
    ctaText: "",
    ctaPrimaryText: "",
    ctaPrimaryLink: "",
    ctaSecondaryText: "",
    ctaSecondaryLink: "",
  });
  const [ctaLoaded, setCtaLoaded] = useState(false);
  const [ctaSaving, setCtaSaving] = useState(false);

  const [values, setValues] = useState<CoreValue[]>([]);
  const [valuesLoading, setValuesLoading] = useState(true);
  const [valueSaving, setValueSaving] = useState(false);
  const [deletingValueId, setDeletingValueId] = useState<number | null>(null);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingValue, setEditingValue] = useState<CoreValue | null>(null);
  const [valueForm, setValueForm] = useState<CoreValueForm>(emptyValueForm);

  const fetchContent = useCallback(async () => {
    try {
      const response = await fetch("/api/homepage-content", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) {
        setHero({
          aboutHeroEyebrow: data.aboutHeroEyebrow || "",
          aboutHeroHeading: data.aboutHeroHeading || "",
          aboutHeroSubtext: data.aboutHeroSubtext || "",
        });
        setMission({ missionHeading: data.missionHeading || "", missionText: data.missionText || "" });
        setVision({ visionHeading: data.visionHeading || "", visionText: data.visionText || "" });
        setStory({
          storyEyebrow: data.storyEyebrow || "",
          storyHeading: data.storyHeading || "",
          storyText1: data.storyText1 || "",
          storyText2: data.storyText2 || "",
        });
        setCta({
          ctaHeading: data.ctaHeading || "",
          ctaText: data.ctaText || "",
          ctaPrimaryText: data.ctaPrimaryText || "",
          ctaPrimaryLink: data.ctaPrimaryLink || "",
          ctaSecondaryText: data.ctaSecondaryText || "",
          ctaSecondaryLink: data.ctaSecondaryLink || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch About page content:", error);
    } finally {
      setHeroLoaded(true);
      setMissionLoaded(true);
      setVisionLoaded(true);
      setStoryLoaded(true);
      setCtaLoaded(true);
    }
  }, []);

  const fetchValues = useCallback(async () => {
    try {
      setValuesLoading(true);
      const response = await fetch("/api/core-values", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch core values");
      setValues(Array.isArray(data) ? [...data].sort((a, b) => a.order - b.order) : []);
    } catch (error) {
      console.error("Failed to fetch core values:", error);
    } finally {
      setValuesLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchContent();
    void fetchValues();
  }, [fetchContent, fetchValues]);

  async function savePatch(patch: Record<string, string>, label: string, setSaving: (v: boolean) => void) {
    try {
      setSaving(true);
      const response = await fetch("/api/homepage-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save");
      alert(`${label} saved.`);
    } catch (error) {
      console.error(`Save ${label} error:`, error);
      alert(error instanceof Error ? error.message : `Failed to save ${label}.`);
    } finally {
      setSaving(false);
    }
  }

  function openAddValue() {
    setEditingValue(null);
    setValueForm({ ...emptyValueForm, order: values.length + 1 });
    setShowValueModal(true);
  }

  function openEditValue(value: CoreValue) {
    setEditingValue(value);
    setValueForm({
      title: value.title,
      description: value.description,
      order: value.order,
      isActive: value.isActive,
    });
    setShowValueModal(true);
  }

  function closeValueModal() {
    if (valueSaving) return;
    setShowValueModal(false);
    setEditingValue(null);
    setValueForm(emptyValueForm);
  }

  function handleValueChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = event.target;
    setValueForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : name === "order"
            ? Number(value)
            : value,
    }));
  }

  async function handleValueSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!valueForm.title.trim() || !valueForm.description.trim()) {
      alert("Title and description are required.");
      return;
    }

    try {
      setValueSaving(true);
      const method = editingValue ? "PUT" : "POST";
      const body = editingValue ? { id: editingValue.id, ...valueForm } : valueForm;

      const response = await fetch("/api/core-values", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to save core value");
        return;
      }

      if (editingValue) {
        setValues((current) => current.map((v) => (v.id === editingValue.id ? data : v)).sort((a, b) => a.order - b.order));
      } else {
        setValues((current) => [...current, data].sort((a, b) => a.order - b.order));
      }

      closeValueModal();
    } catch (error) {
      console.error("Save core value error:", error);
      alert("Failed to save core value.");
    } finally {
      setValueSaving(false);
    }
  }

  async function deleteValue(id: number) {
    const confirmed = window.confirm("Delete this core value? This action cannot be undone.");
    if (!confirmed) return;

    try {
      setDeletingValueId(id);
      const response = await fetch("/api/core-values", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to delete core value");
        return;
      }

      setValues((current) => current.filter((v) => v.id !== id));
    } catch (error) {
      console.error("Delete core value error:", error);
      alert("Failed to delete core value.");
    } finally {
      setDeletingValueId(null);
    }
  }

  async function toggleValueActive(value: CoreValue) {
    try {
      const response = await fetch("/api/core-values", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: value.id, isActive: !value.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Failed to update core value");
        return;
      }
      setValues((current) => current.map((v) => (v.id === value.id ? data : v)));
    } catch (error) {
      console.error("Toggle core value error:", error);
      alert("Failed to update core value.");
    }
  }

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>About Us Page</h1>
          <p style={subtitleStyle}>
            Edit everything shown on the public About Us page — hero text, mission &amp; vision, our story, core values, and the call-to-action.
          </p>
        </div>
      </div>

      {/* Hero */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Page Hero</h2>
        <p style={hintStyle}>The banner at the top of the About Us page.</p>

        <label style={labelStyle}>Eyebrow Label</label>
        <input
          value={hero.aboutHeroEyebrow}
          onChange={(e) => setHero((f) => ({ ...f, aboutHeroEyebrow: e.target.value }))}
          disabled={!heroLoaded}
          placeholder="About Us"
          style={inputStyle}
        />

        <label style={labelStyle}>Heading</label>
        <input
          value={hero.aboutHeroHeading}
          onChange={(e) => setHero((f) => ({ ...f, aboutHeroHeading: e.target.value }))}
          disabled={!heroLoaded}
          placeholder="About Win Foundations"
          style={inputStyle}
        />

        <label style={labelStyle}>Subtext</label>
        <textarea
          value={hero.aboutHeroSubtext}
          onChange={(e) => setHero((f) => ({ ...f, aboutHeroSubtext: e.target.value }))}
          disabled={!heroLoaded}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void savePatch(hero, "Page Hero", setHeroSaving)}
            disabled={heroSaving || !heroLoaded}
            style={primaryButtonStyle}
          >
            {heroSaving ? "Saving..." : "Save Hero"}
          </button>
        </div>
      </div>

      {/* Mission & Vision */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Mission &amp; Vision</h2>

        <label style={labelStyle}>Mission Heading</label>
        <input
          value={mission.missionHeading}
          onChange={(e) => setMission((f) => ({ ...f, missionHeading: e.target.value }))}
          disabled={!missionLoaded}
          style={inputStyle}
        />
        <label style={labelStyle}>Mission Text</label>
        <textarea
          value={mission.missionText}
          onChange={(e) => setMission((f) => ({ ...f, missionText: e.target.value }))}
          disabled={!missionLoaded}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ marginTop: "12px", marginBottom: "6px" }}>
          <button
            type="button"
            onClick={() => void savePatch(mission, "Mission", setMissionSaving)}
            disabled={missionSaving || !missionLoaded}
            style={primaryButtonStyle}
          >
            {missionSaving ? "Saving..." : "Save Mission"}
          </button>
        </div>

        <div style={dividerStyle} />

        <label style={labelStyle}>Vision Heading</label>
        <input
          value={vision.visionHeading}
          onChange={(e) => setVision((f) => ({ ...f, visionHeading: e.target.value }))}
          disabled={!visionLoaded}
          style={inputStyle}
        />
        <label style={labelStyle}>Vision Text</label>
        <textarea
          value={vision.visionText}
          onChange={(e) => setVision((f) => ({ ...f, visionText: e.target.value }))}
          disabled={!visionLoaded}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <div style={{ marginTop: "12px" }}>
          <button
            type="button"
            onClick={() => void savePatch(vision, "Vision", setVisionSaving)}
            disabled={visionSaving || !visionLoaded}
            style={primaryButtonStyle}
          >
            {visionSaving ? "Saving..." : "Save Vision"}
          </button>
        </div>
      </div>

      {/* Our Story */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Our Story</h2>
        <p style={hintStyle}>The founder message / founding story block.</p>

        <label style={labelStyle}>Eyebrow Label</label>
        <input
          value={story.storyEyebrow}
          onChange={(e) => setStory((f) => ({ ...f, storyEyebrow: e.target.value }))}
          disabled={!storyLoaded}
          placeholder="Since Day One"
          style={inputStyle}
        />

        <label style={labelStyle}>Heading</label>
        <input
          value={story.storyHeading}
          onChange={(e) => setStory((f) => ({ ...f, storyHeading: e.target.value }))}
          disabled={!storyLoaded}
          placeholder="Our Story"
          style={inputStyle}
        />

        <label style={labelStyle}>Paragraph 1</label>
        <textarea
          value={story.storyText1}
          onChange={(e) => setStory((f) => ({ ...f, storyText1: e.target.value }))}
          disabled={!storyLoaded}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <label style={labelStyle}>Paragraph 2</label>
        <textarea
          value={story.storyText2}
          onChange={(e) => setStory((f) => ({ ...f, storyText2: e.target.value }))}
          disabled={!storyLoaded}
          rows={3}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void savePatch(story, "Our Story", setStorySaving)}
            disabled={storySaving || !storyLoaded}
            style={primaryButtonStyle}
          >
            {storySaving ? "Saving..." : "Save Our Story"}
          </button>
        </div>
      </div>

      {/* Core Values */}
      <div style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <div>
            <h2 style={sectionTitleStyle}>Our Core Values</h2>
            <p style={hintStyle}>The value tiles shown near the bottom of the page.</p>
          </div>
          <button type="button" onClick={openAddValue} style={smallAddButtonStyle}>
            + Add Value
          </button>
        </div>

        {valuesLoading ? (
          <p style={emptyTextStyle}>Loading core values...</p>
        ) : values.length === 0 ? (
          <p style={emptyTextStyle}>No core values yet.</p>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Title</th>
                <th style={thStyle}>Description</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {values.map((value) => (
                <tr key={value.id}>
                  <td style={tdStyle}>{value.order}</td>
                  <td style={tdStyle}>{value.title}</td>
                  <td style={{ ...tdStyle, color: "#667085" }}>{value.description}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => void toggleValueActive(value)}
                      style={{
                        ...statusBadgeStyle,
                        ...(value.isActive ? activeStyle : inactiveStyle),
                      }}
                    >
                      {value.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={actionGroupStyle}>
                      <button type="button" onClick={() => openEditValue(value)} style={editButtonStyle}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteValue(value.id)}
                        disabled={deletingValueId === value.id}
                        style={deleteButtonStyle}
                      >
                        {deletingValueId === value.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Call to Action */}
      <div style={sectionCardStyle}>
        <h2 style={sectionTitleStyle}>Bottom Call-to-Action</h2>

        <label style={labelStyle}>Heading</label>
        <input
          value={cta.ctaHeading}
          onChange={(e) => setCta((f) => ({ ...f, ctaHeading: e.target.value }))}
          disabled={!ctaLoaded}
          style={inputStyle}
        />
        <label style={labelStyle}>Text</label>
        <textarea
          value={cta.ctaText}
          onChange={(e) => setCta((f) => ({ ...f, ctaText: e.target.value }))}
          disabled={!ctaLoaded}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />

        <div style={twoColStyle}>
          <div>
            <label style={labelStyle}>Primary Button Text</label>
            <input
              value={cta.ctaPrimaryText}
              onChange={(e) => setCta((f) => ({ ...f, ctaPrimaryText: e.target.value }))}
              disabled={!ctaLoaded}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Primary Button Link</label>
            <input
              value={cta.ctaPrimaryLink}
              onChange={(e) => setCta((f) => ({ ...f, ctaPrimaryLink: e.target.value }))}
              disabled={!ctaLoaded}
              placeholder="/donate"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Secondary Button Text</label>
            <input
              value={cta.ctaSecondaryText}
              onChange={(e) => setCta((f) => ({ ...f, ctaSecondaryText: e.target.value }))}
              disabled={!ctaLoaded}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Secondary Button Link</label>
            <input
              value={cta.ctaSecondaryLink}
              onChange={(e) => setCta((f) => ({ ...f, ctaSecondaryLink: e.target.value }))}
              disabled={!ctaLoaded}
              placeholder="/volunteer"
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => void savePatch(cta, "Call-to-Action", setCtaSaving)}
            disabled={ctaSaving || !ctaLoaded}
            style={primaryButtonStyle}
          >
            {ctaSaving ? "Saving..." : "Save Call-to-Action"}
          </button>
        </div>
      </div>

      {showValueModal && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeValueModal();
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>{editingValue ? "Edit Core Value" : "New Core Value"}</h2>
              <button type="button" onClick={closeValueModal} style={closeButtonStyle}>
                ×
              </button>
            </div>

            <form onSubmit={handleValueSubmit}>
              <div style={formBodyStyle}>
                <label style={labelStyle}>Title *</label>
                <input
                  name="title"
                  value={valueForm.title}
                  onChange={handleValueChange}
                  placeholder="e.g. Integrity"
                  style={inputStyle}
                  required
                />

                <label style={labelStyle}>Description *</label>
                <textarea
                  name="description"
                  value={valueForm.description}
                  onChange={handleValueChange}
                  placeholder="e.g. Transparent and ethical in all our actions"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                  required
                />

                <label style={labelStyle}>Display Order</label>
                <input
                  name="order"
                  type="number"
                  min="0"
                  value={valueForm.order}
                  onChange={handleValueChange}
                  style={inputStyle}
                />

                <label style={checkboxRowStyle}>
                  <input type="checkbox" name="isActive" checked={valueForm.isActive} onChange={handleValueChange} />
                  <span>Show this value on the About Us page</span>
                </label>
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={closeValueModal} disabled={valueSaving} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button type="submit" disabled={valueSaving} style={primaryButtonStyle}>
                  {valueSaving ? "Saving..." : editingValue ? "Save Changes" : "Add Value"}
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
  maxWidth: "640px",
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
  alignItems: "flex-start",
  justifyContent: "space-between",
  marginBottom: "14px",
  gap: "12px",
};

const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
};

const hintStyle: CSSProperties = {
  margin: "4px 0 14px",
  fontSize: "12px",
  color: "#667085",
};

const dividerStyle: CSSProperties = {
  borderTop: "1px solid #eaecf0",
  margin: "20px 0 16px",
};

const twoColStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0 16px",
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

const smallAddButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "7px",
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
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
