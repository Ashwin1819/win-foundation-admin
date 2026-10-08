"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";

type Photo = {
  id: number;
  image: string;
  caption: string | null;
  order: number;
};

type Album = {
  id: number;
  title: string;
  coverImage: string;
  eventDate: string | null;
  isActive: boolean;
  photos?: Photo[];
};

type Video = {
  id: number;
  title: string;
  youtubeUrl: string;
  thumbnail: string | null;
  isActive: boolean;
};

type AlbumForm = {
  title: string;
  coverImage: string;
  eventDate: string;
  isActive: boolean;
};

type VideoForm = {
  title: string;
  youtubeUrl: string;
  thumbnail: string;
  isActive: boolean;
};

const emptyAlbumForm: AlbumForm = { title: "", coverImage: "", eventDate: "", isActive: true };
const emptyVideoForm: VideoForm = { title: "", youtubeUrl: "", thumbnail: "", isActive: true };

export default function GalleryPage() {
  // Albums state
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [deletingAlbumId, setDeletingAlbumId] = useState<number | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<number | null>(null);
  const [showAlbumForm, setShowAlbumForm] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<number | null>(null);
  const [albumForm, setAlbumForm] = useState<AlbumForm>(emptyAlbumForm);
  const [albumMessage, setAlbumMessage] = useState("");

  // Videos state
  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [savingVideo, setSavingVideo] = useState(false);
  const [deletingVideoId, setDeletingVideoId] = useState<number | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [videoForm, setVideoForm] = useState<VideoForm>(emptyVideoForm);
  const [videoMessage, setVideoMessage] = useState("");

  const fetchAlbums = useCallback(async () => {
    try {
      setLoadingAlbums(true);
      const response = await fetch("/api/gallery/albums", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch albums");
      setAlbums(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load albums:", error);
    } finally {
      setLoadingAlbums(false);
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      setLoadingVideos(true);
      const response = await fetch("/api/gallery/videos", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to fetch videos");
      setVideos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load videos:", error);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    void fetchAlbums();
    void fetchVideos();
  }, [fetchAlbums, fetchVideos]);

  const editingAlbum = editingAlbumId ? albums.find((a) => a.id === editingAlbumId) ?? null : null;

  /* ---------------- ALBUMS ---------------- */

  function openAddAlbum() {
    setEditingAlbumId(null);
    setAlbumForm({ ...emptyAlbumForm });
    setAlbumMessage("");
    setShowAlbumForm(true);
  }

  function openEditAlbum(album: Album) {
    setEditingAlbumId(album.id);
    setAlbumForm({
      title: album.title,
      coverImage: album.coverImage,
      eventDate: album.eventDate ? album.eventDate.slice(0, 10) : "",
      isActive: album.isActive,
    });
    setAlbumMessage("");
    setShowAlbumForm(true);
  }

  function closeAlbumForm() {
    if (savingAlbum) return;
    setShowAlbumForm(false);
    setEditingAlbumId(null);
    setAlbumForm({ ...emptyAlbumForm });
    setAlbumMessage("");
  }

  async function saveAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlbumMessage("");

    if (!albumForm.title.trim() || !albumForm.coverImage.trim()) {
      setAlbumMessage("Title and cover image are required.");
      return;
    }

    try {
      setSavingAlbum(true);

      const payload = {
        title: albumForm.title.trim(),
        coverImage: albumForm.coverImage.trim(),
        eventDate: albumForm.eventDate || undefined,
        isActive: albumForm.isActive,
      };

      const response = await fetch("/api/gallery/albums", {
        method: editingAlbumId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingAlbumId ? { id: editingAlbumId, ...payload } : payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save album");

      await fetchAlbums();

      if (!editingAlbumId) {
        setEditingAlbumId(data.id);
      }

      alert(editingAlbumId ? "Album updated." : "Album created. You can now add photos below.");
    } catch (error) {
      console.error("Save album error:", error);
      setAlbumMessage(error instanceof Error ? error.message : "Failed to save album.");
    } finally {
      setSavingAlbum(false);
    }
  }

  async function deleteAlbum(album: Album) {
    if (!window.confirm(`Delete "${album.title}"? Its photos will be deleted too.`)) return;

    try {
      setDeletingAlbumId(album.id);
      const response = await fetch("/api/gallery/albums", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: album.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to delete album");
      setAlbums((current) => current.filter((a) => a.id !== album.id));
    } catch (error) {
      console.error("Delete album error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete album.");
    } finally {
      setDeletingAlbumId(null);
    }
  }

  async function uploadPhoto(file: File) {
    if (!editingAlbumId) return;

    if (!file.type.startsWith("image/")) {
      setAlbumMessage("Please choose an image file.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setAlbumMessage("");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("albumId", String(editingAlbumId));

      const response = await fetch("/api/gallery/albums/photos", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to upload photo");

      await fetchAlbums();
    } catch (error) {
      console.error("Photo upload error:", error);
      setAlbumMessage(error instanceof Error ? error.message : "Failed to upload photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function deletePhoto(photo: Photo) {
    if (!window.confirm("Remove this photo?")) return;

    try {
      setDeletingPhotoId(photo.id);
      const response = await fetch("/api/gallery/albums/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: photo.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to delete photo");
      await fetchAlbums();
    } catch (error) {
      console.error("Delete photo error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete photo.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  /* ---------------- VIDEOS ---------------- */

  function openAddVideo() {
    setEditingVideoId(null);
    setVideoForm({ ...emptyVideoForm });
    setVideoMessage("");
    setShowVideoForm(true);
  }

  function openEditVideo(video: Video) {
    setEditingVideoId(video.id);
    setVideoForm({
      title: video.title,
      youtubeUrl: video.youtubeUrl,
      thumbnail: video.thumbnail || "",
      isActive: video.isActive,
    });
    setVideoMessage("");
    setShowVideoForm(true);
  }

  function closeVideoForm() {
    if (savingVideo) return;
    setShowVideoForm(false);
    setEditingVideoId(null);
    setVideoForm({ ...emptyVideoForm });
    setVideoMessage("");
  }

  async function saveVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setVideoMessage("");

    if (!videoForm.title.trim() || !videoForm.youtubeUrl.trim()) {
      setVideoMessage("Title and YouTube URL are required.");
      return;
    }

    try {
      setSavingVideo(true);

      const payload = {
        title: videoForm.title.trim(),
        youtubeUrl: videoForm.youtubeUrl.trim(),
        thumbnail: videoForm.thumbnail.trim() || undefined,
        isActive: videoForm.isActive,
      };

      const response = await fetch("/api/gallery/videos", {
        method: editingVideoId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingVideoId ? { id: editingVideoId, ...payload } : payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to save video");

      await fetchVideos();
      closeVideoForm();
      alert(editingVideoId ? "Video updated." : "Video added.");
    } catch (error) {
      console.error("Save video error:", error);
      setVideoMessage(error instanceof Error ? error.message : "Failed to save video.");
    } finally {
      setSavingVideo(false);
    }
  }

  async function deleteVideo(video: Video) {
    if (!window.confirm(`Delete "${video.title}"?`)) return;

    try {
      setDeletingVideoId(video.id);
      const response = await fetch("/api/gallery/videos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: video.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Failed to delete video");
      setVideos((current) => current.filter((v) => v.id !== video.id));
    } catch (error) {
      console.error("Delete video error:", error);
      alert(error instanceof Error ? error.message : "Failed to delete video.");
    } finally {
      setDeletingVideoId(null);
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <main style={styles.page}>
      <h1 style={styles.pageTitle}>Gallery</h1>
      <p style={styles.pageSubtitle}>
        Manage photo albums and videos shown on the public Gallery page. These are
        two separate resources on the backend — an album holds its own photos, and
        videos are standalone.
      </p>

      {/* ALBUMS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Photo Albums</h2>
          <button type="button" onClick={openAddAlbum} style={styles.primaryButton}>
            + Add Album
          </button>
        </div>

        <div style={styles.card}>
          {loadingAlbums ? (
            <div style={styles.emptyState}>Loading albums...</div>
          ) : albums.length === 0 ? (
            <div style={styles.emptyState}>No albums yet.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Event Date</th>
                    <th style={styles.th}>Photos</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {albums.map((album) => (
                    <tr key={album.id}>
                      <td style={styles.td}>{album.title}</td>
                      <td style={styles.td}>
                        {album.eventDate ? new Date(album.eventDate).toLocaleDateString() : "—"}
                      </td>
                      <td style={styles.td}>{album.photos?.length ?? 0}</td>
                      <td style={styles.td}>
                        <span style={album.isActive ? styles.activeBadge : styles.inactiveBadge}>
                          {album.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button type="button" onClick={() => openEditAlbum(album)} style={styles.editButton}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteAlbum(album)}
                          disabled={deletingAlbumId === album.id}
                          style={styles.deleteButton}
                        >
                          {deletingAlbumId === album.id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* VIDEOS */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Videos</h2>
          <button type="button" onClick={openAddVideo} style={styles.primaryButton}>
            + Add Video
          </button>
        </div>

        <div style={styles.card}>
          {loadingVideos ? (
            <div style={styles.emptyState}>Loading videos...</div>
          ) : videos.length === 0 ? (
            <div style={styles.emptyState}>No videos yet.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>YouTube URL</th>
                    <th style={styles.th}>Status</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video) => (
                    <tr key={video.id}>
                      <td style={styles.td}>{video.title}</td>
                      <td style={styles.td}>
                        <a href={video.youtubeUrl} target="_blank" rel="noreferrer" style={styles.link}>
                          {video.youtubeUrl}
                        </a>
                      </td>
                      <td style={styles.td}>
                        <span style={video.isActive ? styles.activeBadge : styles.inactiveBadge}>
                          {video.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        <button type="button" onClick={() => openEditVideo(video)} style={styles.editButton}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVideo(video)}
                          disabled={deletingVideoId === video.id}
                          style={styles.deleteButton}
                        >
                          {deletingVideoId === video.id ? "..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ALBUM MODAL */}
      {showAlbumForm && (
        <div style={styles.modalOverlay} onMouseDown={(e) => e.target === e.currentTarget && !savingAlbum && closeAlbumForm()}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingAlbumId ? "Edit Album" : "Add Album"}</h2>
              <button type="button" onClick={closeAlbumForm} disabled={savingAlbum} style={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={saveAlbum}>
              <div style={styles.modalBody}>
                {albumMessage && <div style={styles.errorBox}>{albumMessage}</div>}

                <Field label="Title" required>
                  <input
                    value={albumForm.title}
                    onChange={(e) => setAlbumForm((f) => ({ ...f, title: e.target.value }))}
                    style={styles.input}
                  />
                </Field>

                <Field label="Cover Image URL" required>
                  <input
                    value={albumForm.coverImage}
                    onChange={(e) => setAlbumForm((f) => ({ ...f, coverImage: e.target.value }))}
                    style={styles.input}
                  />
                </Field>

                <div style={styles.formGrid}>
                  <Field label="Event Date">
                    <input
                      type="date"
                      value={albumForm.eventDate}
                      onChange={(e) => setAlbumForm((f) => ({ ...f, eventDate: e.target.value }))}
                      style={styles.input}
                    />
                  </Field>

                  <div style={styles.activeField}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={albumForm.isActive}
                        onChange={(e) => setAlbumForm((f) => ({ ...f, isActive: e.target.checked }))}
                      />
                      <span>Active</span>
                    </label>
                  </div>
                </div>

                {editingAlbumId && (
                  <Field label="Photos">
                    <div style={styles.mediaBox}>
                      <label style={styles.chooseButton}>
                        {uploadingPhoto ? "Uploading..." : "Add Photo"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingPhoto || savingAlbum}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void uploadPhoto(file);
                            event.currentTarget.value = "";
                          }}
                          style={{ display: "none" }}
                        />
                      </label>

                      {(editingAlbum?.photos?.length ?? 0) > 0 ? (
                        <div style={styles.mediaGrid}>
                          {editingAlbum!.photos!.map((photo) => (
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

                {!editingAlbumId && <span style={styles.helpText}>Save the album first, then add photos.</span>}
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeAlbumForm} disabled={savingAlbum} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={savingAlbum} style={styles.primaryButton}>
                  {savingAlbum ? "Saving..." : editingAlbumId ? "Save Changes" : "Add Album"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoForm && (
        <div style={styles.modalOverlay} onMouseDown={(e) => e.target === e.currentTarget && !savingVideo && closeVideoForm()}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>{editingVideoId ? "Edit Video" : "Add Video"}</h2>
              <button type="button" onClick={closeVideoForm} disabled={savingVideo} style={styles.closeButton}>
                ×
              </button>
            </div>

            <form onSubmit={saveVideo}>
              <div style={styles.modalBody}>
                {videoMessage && <div style={styles.errorBox}>{videoMessage}</div>}

                <Field label="Title" required>
                  <input
                    value={videoForm.title}
                    onChange={(e) => setVideoForm((f) => ({ ...f, title: e.target.value }))}
                    style={styles.input}
                  />
                </Field>

                <Field label="YouTube URL" required>
                  <input
                    value={videoForm.youtubeUrl}
                    onChange={(e) => setVideoForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={styles.input}
                  />
                </Field>

                <Field label="Thumbnail URL">
                  <input
                    value={videoForm.thumbnail}
                    onChange={(e) => setVideoForm((f) => ({ ...f, thumbnail: e.target.value }))}
                    style={styles.input}
                  />
                </Field>

                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={videoForm.isActive}
                    onChange={(e) => setVideoForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={closeVideoForm} disabled={savingVideo} style={styles.secondaryButton}>
                  Cancel
                </button>
                <button type="submit" disabled={savingVideo} style={styles.primaryButton}>
                  {savingVideo ? "Saving..." : editingVideoId ? "Save Changes" : "Add Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
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

const styles: Record<string, CSSProperties> = {
  page: { minHeight: "100vh", background: "#f7f9fc", padding: "32px 40px 50px" },
  pageTitle: { margin: 0, fontSize: "28px", fontWeight: 700, color: "#172033" },
  pageSubtitle: { margin: "8px 0 28px", fontSize: "14px", color: "#667085", maxWidth: "720px" },
  section: { marginBottom: "36px" },
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" },
  sectionTitle: { margin: 0, fontSize: "19px", fontWeight: 700, color: "#172033" },
  primaryButton: { height: "38px", padding: "0 16px", border: "none", borderRadius: "6px", background: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" },
  card: { background: "#fff", border: "1px solid #dfe4ec", borderRadius: "8px", overflow: "hidden" },
  emptyState: { padding: "40px 20px", textAlign: "center", color: "#667085" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", textAlign: "left", background: "#f8fafc", borderBottom: "1px solid #dfe4ec", fontSize: "13px", fontWeight: 700, color: "#344054" },
  td: { padding: "12px 16px", borderBottom: "1px solid #e5e7eb", fontSize: "14px", color: "#101828", verticalAlign: "middle" },
  link: { color: "#2563eb", fontSize: "13px", wordBreak: "break-all" },
  activeBadge: { padding: "4px 10px", borderRadius: "20px", background: "#ecfdf3", color: "#027a48", fontSize: "12px", fontWeight: 600 },
  inactiveBadge: { padding: "4px 10px", borderRadius: "20px", background: "#f2f4f7", color: "#667085", fontSize: "12px", fontWeight: 600 },
  editButton: { height: "32px", padding: "0 12px", marginRight: "6px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#fff", color: "#344054", fontSize: "13px", cursor: "pointer" },
  deleteButton: { height: "32px", padding: "0 12px", border: "1px solid #fecdca", borderRadius: "6px", background: "#fff5f4", color: "#b42318", fontSize: "13px", cursor: "pointer" },
  modalOverlay: { position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", background: "rgba(15,23,42,0.45)" },
  modal: { width: "100%", maxWidth: "700px", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: "10px" },
  modalHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, background: "#fff" },
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
  activeField: { display: "flex", alignItems: "flex-end" },
  checkboxLabel: { display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#344054", height: "38px", marginBottom: "18px" },
  mediaBox: { border: "1px solid #e4e7ec", borderRadius: "8px", padding: "12px", background: "#f8fafc" },
  chooseButton: { display: "inline-flex", alignItems: "center", justifyContent: "center", height: "34px", padding: "0 12px", borderRadius: "6px", background: "#111827", color: "#fff", fontSize: "12px", fontWeight: 700, cursor: "pointer", marginBottom: "12px" },
  mediaGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px" },
  mediaItem: { position: "relative" },
  mediaThumb: { width: "100%", height: "80px", borderRadius: "6px", backgroundColor: "#eef1f3", backgroundSize: "cover", backgroundPosition: "center", border: "1px solid #e5e7eb" },
  mediaDeleteButton: { position: "absolute", top: "4px", right: "4px", width: "24px", height: "24px", border: "1px solid #d7dee7", borderRadius: "5px", background: "#fff", fontSize: "11px", cursor: "pointer" },
  helpText: { color: "#98a2b3", fontSize: "12px" },
  secondaryButton: { height: "38px", padding: "0 16px", border: "1px solid #d0d5dd", borderRadius: "6px", background: "#fff", color: "#344054", fontSize: "14px", fontWeight: 600, cursor: "pointer" },
};
