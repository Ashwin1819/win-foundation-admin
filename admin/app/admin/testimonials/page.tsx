/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";

type Testimonial = {
  id: number;
  name: string;
  designation: string | null;
  quote: string;
  photo: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string | null;
};

type FormState = {
  name: string;
  designation: string;
  quote: string;
  photo: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  designation: "",
  quote: "",
  photo: "",
  order: 0,
  isActive: true,
};

export default function TestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortDirection, setSortDirection] =
    useState<"newest" | "oldest">("newest");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    void fetchTestimonials();
  }, []);

  async function getToken() {
    return "cookie-auth";
  }

  async function fetchTestimonials() {
    try {
      setLoading(true);

      const response = await fetch("/api/testimonials", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch testimonials");
      }

      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch testimonials error:", error);
      alert("Failed to load testimonials.");
    } finally {
      setLoading(false);
    }
  }

  const filteredTestimonials = useMemo(() => {
    const term = search.trim().toLowerCase();

    const rows = testimonials.filter((item) => {
      const matchesSearch =
        !term ||
        item.name.toLowerCase().includes(term) ||
        (item.designation || "").toLowerCase().includes(term) ||
        item.quote.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (!selectedDate) return true;

      if (!item.createdAt) return false;

      const created = new Date(String(item.createdAt));

      if (Number.isNaN(created.getTime())) return false;

      const createdDate = [
        created.getFullYear(),
        String(created.getMonth() + 1).padStart(2, "0"),
        String(created.getDate()).padStart(2, "0"),
      ].join("-");

      return createdDate === selectedDate;
    });

    return [...rows].sort((a, b) => {
      const aTime = a.createdAt
        ? new Date(String(a.createdAt)).getTime()
        : 0;
      const bTime = b.createdAt
        ? new Date(String(b.createdAt)).getTime()
        : 0;

      if (aTime && bTime) {
        return sortDirection === "newest"
          ? bTime - aTime
          : aTime - bTime;
      }

      return sortDirection === "newest"
        ? testimonials.indexOf(b) - testimonials.indexOf(a)
        : testimonials.indexOf(a) - testimonials.indexOf(b);
    });
  }, [testimonials, search, selectedDate, sortDirection]);

  function formatCreatedAt(value?: string | null) {
    if (!value) return "—";

    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEditForm(item: Testimonial) {
    setEditingId(item.id);

    setForm({
      name: item.name,
      designation: item.designation || "",
      quote: item.quote,
      photo: item.photo || "",
      order: item.order ?? 0,
      isActive: item.isActive ?? true,
    });

    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value, type } = e.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
            ? Number(value)
            : value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter the testimonial name.");
      return;
    }

    if (!form.quote.trim()) {
      alert("Please enter the testimonial quote.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const response = await fetch("/api/testimonials", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          id: editingId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to save testimonial.");
        return;
      }

      alert(
        editingId
          ? "Testimonial updated successfully."
          : "Testimonial added successfully."
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchTestimonials();
    } catch (error) {
      console.error("Save testimonial error:", error);
      alert("Failed to save testimonial.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTestimonial(id: number) {
    if (!window.confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      setDeletingId(id);

      const token = await getToken();

      const response = await fetch("/api/testimonials", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to delete testimonial.");
        return;
      }

      await fetchTestimonials();
    } catch (error) {
      console.error("Delete testimonial error:", error);
      alert("Failed to delete testimonial.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.breadcrumb}>Dashboard / Testimonial</div>

      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>Testimonials</h1>
          <p style={styles.pageSubtitle}>
            Manage testimonials displayed on the WIN Foundations website.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddForm}
          style={styles.addButton}
        >
          + Add Testimonial
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <SummaryCard
          label="Total Testimonials"
          value={testimonials.length}
          icon="💬"
        />

        <SummaryCard
          label="Active"
          value={testimonials.filter((item) => item.isActive).length}
          icon="✓"
          valueStyle={styles.greenValue}
        />

        <SummaryCard
          label="Inactive"
          value={testimonials.filter((item) => !item.isActive).length}
          icon="○"
          valueStyle={styles.redValue}
        />
      </div>

      <div style={styles.toolbar}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, designation, quote..."
          style={styles.searchInput}
        />

        <div style={styles.toolbarRight}>
          <div style={styles.dateFilterGroup}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={styles.dateInput}
              aria-label="Filter testimonials by date"
            />

            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate("")}
                style={styles.clearDateButton}
              >
                Clear
              </button>
            )}
          </div>

          <select
            value={sortDirection}
            onChange={(e) =>
              setSortDirection(
                e.target.value as "newest" | "oldest"
              )
            }
            style={styles.select}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <div style={styles.tableCard}>
        <div style={styles.tableScroll}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thName}>Name</th>
                <th style={styles.thQuote}>Quote</th>
                <th style={styles.th}>Image Alt</th>
                <th style={styles.th}>Background</th>
                <th style={styles.th}>Image</th>
                <th style={styles.thDate}>Date</th>
                <th style={styles.thActions}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    Loading testimonials...
                  </td>
                </tr>
              ) : filteredTestimonials.length === 0 ? (
                <tr>
                  <td colSpan={7} style={styles.emptyCell}>
                    {selectedDate
                      ? "No testimonials found for the selected date."
                      : "No testimonials found."}
                  </td>
                </tr>
              ) : (
                filteredTestimonials.map((item) => (
                  <tr key={item.id}>
                    <td style={styles.tdName}>
                      <div style={styles.nameCell}>
                        <strong>{item.name}</strong>
                        {item.designation && (
                          <span style={styles.designation}>
                            {item.designation}
                          </span>
                        )}
                      </div>
                    </td>

                    <td style={styles.tdQuote}>
                      <span style={styles.quoteText}>
                        {item.quote}
                      </span>
                    </td>

                    <td style={styles.td}>—</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.colorBadge,
                          background: item.isActive
                            ? "#3399cc"
                            : "#d1d5db",
                        }}
                      >
                        {item.isActive ? "#3399cc" : "#d1d5db"}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.name}
                          style={styles.tableImage}
                        />
                      ) : (
                        <div style={styles.noImage}>—</div>
                      )}
                    </td>

                    <td style={styles.tdDate}>
                      {formatCreatedAt(item.createdAt)}
                    </td>

                    <td style={styles.tdActions}>
                      <button
                        type="button"
                        title="Edit"
                        onClick={() => openEditForm(item)}
                        style={styles.iconButton}
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        disabled={deletingId === item.id}
                        onClick={() => deleteTestimonial(item.id)}
                        style={{
                          ...styles.iconButton,
                          opacity:
                            deletingId === item.id ? 0.5 : 1,
                        }}
                      >
                        {deletingId === item.id ? "..." : "🗑"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!loading && (
        <div style={styles.tableFooter}>
          Showing {filteredTestimonials.length} of {testimonials.length}{" "}
          testimonials
          {selectedDate ? ` for ${selectedDate}` : ""}
        </div>
      )}

      {showForm && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingId ? "Edit Testimonial" : "Add Testimonial"}
                </h2>
                <p style={styles.modalSubtitle}>
                  Manage testimonial information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                style={styles.closeButton}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.formRow}>
                  <Field label="Name *">
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Enter name"
                      style={styles.formInput}
                    />
                  </Field>

                  <Field label="Designation">
                    <input
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="Enter designation"
                      style={styles.formInput}
                    />
                  </Field>
                </div>

                <Field label="Quote *">
                  <textarea
                    name="quote"
                    value={form.quote}
                    onChange={handleChange}
                    placeholder="Enter testimonial quote"
                    rows={5}
                    style={styles.formTextarea}
                  />
                </Field>

                <div style={styles.formRow}>
                  <Field label="Image URL">
                    <input
                      name="photo"
                      value={form.photo}
                      onChange={handleChange}
                      placeholder="https://..."
                      style={styles.formInput}
                    />
                  </Field>

                  <Field label="Display Order">
                    <input
                      name="order"
                      type="number"
                      value={form.order}
                      onChange={handleChange}
                      min={0}
                      style={styles.formInput}
                    />
                  </Field>

                  <div style={styles.activeField}>
                    <label style={styles.checkboxLabel}>
                      <input
                        name="isActive"
                        type="checkbox"
                        checked={form.isActive}
                        onChange={handleChange}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                {form.photo && (
                  <div style={styles.previewBox}>
                    <img
                      src={form.photo}
                      alt="Preview"
                      style={styles.previewImage}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span>Image preview</span>
                  </div>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...styles.saveButton,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  valueStyle,
}: {
  label: string;
  value: number;
  icon: string;
  valueStyle?: CSSProperties;
}) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryIcon}>{icon}</div>
      <div>
        <div style={styles.summaryLabel}>{label}</div>
        <div style={{ ...styles.summaryValue, ...valueStyle }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.formField}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    width: "100%",
    maxWidth: "100%",
  },

  breadcrumb: {
    color: "#94a0b4",
    fontSize: "12px",
    marginBottom: "10px",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "28px",
  },

  pageTitle: {
    margin: 0,
    fontSize: "22px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#182033",
  },

  pageSubtitle: {
    margin: "7px 0 0",
    color: "#718096",
    fontSize: "11px",
  },

  addButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: "6px",
    padding: "0 16px",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    height: "38px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },

  summaryCard: {
    minHeight: "128px",
    background: "#fff",
    border: "1px solid #dfe4ec",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "17px 20px",
  },

  summaryIcon: {
    width: "48px",
    height: "48px",
    borderRadius: "10px",
    background: "#f3f5f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
  },

  summaryLabel: {
    color: "#667085",
    fontSize: "11px",
    marginBottom: "7px",
  },

  summaryValue: {
    color: "#111827",
    fontSize: "25px",
    lineHeight: 1,
    fontWeight: 700,
  },

  greenValue: {
    color: "#059669",
  },

  redValue: {
    color: "#dc2626",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginBottom: "18px",
  },

  searchInput: {
    width: "450px",
    maxWidth: "100%",
    height: "38px",
    border: "1px solid #d5dbe5",
    borderRadius: "5px",
    background: "#fff",
    padding: "0 13px",
    fontSize: "11px",
    outline: "none",
  },

  toolbarRight: {
    display: "flex",
    gap: "8px",
  },

  select: {
    height: "38px",
    minWidth: "130px",
    border: "1px solid #d5dbe5",
    borderRadius: "5px",
    background: "#fff",
    padding: "0 12px",
    fontSize: "11px",
    color: "#1f2937",
    outline: "none",
  },

  dateFilterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  dateInput: {
    height: "38px",
    width: "145px",
    border: "1px solid #d5dbe5",
    borderRadius: "5px",
    background: "#fff",
    padding: "0 10px",
    fontSize: "11px",
    color: "#1f2937",
    outline: "none",
  },

  clearDateButton: {
    height: "38px",
    border: "1px solid #d5dbe5",
    background: "#fff",
    borderRadius: "5px",
    padding: "0 12px",
    fontSize: "11px",
    color: "#4b5563",
    cursor: "pointer",
  },

  tableCard: {
    width: "100%",
    background: "#fff",
    border: "1px solid #dce1e9",
    borderRadius: "7px",
    overflow: "hidden",
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  th: {
    background: "#f8f9fc",
    borderBottom: "1px solid #dce1e9",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#364052",
    width: "120px",
  },

  thName: {
    background: "#f8f9fc",
    borderBottom: "1px solid #dce1e9",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#364052",
    width: "25%",
  },

  thQuote: {
    background: "#f8f9fc",
    borderBottom: "1px solid #dce1e9",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#364052",
    width: "28%",
  },

  thDate: {
    background: "#f8f9fc",
    borderBottom: "1px solid #dce1e9",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#364052",
    width: "145px",
  },

  thActions: {
    background: "#f8f9fc",
    borderBottom: "1px solid #dce1e9",
    padding: "12px 14px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: 700,
    color: "#364052",
    width: "105px",
  },

  td: {
    padding: "12px 14px",
    borderBottom: "1px solid #e6e9ef",
    fontSize: "11px",
    color: "#4b5563",
    verticalAlign: "middle",
  },

  tdName: {
    padding: "12px 14px",
    borderBottom: "1px solid #e6e9ef",
    fontSize: "14px",
    color: "#202938",
    verticalAlign: "middle",
  },

  tdQuote: {
    padding: "12px 14px",
    borderBottom: "1px solid #e6e9ef",
    fontSize: "11px",
    color: "#374151",
    verticalAlign: "middle",
  },

  tdDate: {
    padding: "12px 14px",
    borderBottom: "1px solid #e6e9ef",
    fontSize: "12px",
    color: "#667085",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },

  tdActions: {
    padding: "12px 14px",
    borderBottom: "1px solid #e6e9ef",
    verticalAlign: "middle",
  },

  nameCell: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    lineHeight: 1.35,
  },

  designation: {
    fontSize: "11px",
    color: "#8a94a6",
  },

  quoteText: {
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: 1.4,
  },

  colorBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "4px",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 600,
  },

  tableImage: {
    width: "52px",
    height: "52px",
    borderRadius: "4px",
    objectFit: "cover",
    border: "1px solid #e1e5eb",
  },

  noImage: {
    width: "52px",
    height: "52px",
    borderRadius: "4px",
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
  },

  iconButton: {
    width: "36px",
    height: "36px",
    border: "1px solid #dce1e9",
    background: "#fff",
    borderRadius: "5px",
    marginRight: "6px",
    cursor: "pointer",
    color: "#4b5563",
    fontSize: "16px",
  },

  emptyCell: {
    padding: "55px 20px",
    textAlign: "center",
    color: "#8a94a6",
    fontSize: "14px",
  },

  tableFooter: {
    padding: "13px 4px",
    fontSize: "12px",
    color: "#7b8495",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "25px",
    zIndex: 2000,
  },

  modal: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "9px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 24px",
    borderBottom: "1px solid #e5e7eb",
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
    fontWeight: 700,
    color: "#182033",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    fontSize: "12px",
    color: "#7b8495",
  },

  closeButton: {
    border: "none",
    background: "transparent",
    fontSize: "26px",
    lineHeight: 1,
    color: "#6b7280",
    cursor: "pointer",
  },

  modalBody: {
    padding: "24px",
  },

  formRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "18px",
  },

  formField: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#374151",
  },

  formInput: {
    width: "100%",
    height: "42px",
    boxSizing: "border-box",
    border: "1px solid #d5dbe5",
    borderRadius: "5px",
    padding: "0 11px",
    fontSize: "14px",
    outline: "none",
    background: "#fff",
  },

  formTextarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d5dbe5",
    borderRadius: "5px",
    padding: "11px",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },

  activeField: {
    display: "flex",
    alignItems: "center",
    paddingTop: "20px",
  },

  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    fontSize: "14px",
    cursor: "pointer",
  },

  previewBox: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    padding: "12px",
    background: "#f8f9fc",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    color: "#6b7280",
    fontSize: "12px",
  },

  previewImage: {
    width: "55px",
    height: "55px",
    borderRadius: "4px",
    objectFit: "cover",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "9px",
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
  },

  cancelButton: {
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    borderRadius: "5px",
    padding: "9px 17px",
    fontSize: "11px",
    cursor: "pointer",
  },

  saveButton: {
    border: "none",
    background: "#111827",
    color: "#fff",
    borderRadius: "5px",
    padding: "9px 20px",
    fontSize: "11px",
    fontWeight: 600,
    cursor: "pointer",
  },
};
