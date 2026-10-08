"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

type FieldType = "TEXT" | "EMAIL" | "PHONE" | "TEXTAREA" | "SELECT" | "NUMBER";
type FormType = "PARTNER" | "INTERNSHIP" | "CV_BUILDING";

type FormField = {
  id: number;
  formType: FormType;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  placeholder: string | null;
  required: boolean;
  options: string[] | null;
  order: number;
  isActive: boolean;
};

type FieldFormData = {
  formType: FormType;
  label: string;
  fieldKey: string;
  fieldType: FieldType;
  placeholder: string;
  required: boolean;
  optionsText: string; // newline-separated, only used for SELECT
  order: number;
  isActive: boolean;
};

const TABS: { value: FormType; label: string; hint: string }[] = [
  { value: "PARTNER", label: "Become a Partner", hint: "Fields shown on the /partner page." },
  { value: "INTERNSHIP", label: "Internship", hint: "Fields shown on the /internship page." },
  { value: "CV_BUILDING", label: "CV Building", hint: "Fields shown on the /cv-building page." },
];

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Short Text" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "TEXTAREA", label: "Long Text" },
  { value: "SELECT", label: "Dropdown" },
  { value: "NUMBER", label: "Number" },
];

function emptyForm(formType: FormType): FieldFormData {
  return {
    formType,
    label: "",
    fieldKey: "",
    fieldType: "TEXT",
    placeholder: "",
    required: false,
    optionsText: "",
    order: 0,
    isActive: true,
  };
}

