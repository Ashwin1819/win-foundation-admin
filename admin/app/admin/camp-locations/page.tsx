"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

type Media = {
  id: number;
  type: "IMAGE" | "VIDEO";
  url: string | null;
  caption: string | null;
  order: number;
};

type Initiative = {
  id: number;
  title: string;
  slug: string;
};

type CampLocation = {
  id: number;
  initiativeId: number;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  campDate: string | null;
  description: string | null;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
};

type FormState = {
  initiativeId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  campDate: string;
  description: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  initiativeId: "",
  name: "",
  address: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  campDate: "",
  description: "",
  isActive: true,
};

export default function CampLocationsPage() {
  const router = useRouter();

  const [user, setUser] = useState(false);
  const [locations, setLocations] = useState<CampLocation[]>([]);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    setUser(true);
  }, []);

  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/camp-locations", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load camp locations");
      }

      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load camp locations");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitiatives = useCallback(async () => {
    try {
      const response = await fetch("/api/camp-locations/initiatives", { cache: "no-store" });
      const data = await response.json();

      if (response.ok) {
        setInitiatives(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load initiatives:", err);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    void fetchLocations();
    void fetchInitiatives();
  }, [user, fetchLocations, fetchInitiatives]);

  const editingLocation = useMemo(
    () => (editingId ? locations.find((l) => l.id === editingId) ?? null : null),
    [locations, editingId]
  );

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setShowForm(true);
  }

  function openEditForm(location: CampLocation) {
    setEditingId(location.id);
    setForm({
      initiativeId: String(location.initiativeId),
      name: location.name,
      address: location.address,
      city: location.city || "",
      state: location.state || "",
      latitude: location.latitude !== null ? String(location.latitude) : "",
      longitude: location.longitude !== null ? String(location.longitude) : "",
      campDate: location.campDate ? location.campDate.substring(0, 10) : "",
      description: location.description || "",
      isActive: location.isActive,
    });
    setError("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
  }

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setError("You are not authenticated.");
      return;
    }

    if (!form.initiativeId) {
      setError("Initiative is required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Camp name is required.");
      return;
    }

    if (!form.address.trim()) {
      setError("Address is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = "cookie-auth";

      const payload = {
        initiativeId: Number(form.initiativeId),
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        latitude: form.latitude ? Number(form.latitude) : undefined,
        longitude: form.longitude ? Number(form.longitude) : undefined,
        campDate: form.campDate || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };

      const response = await fetch("/api/camp-locations", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || (editingId ? "Failed to update camp" : "Failed to add camp"));
      }

      setSuccess(editingId ? "Camp location updated successfully." : "Camp location added. You can now attach photos below.");

      await fetchLocations();

      if (!editingId) {
        setEditingId(data.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(location: CampLocation) {
    if (!user) return;

    const confirmed = window.confirm(
      `Delete "${location.name}"? Its attached photos/videos will be deleted too.`
    );
    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const token = "cookie-auth";

      const response = await fetch("/api/camp-locations", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: location.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete camp location");
      }

      setSuccess("Camp location deleted successfully.");

      if (editingId === location.id) {
        closeForm();
      }

      await fetchLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete camp location");
    }
  }

  async function uploadMedia(file: File) {
    if (!editingId || !user) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG, WebP, GIF image or an MP4/WebM video.");
      return;
    }

    try {
      setUploadingMedia(true);
      setError("");

      const token = "cookie-auth";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("campLocationId", String(editingId));

      const response = await fetch("/api/media", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload media");
      }

      await fetchLocations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload media.");
    } finally {
      setUploadingMedia(false);
    }
  }

  async function deleteMedia(media: Media) {
    if (!user) return;

    const confirmed = window.confirm("Remove this photo/video from the camp?");
    if (!confirmed) return;

    try {
      setDeletingMediaId(media.id);

      const token = "cookie-auth";

      const response = await fetch("/api/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: media.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete media");
      }

      await fetchLocations();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete media.");
    } finally {
      setDeletingMediaId(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Camp Locations</h1>
          <p style={styles.subtitle}>
            Camp locations attached to an Initiative, with their own photos and
            videos.
          </p>
        </div>

        <button type="button" onClick={openAddForm} style={styles.primaryButton}>
          + Add
        </button>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Camp Locations</h2>
            <p style={styles.cardSubtitle}>
              {locations.length} location{locations.length === 1 ? "" : "s"} added
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading camp locations...</div>
        ) : locations.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>+</div>
            <h3 style={styles.emptyTitle}>No camp locations yet</h3>
            <p style={styles.emptyText}>
              Add a camp location using the Add button above.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Camp</th>
                  <th style={styles.th}>Initiative</th>
                  <th style={styles.th}>City / State</th>
                  <th style={styles.th}>Date</th>
                  <th style={styles.th}>Media</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {locations.map((location) => {
                  const initiative = initiatives.find((i) => i.id === location.initiativeId);

                  return (
                    <tr key={location.id}>
                      <td style={styles.td}>
                        <strong>{location.name}</strong>
                      </td>

                      <td style={styles.td}>{initiative?.title || `#${location.initiativeId}`}</td>

                      <td style={styles.td}>
                        {[location.city, location.state].filter(Boolean).join(", ") || "—"}
                      </td>

                      <td style={styles.td}>
                        {location.campDate ? new Date(location.campDate).toLocaleDateString() : "—"}
                      </td>

                      <td style={styles.td}>
                        {location.media?.length ?? 0} item{(location.media?.length ?? 0) === 1 ? "" : "s"}
                      </td>

                      <td style={styles.td}>
                        <span style={location.isActive ? styles.activeBadge : styles.inactiveBadge}>
                          {location.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button type="button" onClick={() => openEditForm(location)} style={styles.editButton}>
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(location)}
                            style={styles.deleteButton}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <div
          style={styles.modalOverlay}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingId ? "Edit Camp Location" : "Add Camp Location"}</h2>
              <button type="button" onClick={closeForm} disabled={saving} style={styles.closeButton} aria-label="Close">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody}>
                {error && <div style={styles.errorBox}>{error}</div>}

                <div style={styles.formGrid}>
                  <div style={styles.fieldFull}>
                    <label style={styles.label}>Initiative *</label>
                    <select
                      value={form.initiativeId}
                      onChange={(event) => updateField("initiativeId", event.target.value)}
                      style={styles.input}
                    >
                      <option value="">Select an initiative...</option>
                      {initiatives.map((initiative) => (
                        <option key={initiative.id} value={initiative.id}>
                          {initiative.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Camp name *</label>
                    <input
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      placeholder="Rural Health Camp"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Camp date</label>
                    <input
                      type="date"
                      value={form.campDate}
                      onChange={(event) => updateField("campDate", event.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldFull}>
                    <label style={styles.label}>Address *</label>
                    <input
                      value={form.address}
                      onChange={(event) => updateField("address", event.target.value)}
                      placeholder="Government School Grounds, Anekal"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>City</label>
                    <input
                      value={form.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      placeholder="Bengaluru"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>State</label>
                    <input
                      value={form.state}
                      onChange={(event) => updateField("state", event.target.value)}
                      placeholder="Karnataka"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Latitude</label>
                    <input
                      value={form.latitude}
                      onChange={(event) => updateField("latitude", event.target.value)}
                      placeholder="12.9716"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Longitude</label>
                    <input
                      value={form.longitude}
                      onChange={(event) => updateField("longitude", event.target.value)}
                      placeholder="77.5946"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.fieldFull}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      value={form.description}
                      onChange={(event) => updateField("description", event.target.value)}
                      placeholder="Describe the camp..."
                      rows={4}
                      style={{ ...styles.input, resize: "vertical" }}
                    />
                  </div>

                  <div style={styles.fieldFull}>
                    <label style={styles.label}>
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(event) => updateField("isActive", event.target.checked)}
                        style={{ marginRight: 8 }}
                      />
                      Active (visible on the public site)
                    </label>
                  </div>
                </div>

                {editingId && (
                  <div style={styles.fieldFull}>
                    <label style={styles.label}>Photos & Videos</label>

                    <div style={styles.mediaBox}>
                      <label style={styles.chooseButton}>
                        {uploadingMedia ? "Uploading..." : "Add Photo/Video"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                          disabled={uploadingMedia || saving}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadMedia(file);
                            event.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>

                      {(editingLocation?.media?.length ?? 0) > 0 ? (
                        <div style={styles.mediaGrid}>
                          {editingLocation!.media!.map((item) => (
                            <div key={item.id} style={styles.mediaItem}>
                              {item.type === "IMAGE" && item.url ? (
                                <div
                                  style={{
                                    ...styles.mediaThumb,
                                    backgroundImage: `url("${item.url.replace(/"/g, '\\"')}")`,
                                  }}
                                />
                              ) : (
                                <div style={styles.mediaThumb}>▶ video</div>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMedia(item)}
                                disabled={deletingMediaId === item.id}
                                style={styles.mediaDeleteButton}
                                title="Remove"
                              >
                                {deletingMediaId === item.id ? "..." : "🗑"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={styles.helpText}>No photos or videos attached yet.</span>
                      )}
                    </div>
                  </div>
                )}

                {!editingId && (
                  <span style={styles.helpText}>
                    Save the camp location first, then you can attach photos and videos to it.
                  </span>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeForm} disabled={saving} style={styles.secondaryButton}>
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{ ...styles.primaryButton, opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Camp Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    padding: "28px 32px 50px",
    maxWidth: 1500,
    margin: "0 auto",
    color: "#171717",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" },
  subtitle: { margin: "7px 0 0", color: "#737373", fontSize: 14 },
  card: {
    background: "#ffffff",
    border: "1px solid #e8e8e8",
    borderRadius: 12,
    padding: 20,
    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  cardTitle: { margin: 0, fontSize: 18, fontWeight: 700 },
  cardSubtitle: { margin: "5px 0 0", fontSize: 13, color: "#858585" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 },
  fieldFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: 600, color: "#333" },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #d9d9d9",
    borderRadius: 7,
    padding: "10px 11px",
    fontSize: 13,
    outline: "none",
    background: "#fff",
    color: "#222",
  },
  helpText: { fontSize: 11, color: "#999" },
  primaryButton: {
    border: "none",
    borderRadius: 7,
    background: "#111827",
    color: "#fff",
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #d7d7d7",
    borderRadius: 7,
    background: "#fff",
    color: "#444",
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  },
  tableWrapper: { width: "100%", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e5e5e5",
    color: "#666",
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: { padding: "14px 10px", borderBottom: "1px solid #eeeeee", color: "#444", verticalAlign: "middle" },
  actions: { display: "flex", gap: 7 },
  editButton: {
    border: "1px solid #d9d9d9",
    background: "#fff",
    color: "#333",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  activeBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 20,
    background: "#ecfdf3",
    color: "#15803d",
    fontSize: 11,
    fontWeight: 600,
  },
  inactiveBadge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: 20,
    background: "#f3f4f6",
    color: "#6b7280",
    fontSize: 11,
    fontWeight: 600,
  },
  emptyState: {
    minHeight: 180,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 30,
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "#f3f4f6",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
    marginBottom: 12,
  },
  emptyTitle: { margin: 0, fontSize: 16, fontWeight: 600 },
  emptyText: { margin: "7px 0 0", maxWidth: 450, color: "#888", fontSize: 13, lineHeight: 1.5 },
  errorBox: {
    marginBottom: 18,
    padding: "11px 14px",
    borderRadius: 8,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: 13,
  },
  successBox: {
    marginBottom: 18,
    padding: "11px 14px",
    borderRadius: 8,
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#15803d",
    fontSize: 13,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(15,23,42,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 820,
    maxHeight: "92vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: 9,
    border: "1px solid #e5e7eb",
    boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
  },
  modalHeader: {
    padding: "18px 20px",
    borderBottom: "1px solid #eaecf0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 15,
  },
  modalTitle: { margin: 0, fontSize: 17, fontWeight: 750, color: "#101828" },
  closeButton: {
    width: 29,
    height: 29,
    border: "none",
    borderRadius: 5,
    background: "#f2f4f7",
    color: "#667085",
    fontSize: 18,
    cursor: "pointer",
  },
  modalBody: { padding: "19px 20px" },
  modalFooter: {
    padding: "12px 20px",
    borderTop: "1px solid #eaecf0",
    background: "#fafbfc",
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
  },
  mediaBox: { border: "1px solid #e4e7ec", borderRadius: 8, padding: 12, background: "#f8fafc" },
  chooseButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 34,
    padding: "0 12px",
    borderRadius: 5,
    background: "#111827",
    color: "#ffffff",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: 12,
  },
  mediaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 10 },
  mediaItem: { position: "relative" },
  mediaThumb: {
    width: "100%",
    height: 80,
    borderRadius: 6,
    backgroundColor: "#eef1f3",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    border: "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    color: "#98a2b3",
  },
  mediaDeleteButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    border: "1px solid #d7dee7",
    borderRadius: 5,
    background: "#ffffff",
    color: "#475467",
    fontSize: 11,
    cursor: "pointer",
  },
};
