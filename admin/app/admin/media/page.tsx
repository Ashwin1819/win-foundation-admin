"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type MediaItem = {
  id: string;
  imageUrl: string;
  title: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

export default function MediaPage() {
  const router = useRouter();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedFiles, setSelectedFiles] = useState<File[]>(
    []
  );

  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest"
  >("newest");

  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(
    null
  );

  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(
    null
  );

  const [page, setPage] = useState(1);

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/media?sort=${sortOrder}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to load media"
        );
      }

      setMedia(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch media error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load media."
      );
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    void fetchMedia();
  }, [fetchMedia]);

  const totalPages = Math.max(
    1,
    Math.ceil(media.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedMedia = useMemo(() => {
    const start =
      (currentPage - 1) * PAGE_SIZE;

    return media.slice(
      start,
      start + PAGE_SIZE
    );
  }, [media, currentPage]);

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files || []
    );

    setSelectedFiles(files);
  }

  async function uploadMedia() {
    if (selectedFiles.length === 0) {
      alert("Please select at least one image.");
      return;
    }

    
    try {
      setUploading(true);

      const token =
        "cookie-auth";

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch(
        "/api/media",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to upload media"
        );
      }

      setSelectedFiles([]);
      setPage(1);

      const fileInput =
        document.getElementById(
          "media-file-input"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchMedia();

      alert("Images uploaded successfully.");
    } catch (error) {
      console.error(
        "Upload media error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload images."
      );
    } finally {
      setUploading(false);
    }
  }

  function startEditing(item: MediaItem) {
    setEditingId(item.id);
    setEditTitle(item.title || "");
    setEditCaption(item.caption || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditTitle("");
    setEditCaption("");
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    
    try {
      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/media",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: editingId,
            title: editTitle,
            caption: editCaption,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update media"
        );
      }

      setMedia((current) =>
        current.map((item) =>
          item.id === editingId
            ? {
                ...item,
                title:
                  editTitle.trim() || null,
                caption:
                  editCaption.trim() || null,
              }
            : item
        )
      );

      cancelEditing();
    } catch (error) {
      console.error(
        "Update media error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update media."
      );
    }
  }

  async function deleteMedia(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );

    if (!confirmed) {
      return;
    }

    
    try {
      setDeletingId(id);

      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/media",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete media"
        );
      }

      const remainingCount =
        media.length - 1;

      const newTotalPages = Math.max(
        1,
        Math.ceil(
          remainingCount / PAGE_SIZE
        )
      );

      if (page > newTotalPages) {
        setPage(newTotalPages);
      }

      setMedia((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete media error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete media."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "28px 24px 50px",
        color: "#182235",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 700,
            color: "#182235",
          }}
        >
          Media
        </h1>

        <p
          style={{
            margin: "12px 0 0",
            fontSize: 16,
            color: "#64748b",
          }}
        >
          Upload and manage media images.
        </p>

        {/* UPLOAD BOX */}

        <div
          style={{
            marginTop: 30,
            padding: 18,
            border: "1px solid #dbe2ea",
            borderRadius: 8,
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Select images (multiple)
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <label
              htmlFor="media-file-input"
              style={{
                display: "inline-flex",
                alignItems: "center",
                height: 42,
                padding: "0 16px",
                border: "1px solid #d7dee7",
                borderRadius: 5,
                background: "#ffffff",
                color: "#334155",
                fontSize: 16,
                cursor: "pointer",
              }}
            >
              Choose Files
            </label>

            <input
              id="media-file-input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              onChange={handleFileChange}
              style={{
                display: "none",
              }}
            />

            <span
              style={{
                color: "#64748b",
                fontSize: 16,
              }}
            >
              {selectedFiles.length === 0
                ? "No file chosen"
                : `${selectedFiles.length} file${
                    selectedFiles.length === 1
                      ? ""
                      : "s"
                  } selected`}
            </span>

            <button
              type="button"
              onClick={uploadMedia}
              disabled={
                uploading ||
                selectedFiles.length === 0
              }
              style={{
                height: 44,
                padding: "0 18px",
                border: "none",
                borderRadius: 5,
                background: "#111827",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 600,
                cursor:
                  uploading ||
                  selectedFiles.length === 0
                    ? "default"
                    : "pointer",
                opacity:
                  uploading ||
                  selectedFiles.length === 0
                    ? 0.5
                    : 1,
              }}
            >
              {uploading
                ? "Uploading..."
                : "Upload"}
            </button>
          </div>
        </div>

        {/* SORT */}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 40,
          }}
        >
          <select
            value="date"
            onChange={() => undefined}
            style={selectStyle(196)}
          >
            <option value="date">
              Date
            </option>
          </select>

          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(
                event.target.value as
                  | "newest"
                  | "oldest"
              );
              setPage(1);
            }}
            style={selectStyle(148)}
          >
            <option value="newest">
              Newest first
            </option>

            <option value="oldest">
              Oldest first
            </option>
          </select>
        </div>

        {/* CONTENT */}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 70,
              color: "#64748b",
            }}
          >
            Loading media...
          </div>
        ) : media.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 70,
              color: "#64748b",
            }}
          >
            No media yet.
          </div>
        ) : (
          <>
            {/* TABLE */}

            <div
              style={{
                marginTop: 30,
                border:
                  "1px solid #dbe2ea",
                borderRadius: 8,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
                    minWidth: 850,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background:
                          "#f8fafc",
                        borderBottom:
                          "1px solid #dbe2ea",
                      }}
                    >
                      <th style={thStyle}>
                        Image
                      </th>

                      <th style={thStyle}>
                        Title (headline)
                      </th>

                      <th style={thStyle}>
                        Caption
                      </th>

                      <th style={thStyle}>
                        Date
                      </th>

                      <th style={thStyle}>
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedMedia.map(
                      (item) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom:
                              "1px solid #dbe2ea",
                          }}
                        >
                          {/* IMAGE */}

                          <td
                            style={{
                              ...tdStyle,
                              width: 250,
                            }}
                          >
                            <Image
                              src={item.imageUrl}
                              alt={
                                item.title ||
                                "Media"
                              }
                              width={90}
                              height={66}
                              unoptimized
                              style={{
                                width: 90,
                                height: 66,
                                objectFit:
                                  "cover",
                                borderRadius: 5,
                                border:
                                  "1px solid #e2e8f0",
                                display:
                                  "block",
                              }}
                            />
                          </td>

                          {/* TITLE */}

                          <td
                            style={{
                              ...tdStyle,
                              minWidth: 220,
                            }}
                          >
                            {editingId ===
                            item.id ? (
                              <input
                                type="text"
                                value={
                                  editTitle
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditTitle(
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Title"
                                style={
                                  inputStyle
                                }
                              />
                            ) : (
                              item.title ||
                              "—"
                            )}
                          </td>

                          {/* CAPTION */}

                          <td
                            style={{
                              ...tdStyle,
                              minWidth: 220,
                            }}
                          >
                            {editingId ===
                            item.id ? (
                              <input
                                type="text"
                                value={
                                  editCaption
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditCaption(
                                    event.target
                                      .value
                                  )
                                }
                                placeholder="Caption"
                                style={
                                  inputStyle
                                }
                              />
                            ) : (
                              item.caption ||
                              "—"
                            )}
                          </td>

                          {/* DATE */}

                          <td style={tdStyle}>
                            {formatDate(
                              item.createdAt
                            )}
                          </td>

                          {/* ACTIONS */}

                          <td
                            style={{
                              ...tdStyle,
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            {editingId ===
                            item.id ? (
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 8,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={
                                    saveEdit
                                  }
                                  style={
                                    actionButtonStyle
                                  }
                                >
                                  Save
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    cancelEditing
                                  }
                                  style={
                                    actionButtonStyle
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display:
                                    "flex",
                                  gap: 8,
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    startEditing(
                                      item
                                    )
                                  }
                                  style={
                                    actionButtonStyle
                                  }
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteMedia(
                                      item.id
                                    )
                                  }
                                  disabled={
                                    deletingId ===
                                    item.id
                                  }
                                  style={{
                                    ...deleteButtonStyle,
                                    opacity:
                                      deletingId ===
                                      item.id
                                        ? 0.5
                                        : 1,
                                  }}
                                >
                                  {deletingId ===
                                  item.id
                                    ? "..."
                                    : "🗑"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGINATION */}

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginTop: 18,
                color: "#64748b",
                fontSize: 14,
              }}
            >
              <span>
                Showing{" "}
                {(currentPage - 1) *
                  PAGE_SIZE +
                  1}{" "}
                to{" "}
                {Math.min(
                  currentPage * PAGE_SIZE,
                  media.length
                )}{" "}
                of {media.length} media
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.max(
                        1,
                        value - 1
                      )
                    )
                  }
                  style={paginationButtonStyle(
                    currentPage === 1
                  )}
                >
                  Previous
                </button>

                <span
                  style={{
                    minWidth: 60,
                    textAlign: "center",
                  }}
                >
                  Page {currentPage} of{" "}
                  {totalPages}
                </span>

                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setPage((value) =>
                      Math.min(
                        totalPages,
                        value + 1
                      )
                    )
                  }
                  style={paginationButtonStyle(
                    currentPage ===
                      totalPages
                  )}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

