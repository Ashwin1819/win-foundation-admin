"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

type LabelDescription = { label: string; description: string };
type LabelValue = { label: string; value: number };

type Photo = {
  id: number;
  image: string;
  caption: string | null;
  order: number;
};

type Video = {
  id: number;
  title: string;
  youtubeUrl: string;
  order: number;
};

type Initiative = {
  id: number;
  title: string;
  slug: string;
  shortDesc: string;
  fullDesc: string;
  coverImage: string;
  featureImage: string | null;
  keyFeatures: LabelDescription[];
  keyActivities: string[];
  howItWorks: LabelDescription[];
  impactNumbers: LabelValue[];
  impactPoints: string[];
  order: number;
  isActive: boolean;
  photos?: Photo[];
  videos?: Video[];
};

type FormState = {
  title: string;
  slug: string;
  shortDesc: string;
  fullDesc: string;
  coverImage: string;
  featureImage: string;
  keyFeatures: LabelDescription[];
  keyActivities: string[];
  howItWorks: LabelDescription[];
  impactNumbers: LabelValue[];
  impactPoints: string[];
  order: number;
  isActive: boolean;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  shortDesc: "",
  fullDesc: "",
  coverImage: "",
  featureImage: "",
  keyFeatures: [],
  keyActivities: [],
  howItWorks: [],
  impactNumbers: [],
  impactPoints: [],
  order: 0,
  isActive: true,
};

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFeature, setUploadingFeature] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormState>(emptyForm);

  const fetchInitiatives = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/initiatives", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch initiatives");
      }

      setInitiatives(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load initiatives:", error);
      alert(error instanceof Error ? error.message : "Failed to load initiatives.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInitiatives();
  }, [fetchInitiatives]);

  const editingInitiative = useMemo(
    () => (editingId ? initiatives.find((i) => i.id === editingId) ?? null : null),
    [initiatives, editingId]
  );

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setVideoTitle("");
    setVideoUrl("");
    setShowForm(true);
  }

  function openEditForm(initiative: Initiative) {
    setEditingId(initiative.id);
    setForm({
      title: initiative.title,
      slug: initiative.slug,
      shortDesc: initiative.shortDesc,
      fullDesc: initiative.fullDesc,
      coverImage: initiative.coverImage,
      featureImage: initiative.featureImage || "",
      keyFeatures: initiative.keyFeatures || [],
      keyActivities: initiative.keyActivities || [],
      howItWorks: initiative.howItWorks || [],
      impactNumbers: initiative.impactNumbers || [],
      impactPoints: initiative.impactPoints || [],
      order: initiative.order,
      isActive: initiative.isActive,
    });
    setMessage("");
    setVideoTitle("");
    setVideoUrl("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setVideoTitle("");
    setVideoUrl("");
  }

  async function saveInitiative(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim() || !form.slug.trim() || !form.shortDesc.trim() || !form.fullDesc.trim() || !form.coverImage.trim()) {
      setMessage("Title, slug, short description, full description and cover image are required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        shortDesc: form.shortDesc.trim(),
        fullDesc: form.fullDesc.trim(),
        coverImage: form.coverImage.trim(),
        featureImage: form.featureImage.trim() || undefined,
        keyFeatures: form.keyFeatures,
        keyActivities: form.keyActivities,
        howItWorks: form.howItWorks,
        impactNumbers: form.impactNumbers,
        impactPoints: form.impactPoints,
        order: form.order,
        isActive: form.isActive,
      };

      const response = await fetch("/api/initiatives", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save initiative");
      }

      await fetchInitiatives();

      if (!editingId) {
        setEditingId(data.id);
      }

      alert(editingId ? "Initiative updated." : "Initiative created. You can now add photos below.");
    } catch (error) {
      console.error("Save initiative error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to save initiative.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteInitiative(initiative: Initiative) {
    const confirmed = window.confirm(
      `Delete "${initiative.title}"? Its photos will be deleted too.`
    );
    if (!confirmed) return;

    try {
      setDeletingId(initiative.id);

      const response = await fetch("/api/initiatives", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initiative.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete initiative");
      }

      setInitiatives((current) => current.filter((item) => item.id !== initiative.id));
    } catch (error) {
      console.error("Delete initiative error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete initiative.");
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadPhoto(file: File) {
    if (!editingId) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("initiativeId", String(editingId));

      const response = await fetch("/api/initiatives/photos", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload photo");
      }

      await fetchInitiatives();
    } catch (error) {
      console.error("Photo upload error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function uploadFieldImage(file: File, field: "coverImage" | "featureImage") {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessage("Image must be smaller than 10MB.");
      return;
    }

    const setUploading = field === "coverImage" ? setUploadingCover : setUploadingFeature;

    try {
      setUploading(true);
      setMessage("");

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

      setForm((f) => ({ ...f, [field]: uploaded.imageUrl }));
    } catch (error) {
      console.error("Upload image error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to upload image.");
    } finally {
      setUploading(false);
    }
  }

  async function addVideo() {
    if (!editingId) return;

    if (!videoTitle.trim() || !videoUrl.trim()) {
      setMessage("Video title and URL are required.");
      return;
    }

    try {
      setAddingVideo(true);
      setMessage("");

      const response = await fetch("/api/initiatives/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initiativeId: editingId,
          title: videoTitle.trim(),
          youtubeUrl: videoUrl.trim(),
          order: editingInitiative?.videos?.length ?? 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to add video");
      }

      setVideoTitle("");
      setVideoUrl("");
      await fetchInitiatives();
    } catch (error) {
      console.error("Add video error:", error);
      setMessage(error instanceof Error ? error.message : "Failed to add video.");
    } finally {
      setAddingVideo(false);
    }
  }

  async function deleteVideo(video: Video) {
    const confirmed = window.confirm(`Remove video "${video.title}"?`);
    if (!confirmed) return;

    try {
      setDeletingVideoId(video.id);

      const response = await fetch("/api/initiatives/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete video");
      }

      await fetchInitiatives();
    } catch (error) {
      console.error("Delete video error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete video.");
    } finally {
      setDeletingVideoId(null);
    }
  }

  async function deletePhoto(photo: Photo) {
    const confirmed = window.confirm("Remove this photo?");
    if (!confirmed) return;

    try {
      setDeletingPhotoId(photo.id);

      const response = await fetch("/api/initiatives/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete photo");
      }

      await fetchInitiatives();
    } catch (error) {
      console.error("Delete photo error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete photo.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Initiatives</h1>
          <p style={styles.subtitle}>
            Manage initiative detail pages — features, activities, how-it-works steps, impact stats and photos.
          </p>
        </div>

        <button type="button" onClick={openAddForm} style={styles.primaryButton}>
          + Add Initiative
        </button>
      </div>

      <section style={styles.card}>
        {loading ? (
          <div style={styles.emptyState}>Loading initiatives...</div>
        ) : initiatives.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No initiatives yet.</p>
            <button type="button" onClick={openAddForm} style={styles.primaryButton}>
              + Add Initiative
            </button>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Photos</th>
                  <th style={styles.th}>Videos</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {initiatives.map((initiative) => (
                  <tr key={initiative.id}>
                    <td style={styles.td}>
                      <div style={styles.rowTitle}>{initiative.title}</div>
                      <div style={styles.rowSlug}>/{initiative.slug}</div>
                    </td>
                    <td style={styles.td}>{initiative.order}</td>
                    <td style={styles.td}>{initiative.photos?.length ?? 0}</td>
                    <td style={styles.td}>{initiative.videos?.length ?? 0}</td>
                    <td style={styles.td}>
                      <span style={initiative.isActive ? styles.activeBadge : styles.inactiveBadge}>
                        {initiative.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: "right" }}>
                      <button type="button" onClick={() => openEditForm(initiative)} style={styles.editButton}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteInitiative(initiative)}
                        disabled={deletingId === initiative.id}
                        style={styles.deleteButton}
                      >
                        {deletingId === initiative.id ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h2 style={styles.modalTitle}>{editingId ? "Edit Initiative" : "Add Initiative"}</h2>
              <button type="button" onClick={closeForm} disabled={saving} style={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={saveInitiative}>
              <div style={styles.modalBody}>
                {message && <div style={styles.errorBox}>{message}</div>}

                <div style={styles.formGrid}>
                  <Field label="Title" required>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      style={styles.input}
                    />
                  </Field>

                  <Field label="Slug" required>
                    <input
                      value={form.slug}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          slug: e.target.value.toLowerCase().replace(/[^a-z0-9-\s]/g, "").replace(/\s+/g, "-"),
                        }))
                      }
                      style={styles.input}
                    />
                  </Field>
                </div>

                <Field label="Short Description" required>
                  <textarea
                    value={form.shortDesc}
                    onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
                    rows={2}
                    style={styles.textarea}
                  />
                </Field>

                <Field label="Full Description" required>
                  <textarea
                    value={form.fullDesc}
                    onChange={(e) => setForm((f) => ({ ...f, fullDesc: e.target.value }))}
                    rows={5}
                    style={styles.textarea}
                  />
                </Field>

                <div style={styles.formGrid}>
                  <Field label="Cover Image" required>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        value={form.coverImage}
                        onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                        placeholder="https://... or upload"
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <label style={{ ...styles.chooseButton, opacity: uploadingCover ? 0.6 : 1, cursor: uploadingCover ? "not-allowed" : "pointer" }}>
                        {uploadingCover ? "..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingCover}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadFieldImage(file, "coverImage");
                            e.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                    {form.coverImage.trim() && (
                      <div style={{ ...styles.mediaThumb, marginTop: "8px", backgroundImage: `url("${form.coverImage.replace(/"/g, '\\"')}")` }} />
                    )}
                  </Field>

                  <Field label="Feature Image">
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input
                        value={form.featureImage}
                        onChange={(e) => setForm((f) => ({ ...f, featureImage: e.target.value }))}
                        placeholder="https://... or upload"
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <label style={{ ...styles.chooseButton, opacity: uploadingFeature ? 0.6 : 1, cursor: uploadingFeature ? "not-allowed" : "pointer" }}>
                        {uploadingFeature ? "..." : "Upload"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={uploadingFeature}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void uploadFieldImage(file, "featureImage");
                            e.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                    {form.featureImage.trim() && (
                      <div style={{ ...styles.mediaThumb, marginTop: "8px", backgroundImage: `url("${form.featureImage.replace(/"/g, '\\"')}")` }} />
                    )}
                  </Field>
                </div>

                <div style={styles.formGrid}>
                  <Field label="Display Order">
                    <input
                      type="number"
                      value={form.order}
                      onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
                      style={styles.input}
                    />
                  </Field>

                  <div style={styles.activeField}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                      />
                      <span>Active (visible on the public site)</span>
                    </label>
                  </div>
                </div>

                <LabelDescriptionListEditor
                  label="Key Features"
                  items={form.keyFeatures}
                  onChange={(items) => setForm((f) => ({ ...f, keyFeatures: items }))}
                />

                <StringListEditor
                  label="Key Activities"
                  items={form.keyActivities}
                  onChange={(items) => setForm((f) => ({ ...f, keyActivities: items }))}
                />

                <LabelDescriptionListEditor
                  label="How It Works"
                  items={form.howItWorks}
                  onChange={(items) => setForm((f) => ({ ...f, howItWorks: items }))}
                />

                <LabelValueListEditor
                  label="Impact Numbers"
                  items={form.impactNumbers}
                  onChange={(items) => setForm((f) => ({ ...f, impactNumbers: items }))}
                />

                <StringListEditor
                  label="Impact Points"
                  items={form.impactPoints}
                  onChange={(items) => setForm((f) => ({ ...f, impactPoints: items }))}
                />

                {editingId && (
                  <Field label="Photos">
                    <div style={styles.mediaBox}>
                      <label style={styles.chooseButton}>
                        {uploadingPhoto ? "Uploading..." : "Add Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingPhoto || saving}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadPhoto(file);
                            event.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>

                      {(editingInitiative?.photos?.length ?? 0) > 0 ? (
                        <div style={styles.mediaGrid}>
                          {editingInitiative!.photos!.map((photo) => (
                            <div key={photo.id} style={styles.mediaItem}>
                              <div
                                style={{
                                  ...styles.mediaThumb,
                                  backgroundImage: `url("${photo.image.replace(/"/g, '\\"')}")`,
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => deletePhoto(photo)}
                                disabled={deletingPhotoId === photo.id}
                                style={styles.mediaDeleteButton}
                                title="Remove"
                              >
                                {deletingPhotoId === photo.id ? "..." : "🗑"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={styles.helpText}>No photos yet.</span>
                      )}
                    </div>
                  </Field>
                )}

                {editingId && (
                  <Field label="Videos (YouTube)">
                    <div style={styles.mediaBox}>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                        <input
                          value={videoTitle}
                          onChange={(e) => setVideoTitle(e.target.value)}
                          placeholder="Video title"
                          disabled={addingVideo}
                          style={{ ...styles.input, flex: "1 1 160px" }}
                        />
                        <input
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          disabled={addingVideo}
                          style={{ ...styles.input, flex: "2 1 220px" }}
                        />
                        <button
                          type="button"
                          onClick={() => void addVideo()}
                          disabled={addingVideo}
                          style={styles.chooseButton}
                        >
                          {addingVideo ? "Adding..." : "+ Add Video"}
                        </button>
                      </div>

                      {(editingInitiative?.videos?.length ?? 0) > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {editingInitiative!.videos!.map((video) => (
                            <div
                              key={video.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "10px",
                                padding: "8px 10px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#172033" }}>{video.title}</div>
                                <div style={{ fontSize: "11px", color: "#667085", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {video.youtubeUrl}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => void deleteVideo(video)}
                                disabled={deletingVideoId === video.id}
                                style={styles.mediaDeleteButton}
                                title="Remove"
                              >
                                {deletingVideoId === video.id ? "..." : "🗑"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={styles.helpText}>No videos yet.</span>
                      )}
                    </div>
                  </Field>
                )}

                {!editingId && (
                  <span style={styles.helpText}>Save the initiative first, then you can add photos and videos.</span>
                )}
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeForm} disabled={saving} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={saving} style={styles.primaryButton}>
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Add Initiative"}
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
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      {children}
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div style={styles.listEditor}>
        {items.map((item, index) => (
          <div key={index} style={styles.listRow}>
            <input
              value={item}
              onChange={(e) => {
                const next = [...items];
                next[index] = e.target.value;
                onChange(next);
              }}
              style={{ ...styles.input, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              style={styles.removeRowButton}
            >
              Remove
            </button>
          </div>
        ))}
        <button type="button" onClick={() => onChange([...items, ""])} style={styles.addRowButton}>
          + Add
        </button>
      </div>
    </Field>
  );
}

function LabelDescriptionListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: LabelDescription[];
  onChange: (items: LabelDescription[]) => void;
}) {
  return (
    <Field label={label}>
      <div style={styles.listEditor}>
        {items.map((item, index) => (
          <div key={index} style={styles.listRowStacked}>
            <input
              value={item.label}
              placeholder="Label"
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], label: e.target.value };
                onChange(next);
              }}
              style={styles.input}
            />
            <textarea
              value={item.description}
              placeholder="Description"
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], description: e.target.value };
                onChange(next);
              }}
              rows={2}
              style={styles.textarea}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              style={styles.removeRowButton}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", description: "" }])}
          style={styles.addRowButton}
        >
          + Add
        </button>
      </div>
    </Field>
  );
}

function LabelValueListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: LabelValue[];
  onChange: (items: LabelValue[]) => void;
}) {
  return (
    <Field label={label}>
      <div style={styles.listEditor}>
        {items.map((item, index) => (
          <div key={index} style={styles.listRow}>
            <input
              value={item.label}
              placeholder="Label"
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], label: e.target.value };
                onChange(next);
              }}
              style={{ ...styles.input, flex: 2 }}
            />
            <input
              type="number"
              value={item.value}
              placeholder="Value"
              onChange={(e) => {
                const next = [...items];
                next[index] = { ...next[index], value: Number(e.target.value) };
                onChange(next);
              }}
              style={{ ...styles.input, flex: 1 }}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              style={styles.removeRowButton}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange([...items, { label: "", value: 0 }])}
          style={styles.addRowButton}
        >
          + Add
        </button>
      </div>
    </Field>
  );
}

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f9fc", padding: "32px 40px 50px" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", marginBottom: "26px" },
  title: { margin: 0, fontSize: "28px", fontWeight: 700, color: "#172033" },
  subtitle: { margin: "8px 0 0", fontSize: "14px", color: "#667085", maxWidth: "700px" },
  primaryButton: { height: "40px", padding: "0 16px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
  card: { background: "#fff", border: "1px solid #dfe4ec", borderRadius: "8px", overflow: "hidden" },
  emptyState: { padding: "60px 20px", textAlign: "center", color: "#667085" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 16px", textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #dfe4ec", fontSize: "13px", fontWeight: 700, color: "#344054" },
  td: { padding: "14px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#101828", verticalAlign: "middle" },
  rowTitle: { fontWeight: 600 },
  rowSlug: { color: "#98a2b3", fontSize: "12px", marginTop: "2px" },
  activeBadge: { padding: "4px 10px", borderRadius: "20px", background: "#ecfdf3", color: "#027a48", fontSize: "12px", fontWeight: 600 },
  inactiveBadge: { padding: "4px 10px", borderRadius: "20px", background: "#f2f4f7", color: "#667085", fontSize: "12px", fontWeight: 600 },
  editButton: { height: "32px", padding: "0 12px", marginRight: "6px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#fff", color: "#344054", fontSize: "13px", cursor: "pointer" },
  deleteButton: { height: "32px", padding: "0 12px", border: "1px solid #fecdca", borderRadius: "6px", background: "#fff5f4", color: "#b42318", fontSize: "13px", cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(15,23,42,0.45)" },
  modal: { width: "100%", maxWidth: "900px", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: "10px" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff", zIndex: 1 },
  modalTitle: { margin: 0, fontSize: "19px", color: "#172033" },
  closeButton: { width: "32px", height: "32px", border: "none", borderRadius: "6px", background: "#f2f4f7", fontSize: "20px", cursor: "pointer" },
  modalBody: { padding: "24px" },
  modalFooter: { display: "flex", justifyContent: "flex-end", gap: "10px", padding: "16px 24px", borderTop: "1px solid #e5e7eb" },
  errorBox: { marginBottom: "16px", padding: "10px 12px", borderRadius: "6px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "13px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  field: { marginBottom: "18px" },
  label: { display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600, color: "#344054" },
  required: { color: "#dc2626" },
  input: { width: "100%", height: "38px", boxSizing: "border-box", padding: "0 10px", border: "1px solid #d0d5dd", borderRadius: "6px", fontSize: "14px", color: "#172033" },
  textarea: { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #d0d5dd", borderRadius: "6px", fontSize: "14px", color: "#172033", resize: "vertical" },
  activeField: { display: "flex", alignItems: "flex-end" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#344054", height: "38px" },
  listEditor: { border: "1px solid #e4e7ec", borderRadius: "8px", padding: "12px", background: "#f8fafc" },
  listRow: { display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" },
  listRowStacked: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #e4e7ec" },
  addRowButton: { height: "32px", padding: "0 12px", border: "1px dashed #94a3b8", borderRadius: "6px", background: "transparent", color: "#475467", fontSize: "13px", cursor: "pointer" },
  removeRowButton: { height: "32px", padding: "0 10px", border: "1px solid #fecdca", borderRadius: "6px", background: "#fff5f4", color: "#b42318", fontSize: "12px", cursor: "pointer", alignSelf: "flex-start" },
  helpText: { color: "#98a2b3", fontSize: "12px" },
  mediaBox: { border: "1px solid #e4e7ec", borderRadius: "8px", padding: "12px", background: "#f8fafc" },
  chooseButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", height: "34px", padding: "0 12px", borderRadius: "6px", background: "#111827", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "12px" },
  mediaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" },
  mediaItem: { position: "relative" },
  mediaThumb: { width: "100%", height: "80px", borderRadius: "6px", backgroundColor: "#eef1f3", backgroundSize: "cover", backgroundPosition: "center", border: "1px solid #e5e7eb" },
  mediaDeleteButton: { position: "absolute", top: "4px", right: "4px", width: "24px", height: "24px", border: "1px solid #d7dee7", borderRadius: "5px", background: "#fff", fontSize: "11px", cursor: "pointer" },
  secondaryButton: { height: "38px", padding: "0 16px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#fff", color: "#344054", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
};
