/* eslint-disable @next/next/no-img-element */
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type TeamMember = {
  id: number;
  name: string;
  photo: string;
  designation: string;
  category: "TRUSTEE" | "CORE_TEAM" | "VOLUNTEER";
  education: string | null;
  experience: string | null;
  linkedinUrl: string | null;
  order: number;
  isActive: boolean;
};

type FormState = {
  name: string;
  photo: string;
  designation: string;
  category: "TRUSTEE" | "CORE_TEAM" | "VOLUNTEER";
  education: string;
  experience: string;
  linkedinUrl: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  photo: "",
  designation: "",
  category: "CORE_TEAM",
  education: "",
  experience: "",
  linkedinUrl: "",
  order: 0,
  isActive: true,
};

export default function TeamMembersPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoUploading, setPhotoUploading] = useState(false);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/team-members", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch team members");
      }

      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      alert(error instanceof Error ? error.message : "Failed to load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMembers();
  }, [fetchMembers]);

  function openAddModal() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEditModal(member: TeamMember) {
    setEditingId(member.id);

    setForm({
      name: member.name,
      photo: member.photo || "",
      designation: member.designation,
      category: member.category || "CORE_TEAM",
      education: member.education || "",
      experience: member.experience || "",
      linkedinUrl: member.linkedinUrl || "",
      order: member.order,
      isActive: member.isActive,
    });

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : name === "order"
            ? Number(value)
            : value,
    }));
  }

  async function handlePhotoUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be smaller than 10MB.");
      return;
    }

    try {
      setPhotoUploading(true);
      const formData = new FormData();
      formData.append("files", file);

      const response = await fetch("/api/media", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to upload image");

      const uploaded = Array.isArray(data) ? data[0] : null;
      if (!uploaded?.imageUrl) throw new Error("Upload did not return an image URL");

      setForm((current) => ({ ...current, photo: uploaded.imageUrl }));
    } catch (error) {
      console.error("Upload photo error:", error);
      alert(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setPhotoUploading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Please enter the team member name.");
      return;
    }

    if (!form.designation.trim()) {
      alert("Please enter the designation.");
      return;
    }

    if (!form.photo.trim()) {
      alert("Please enter a photo URL.");
      return;
    }

    try {
      setSaving(true);

      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;

      const response = await fetch("/api/team-members", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to save team member");
        return;
      }

      setModalOpen(false);
      setEditingId(null);
      setForm(emptyForm);

      await fetchMembers();
    } catch (error) {
      console.error("Save team member error:", error);
      alert("Failed to save team member.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMember(id: number) {
    const confirmed = window.confirm("Are you sure you want to delete this team member?");
    if (!confirmed) return;

    try {
      setDeletingId(id);

      const response = await fetch("/api/team-members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete team member");
        return;
      }

      setMembers((current) => current.filter((member) => member.id !== id));
    } catch (error) {
      console.error("Delete team member error:", error);
      alert("Failed to delete team member.");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...members]
      .filter((member) => {
        if (categoryFilter !== "ALL" && member.category !== categoryFilter) {
          return false;
        }

        if (statusFilter === "ACTIVE" && !member.isActive) {
          return false;
        }

        if (statusFilter === "INACTIVE" && member.isActive) {
          return false;
        }

        if (!query) return true;

        return [member.name, member.designation, member.category, member.education, member.experience]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => a.order - b.order);
  }, [members, search, categoryFilter, statusFilter]);

  const activeCount = members.filter((member) => member.isActive).length;
  const inactiveCount = members.length - activeCount;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>Dashboard / Join Our Team</div>
            <h1 style={styles.title}>Join Our Team</h1>
            <p style={styles.subtitle}>
              Manage the team members displayed on the WIN Foundations website.
            </p>
          </div>

          <button type="button" onClick={openAddModal} style={styles.primaryButton}>
            + Add Team Member
          </button>
        </div>

        {/* STATS */}
        <div style={styles.statsGrid}>
          <StatCard label="Total Members" value={members.length} />
          <StatCard label="Active" value={activeCount} />
          <StatCard label="Inactive" value={inactiveCount} />
        </div>

        {/* FILTERS */}
        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search team members..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              style={styles.select}
            >
              <option value="ALL">All Categories</option>
              <option value="TRUSTEE">Trustees</option>
              <option value="CORE_TEAM">Core Team</option>
              <option value="VOLUNTEER">Volunteers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              style={styles.select}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>Loading team members...</div>
          ) : filteredMembers.length === 0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>👥</div>
              <h3 style={styles.emptyTitle}>No team members found</h3>
              <p style={styles.emptyText}>Add your first team member using the button above.</p>
              <button type="button" onClick={openAddModal} style={styles.emptyButton}>
                + Add Team Member
              </button>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Photo</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Designation</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Order</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td style={styles.td}>
                        {member.photo ? (
                          <img src={member.photo} alt={member.name} style={styles.avatar} />
                        ) : (
                          <div style={styles.avatarPlaceholder}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </td>

                      <td style={styles.td}>
                        <div style={styles.name}>{member.name}</div>
                        {member.education && <div style={styles.muted}>{member.education}</div>}
                      </td>

                      <td style={styles.td}>{member.designation}</td>

                      <td style={styles.td}>
                        <span style={styles.categoryBadge}>{formatCategory(member.category)}</span>
                      </td>

                      <td style={styles.td}>{member.order}</td>

                      <td style={styles.td}>
                        <span style={getStatusStyle(member.isActive)}>
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={{ ...styles.td, textAlign: "center" }}>
                        <div style={styles.actions}>
                          <button type="button" onClick={() => openEditModal(member)} style={styles.editButton}>
                            Edit
                          </button>

                          <button
                            type="button"
                            disabled={deletingId === member.id}
                            onClick={() => void deleteMember(member.id)}
                            style={styles.deleteButton}
                          >
                            {deletingId === member.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {!loading && (
          <p style={styles.footerCount}>
            Showing {filteredMembers.length} of {members.length} team members
          </p>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {modalOpen && (
        <div
          style={styles.overlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingId ? "Edit Team Member" : "Add Team Member"}
                </h2>
                <p style={styles.modalSubtitle}>
                  Add the details that should appear on the public Join Our Team page.
                </p>
              </div>

              <button type="button" onClick={closeModal} disabled={saving} style={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                <div style={styles.formGrid}>
                  <Field label="Name" required>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Full name"
                      required
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Designation" required>
                    <input
                      name="designation"
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="Founder / Director / Trustee"
                      required
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Category">
                    <select name="category" value={form.category} onChange={handleChange} style={styles.input}>
                      <option value="TRUSTEE">Trustees</option>
                      <option value="CORE_TEAM">Core Team</option>
                      <option value="VOLUNTEER">Volunteers</option>
                    </select>
                  </Field>

                  <Field label="Education">
                    <input
                      name="education"
                      value={form.education}
                      onChange={handleChange}
                      placeholder="B.Tech, MBA, MSW..."
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Bio / Experience" full>
                    <textarea
                      name="experience"
                      value={form.experience}
                      onChange={handleChange}
                      placeholder="Short bio — e.g. 10 years in social work, background, achievements..."
                      rows={4}
                      style={{ ...styles.input, minHeight: "90px", resize: "vertical" }}
                    />
                  </Field>

                  <Field label="Display Order">
                    <input
                      type="number"
                      name="order"
                      value={form.order}
                      onChange={handleChange}
                      min={0}
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Photo" required full>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        type="url"
                        name="photo"
                        value={form.photo}
                        onChange={handleChange}
                        placeholder="https://... or upload a file"
                        required
                        style={{ ...styles.input, flex: 1, minWidth: "220px" }}
                      />

                      <label
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "10px 16px",
                          borderRadius: "6px",
                          background: "#2970ff",
                          color: "#fff",
                          fontSize: "14px",
                          fontWeight: 600,
                          cursor: photoUploading ? "not-allowed" : "pointer",
                          opacity: photoUploading ? 0.6 : 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {photoUploading ? "Uploading..." : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={photoUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handlePhotoUpload(file);
                            e.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>

                    {form.photo && <img src={form.photo} alt="Preview" style={styles.preview} />}
                  </Field>

                  <Field label="LinkedIn">
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={form.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/..."
                      style={styles.input}
                    />
                  </Field>
                </div>

                <label style={styles.checkboxRow}>
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} />
                  <span>Display this member on the website</span>
                </label>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeModal} disabled={saving} style={styles.secondaryButton}>
                  Cancel
                </button>

                <button type="submit" disabled={saving} style={styles.primaryButton}>
                  {saving ? "Saving..." : editingId ? "Update Member" : "Add Team Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  required,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ ...styles.field, ...(full ? styles.fieldFull : {}) }}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  );
}

function formatCategory(category: string) {
  switch (category) {
    case "CORE_TEAM":
      return "Core Team";
    case "TRUSTEE":
      return "Trustee";
    case "VOLUNTEER":
      return "Volunteer";
    default:
      return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }
}

function getStatusStyle(active: boolean): React.CSSProperties {
  if (active) {
    return { ...styles.statusBadge, background: "#ecfdf3", color: "#027a48", borderColor: "#abefc6" };
  }

  return { ...styles.statusBadge, background: "#f2f4f7", color: "#667085", borderColor: "#d0d5dd" };
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f9fc", padding: "32px 40px 50px" },
  container: { width: "100%", maxWidth: "1450px", margin: "0 auto" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "26px" },
  breadcrumb: { fontSize: "13px", color: "#667085", marginBottom: "9px" },
  title: { margin: 0, fontSize: "30px", lineHeight: 1.2, fontWeight: 700, color: "#172033" },
  subtitle: { margin: "9px 0 0", fontSize: "15px", color: "#667085" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#ffffff", border: "1px solid #e2e7ef", borderRadius: "8px", padding: "19px 20px" },
  statLabel: { fontSize: "13px", color: "#667085", marginBottom: "7px" },
  statValue: { fontSize: "27px", fontWeight: 700, color: "#172033" },
  toolbar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "20px", flexWrap: "wrap" },
  searchBox: { width: "380px", maxWidth: "100%", height: "46px", display: "flex", alignItems: "center", border: "1px solid #d5dbe5", borderRadius: "6px", background: "#ffffff", overflow: "hidden" },
  searchIcon: { paddingLeft: "14px", fontSize: "21px", color: "#667085" },
  searchInput: { width: "100%", height: "100%", border: "none", outline: "none", padding: "0 14px 0 10px", fontSize: "14px", color: "#172033", background: "transparent" },
  filterGroup: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  select: { height: "46px", minWidth: "155px", border: "1px solid #d5dbe5", borderRadius: "6px", background: "#ffffff", padding: "0 12px", fontSize: "14px", color: "#172033", outline: "none", cursor: "pointer" },
  primaryButton: { height: "42px", padding: "0 17px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" },
  tableCard: { width: "100%", background: "#ffffff", border: "1px solid #dfe4ec", borderRadius: "8px", overflow: "hidden" },
  tableWrapper: { width: "100%", overflowX: "auto" },
  table: { width: "100%", minWidth: "1050px", borderCollapse: "collapse", tableLayout: "fixed" },
  th: { padding: "15px 16px", textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #dfe4ec", color: "#344054", fontSize: "13px", fontWeight: 700 },
  td: { padding: "14px 16px", borderBottom: "1px solid #e5e7eb", color: "#101828", fontSize: "14px", verticalAlign: "middle" },
  avatar: { width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", display: "block", border: "1px solid #e4e7ec" },
  avatarPlaceholder: { width: "48px", height: "48px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#eef4ff", color: "#2563eb", fontSize: "17px", fontWeight: 700 },
  name: { fontWeight: 600, color: "#172033" },
  muted: { marginTop: "4px", color: "#98a2b3", fontSize: "12px" },
  categoryBadge: { display: "inline-flex", alignItems: "center", padding: "5px 9px", borderRadius: "20px", background: "#f2f4f7", color: "#475467", fontSize: "12px", fontWeight: 600 },
  statusBadge: { display: "inline-flex", alignItems: "center", padding: "5px 10px", border: "1px solid", borderRadius: "20px", fontSize: "12px", fontWeight: 600 },
  actions: { display: "flex", justifyContent: "center", gap: "7px" },
  editButton: { height: "34px", padding: "0 12px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#ffffff", color: "#344054", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  deleteButton: { height: "34px", padding: "0 12px", border: "1px solid #fecdca", borderRadius: "6px", background: "#fff5f4", color: "#b42318", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  loading: { padding: "70px 20px", textAlign: "center", color: "#667085", fontSize: "15px" },
  empty: { padding: "75px 20px", textAlign: "center" },
  emptyIcon: { width: "54px", height: "54px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#eef4ff", fontSize: "24px" },
  emptyTitle: { margin: 0, fontSize: "18px", color: "#172033" },
  emptyText: { margin: "8px 0 18px", color: "#667085", fontSize: "14px" },
  emptyButton: { height: "40px", padding: "0 15px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#ffffff", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  footerCount: { margin: "13px 0 0", color: "#667085", fontSize: "13px" },
  overlay: { position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(15, 23, 42, 0.45)" },
  modal: { width: "100%", maxWidth: "850px", maxHeight: "92vh", overflow: "hidden", background: "#ffffff", borderRadius: "10px", boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)" },
  modalHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", padding: "22px 24px", borderBottom: "1px solid #e5e7eb" },
  modalTitle: { margin: 0, fontSize: "21px", color: "#172033" },
  modalSubtitle: { margin: "5px 0 0", fontSize: "13px", color: "#667085" },
  closeButton: { width: "34px", height: "34px", border: "none", borderRadius: "6px", background: "#f2f4f7", color: "#475467", fontSize: "23px", cursor: "pointer" },
  modalBody: { padding: "24px", maxHeight: "68vh", overflowY: "auto" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px" },
  field: { minWidth: 0 },
  fieldFull: { gridColumn: "1 / -1", marginTop: "18px" },
  label: { display: "block", marginBottom: "7px", fontSize: "13px", fontWeight: 600, color: "#344054" },
  required: { color: "#d92d20" },
  input: { width: "100%", minHeight: "42px", boxSizing: "border-box", padding: "9px 11px", border: "1px solid #d0d5dd", borderRadius: "6px", outline: "none", background: "#ffffff", color: "#172033", fontSize: "14px" },
  preview: { width: "60px", height: "60px", marginTop: "9px", objectFit: "cover", borderRadius: "8px", border: "1px solid #e4e7ec" },
  checkboxRow: { display: "flex", alignItems: "center", gap: "9px", marginTop: "20px", color: "#344054", fontSize: "14px", cursor: "pointer" },
  modalFooter: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", padding: "16px 24px", borderTop: "1px solid #e5e7eb" },
  secondaryButton: { height: "42px", padding: "0 17px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#ffffff", color: "#344054", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
};