const thStyle: React.CSSProperties = {
  padding: "14px 18px",
  textAlign: "left",
  fontSize: 14,
  fontWeight: 600,
  color: "#334155",
};

const tdStyle: React.CSSProperties = {
  padding: "14px 18px",
  fontSize: 15,
  color: "#334155",
  verticalAlign: "middle",
};

function selectStyle(
  width: number
): React.CSSProperties {
  return {
    width,
    height: 46,
    padding: "0 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 5,
    background: "#ffffff",
    color: "#172033",
    fontSize: 16,
    outline: "none",
    cursor: "pointer",
  };
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 38,
  padding: "0 10px",
  border: "1px solid #cbd5e1",
  borderRadius: 5,
  background: "#ffffff",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};

const actionButtonStyle: React.CSSProperties = {
  height: 40,
  padding: "0 13px",
  border: "1px solid #d5dce5",
  borderRadius: 5,
  background: "#ffffff",
  color: "#334155",
  fontSize: 14,
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  width: 38,
  height: 40,
  border: "1px solid #d5dce5",
  borderRadius: 5,
  background: "#ffffff",
  color: "#475569",
  fontSize: 16,
  cursor: "pointer",
};

function paginationButtonStyle(
  disabled: boolean
): React.CSSProperties {
  return {
    height: 34,
    padding: "0 11px",
    border: "1px solid #cbd5e1",
    borderRadius: 5,
    background: "#ffffff",
    color: disabled
      ? "#94a3b8"
      : "#334155",
    fontSize: 13,
    cursor: disabled
      ? "default"
      : "pointer",
  };
}