function slugifyKey(label: string) {
  const words = label
    .trim()
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "";
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

export default function FormFieldsPage() {
  const [activeTab, setActiveTab] = useState<FormType>("PARTNER");
  const [fields, setFields] = useState<FormField[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [formData, setFormData] = useState<FieldFormData>(emptyForm("PARTNER"));
  const [keyTouched, setKeyTouched] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/form-fields", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch form fields");
      setFields(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch form fields:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFields();
  }, [fetchFields]);

  const tabFields = useMemo(
    () =>
      fields
        .filter((f) => f.formType === activeTab)
        .sort((a, b) => a.order - b.order),
    [fields, activeTab]
  );

  function openAddModal() {
    setEditingField(null);
    setFormData({ ...emptyForm(activeTab), order: tabFields.length + 1 });
    setKeyTouched(false);
    setShowModal(true);
  }

  function openEditModal(field: FormField) {
    setEditingField(field);
    setFormData({
      formType: field.formType,
      label: field.label,
      fieldKey: field.fieldKey,
      fieldType: field.fieldType,
      placeholder: field.placeholder || "",
      required: field.required,
      optionsText: (field.options || []).join("\n"),
      order: field.order,
      isActive: field.isActive,
    });
    setKeyTouched(true);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) return;
    setShowModal(false);
    setEditingField(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.label.trim() || !formData.fieldKey.trim()) {
      alert("Label and field key are required.");
      return;
    }

    try {
      setSaving(true);
      const method = editingField ? "PUT" : "POST";
      const body = {
        ...(editingField ? { id: editingField.id } : {}),
        formType: formData.formType,
        label: formData.label.trim(),
        fieldKey: formData.fieldKey.trim(),
        fieldType: formData.fieldType,
        placeholder: formData.placeholder.trim() || undefined,
        required: formData.required,
        options:
          formData.fieldType === "SELECT"
            ? formData.optionsText.split("\n").map((o) => o.trim()).filter(Boolean)
            : undefined,
        order: formData.order,
        isActive: formData.isActive,
      };

      const response = await fetch("/api/form-fields", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to save form field");
        return;
      }

      if (editingField) {
        setFields((current) => current.map((f) => (f.id === editingField.id ? data : f)));
      } else {
        setFields((current) => [...current, data]);
      }

      closeModal();
    } catch (error) {
      console.error("Save form field error:", error);
      alert("Failed to save form field.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteField(field: FormField) {
    const confirmed = window.confirm(`Delete the "${field.label}" field? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setDeletingId(field.id);
      const response = await fetch("/api/form-fields", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: field.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to delete form field");
        return;
      }

      setFields((current) => current.filter((f) => f.id !== field.id));
    } catch (error) {
      console.error("Delete form field error:", error);
      alert("Failed to delete form field.");
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(field: FormField) {
    try {
      const response = await fetch("/api/form-fields", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: field.id, isActive: !field.isActive }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data?.error || "Failed to update form field");
        return;
      }
      setFields((current) => current.map((f) => (f.id === field.id ? data : f)));
    } catch (error) {
      console.error("Toggle form field error:", error);
      alert("Failed to update form field.");
    }
  }

  const activeTabInfo = TABS.find((t) => t.value === activeTab)!;

  return (
    <main style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={titleStyle}>Form Builder</h1>
          <p style={subtitleStyle}>
            Add, edit, delete, and reorder the fields on the Partner, Internship, and CV Building
            forms — no code changes needed.
          </p>
        </div>
        <button type="button" onClick={openAddModal} style={addButtonStyle}>
          + Add Field
        </button>
      </div>

      <div style={tabBarStyle}>
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            style={{
              ...tabButtonStyle,
              ...(activeTab === tab.value ? activeTabButtonStyle : {}),
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <p style={tabHintStyle}>{activeTabInfo.hint}</p>

      <section style={cardStyle}>
        {loading ? (
          <div style={emptyStateStyle}>Loading fields...</div>
        ) : tabFields.length === 0 ? (
          <div style={emptyStateStyle}>
            <p>No fields yet for {activeTabInfo.label}.</p>
            <button type="button" onClick={openAddModal} style={addButtonStyle}>
              + Add Field
            </button>
          </div>
        ) : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Order</th>
                <th style={thStyle}>Label</th>
                <th style={thStyle}>Field Key</th>
                <th style={thStyle}>Type</th>
                <th style={thStyle}>Required</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tabFields.map((field) => (
                <tr key={field.id}>
                  <td style={tdStyle}>{field.order}</td>
                  <td style={tdStyle}>{field.label}</td>
                  <td style={{ ...tdStyle, color: "#667085", fontFamily: "monospace", fontSize: "12px" }}>
                    {field.fieldKey}
                  </td>
                  <td style={tdStyle}>{FIELD_TYPES.find((t) => t.value === field.fieldType)?.label}</td>
                  <td style={tdStyle}>{field.required ? "Yes" : "No"}</td>
                  <td style={tdStyle}>
                    <button
                      type="button"
                      onClick={() => void toggleActive(field)}
                      style={{
                        ...statusBadgeStyle,
                        ...(field.isActive ? activeStyle : inactiveStyle),
                      }}
                    >
                      {field.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td style={{ ...tdStyle, textAlign: "right" }}>
                    <div style={actionGroupStyle}>
                      <button type="button" onClick={() => openEditModal(field)} style={editButtonStyle}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteField(field)}
                        disabled={deletingId === field.id}
                        style={deleteButtonStyle}
                      >
                        {deletingId === field.id ? "..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showModal && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <h2 style={modalTitleStyle}>{editingField ? "Edit Field" : "New Field"}</h2>
              <button type="button" onClick={closeModal} style={closeButtonStyle}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={formBodyStyle}>
                <label style={labelStyle}>Label *</label>
                <input
                  value={formData.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setFormData((f) => ({
                      ...f,
                      label,
                      fieldKey: keyTouched ? f.fieldKey : slugifyKey(label),
                    }));
                  }}
                  placeholder="e.g. Preferred City"
                  style={inputStyle}
                  required
                />

                <label style={labelStyle}>Field Key *</label>
                <input
                  value={formData.fieldKey}
                  onChange={(e) => {
                    setKeyTouched(true);
                    setFormData((f) => ({ ...f, fieldKey: e.target.value }));
                  }}
                  placeholder="e.g. preferredCity"
                  style={{ ...inputStyle, fontFamily: "monospace" }}
                  required
                />
                <p style={helpTextStyle}>
                  Used internally to store the answer. Letters, numbers, underscores only — auto-filled from the label.
                </p>

                <label style={labelStyle}>Field Type</label>
                <select
                  value={formData.fieldType}
                  onChange={(e) => setFormData((f) => ({ ...f, fieldType: e.target.value as FieldType }))}
                  style={inputStyle}
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>

                {formData.fieldType === "SELECT" && (
                  <>
                    <label style={labelStyle}>Options (one per line)</label>
                    <textarea
                      value={formData.optionsText}
                      onChange={(e) => setFormData((f) => ({ ...f, optionsText: e.target.value }))}
                      rows={4}
                      placeholder={"Option A\nOption B\nOption C"}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </>
                )}

                <label style={labelStyle}>Placeholder</label>
                <input
                  value={formData.placeholder}
                  onChange={(e) => setFormData((f) => ({ ...f, placeholder: e.target.value }))}
                  placeholder="Shown inside the empty field"
                  style={inputStyle}
                />

                <label style={labelStyle}>Display Order</label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) => setFormData((f) => ({ ...f, order: Number(e.target.value) }))}
                  style={inputStyle}
                />

                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={formData.required}
                    onChange={(e) => setFormData((f) => ({ ...f, required: e.target.checked }))}
                  />
                  <span>Required field</span>
                </label>

                <label style={checkboxRowStyle}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Show this field on the public form</span>
                </label>
              </div>

              <div style={modalFooterStyle}>
                <button type="button" onClick={closeModal} disabled={saving} style={secondaryButtonStyle}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={primaryButtonStyle}>
                  {saving ? "Saving..." : editingField ? "Save Changes" : "Add Field"}
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
  marginBottom: "20px",
};

const titleStyle: CSSProperties = { margin: 0, fontSize: "26px", fontWeight: 700 };
const subtitleStyle: CSSProperties = { margin: "7px 0 0", color: "#667085", fontSize: "14px", maxWidth: "620px" };

const addButtonStyle: CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "10px 15px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const tabBarStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "6px",
  flexWrap: "wrap",
};

const tabButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "999px",
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeTabButtonStyle: CSSProperties = {
  border: "1px solid #101828",
  background: "#101828",
  color: "#ffffff",
};

const tabHintStyle: CSSProperties = {
  margin: "8px 0 20px",
  color: "#667085",
  fontSize: "13px",
};

const cardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  overflow: "hidden",
};

const emptyStateStyle: CSSProperties = {
  padding: "48px 20px",
  textAlign: "center",
  color: "#667085",
  fontSize: "14px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "14px",
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

const activeStyle: CSSProperties = { background: "#ecfdf3", color: "#027a48" };
const inactiveStyle: CSSProperties = { background: "#fef3f2", color: "#b42318" };

const actionGroupStyle: CSSProperties = { display: "flex", justifyContent: "flex-end", gap: "6px" };

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
  maxHeight: "90vh",
  overflowY: "auto",
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
  position: "sticky",
  top: 0,
  background: "#ffffff",
};

const modalTitleStyle: CSSProperties = { margin: 0, fontSize: "17px", fontWeight: 700 };

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

const formBodyStyle: CSSProperties = { padding: "20px 22px" };

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  marginTop: "16px",
  color: "#344054",
  fontSize: "12px",
  fontWeight: 600,
};

const helpTextStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: "11px",
  color: "#98a2b3",
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
  position: "sticky",
  bottom: 0,
  background: "#ffffff",
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
