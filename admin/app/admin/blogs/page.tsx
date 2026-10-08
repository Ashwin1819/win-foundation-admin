"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type Media = {
  id: number;
  type: "IMAGE" | "VIDEO";
  url: string | null;
  caption: string | null;
  order: number;
};

type Blog = {
  id: number;
  title: string;
  slug: string;
  category: string;
  coverImage: string;
  content: string;
  publishedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  media?: Media[];
};

type BlogForm = {
  title: string;
  slug: string;
  category: string;
  coverImage: string;
  content: string;
  publishedAt: string;
  isActive: boolean;
};

type SortField = "title" | "createdAt";
type SortDirection = "oldest" | "newest";

const emptyForm: BlogForm = {
  title: "",
  slug: "",
  category: "",
  coverImage: "",
  content: "",
  publishedAt: "",
  isActive: true,
};

export default function BlogsPage() {
  const router = useRouter();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deletingMediaId, setDeletingMediaId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("newest");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<BlogForm>({ ...emptyForm });

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const fetchBlogs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch("/api/blogs", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch blogs");
      }

      setBlogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load blogs:", error);
      alert(error instanceof Error ? error.message : "Failed to load blogs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBlogs();
  }, [fetchBlogs]);

  const editingBlog = useMemo(
    () => (editingId ? blogs.find((b) => b.id === editingId) ?? null : null),
    [blogs, editingId]
  );

  function openAddForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
    setShowForm(true);
  }

  function openEditForm(blog: Blog) {
    setEditingId(blog.id);
    setForm({
      title: blog.title,
      slug: blog.slug,
      category: blog.category,
      coverImage: blog.coverImage,
      content: blog.content,
      publishedAt: blog.publishedAt
        ? new Date(blog.publishedAt).toISOString().slice(0, 16)
        : "",
      isActive: blog.isActive,
    });
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm({ ...emptyForm });
    setMessage("");
  }

  function updateField<K extends keyof BlogForm>(
    field: K,
    value: BlogForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function createSlug(title: string) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleTitleChange(value: string) {
    setForm((current) => ({
      ...current,
      title: value,
      slug: editingId || current.slug ? current.slug : createSlug(value),
    }));
  }

  async function saveBlog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!form.title.trim()) {
      setMessage("Title is required.");
      return;
    }

    if (!form.slug.trim()) {
      setMessage("Slug is required.");
      return;
    }

    if (!form.category.trim()) {
      setMessage("Category is required.");
      return;
    }

    if (!form.coverImage.trim()) {
      setMessage("Cover image is required.");
      return;
    }

    if (!form.content.trim()) {
      setMessage("Content is required.");
      return;
    }

    try {
      
      setSaving(true);

      const token = "cookie-auth";

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        category: form.category.trim(),
        coverImage: form.coverImage.trim(),
        content: form.content.trim(),
        publishedAt: form.publishedAt
          ? new Date(form.publishedAt).toISOString()
          : undefined,
        isActive: form.isActive,
      };

      const response = await fetch("/api/blogs", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          editingId ? { id: editingId, ...payload } : payload
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to save blog");
      }

      await fetchBlogs();

      if (!editingId) {
        // Keep the form open on the newly-created blog so media can be attached
        // right away, instead of forcing a re-open from the table.
        setEditingId(data.id);
      }

      alert(
        editingId
          ? "Blog updated successfully."
          : "Blog created. You can now attach photos or videos below."
      );
    } catch (error) {
      console.error("Save blog error:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to save blog."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog(blog: Blog) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${blog.title}"? Its attached photos/videos will be deleted too.`
    );

    if (!confirmed) return;

    try {
      
      setDeletingId(blog.id);

      const token = "cookie-auth";

      const response = await fetch("/api/blogs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: blog.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to delete blog");
      }

      setBlogs((current) => current.filter((item) => item.id !== blog.id));
    } catch (error) {
      console.error("Delete blog error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete blog."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function uploadMedia(file: File) {
    if (!editingId) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "video/mp4",
      "video/webm",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please choose a JPG, PNG, WebP, GIF image or an MP4/WebM video.");
      return;
    }

    try {
      
      setUploadingMedia(true);
      setMessage("");

      const token = "cookie-auth";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("blogId", String(editingId));

      const response = await fetch("/api/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to upload media");
      }

      await fetchBlogs();
    } catch (error) {
      console.error("Media upload error:", error);
      setMessage(
        error instanceof Error ? error.message : "Failed to upload media."
      );
    } finally {
      setUploadingMedia(false);
    }
  }

  async function deleteMedia(media: Media) {
    const confirmed = window.confirm("Remove this photo/video from the blog?");
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

      await fetchBlogs();
    } catch (error) {
      console.error("Delete media error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to delete media."
      );
    } finally {
      setDeletingMediaId(null);
    }
  }

  const filteredBlogs = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    const result = blogs.filter((blog) => {
      const matchesSearch =
        !searchValue ||
        blog.title.toLowerCase().includes(searchValue) ||
        blog.slug.toLowerCase().includes(searchValue) ||
        blog.category.toLowerCase().includes(searchValue) ||
        blog.content.toLowerCase().includes(searchValue);

      return matchesSearch;
    });

    return [...result].sort((a, b) => {
      let comparison = 0;

      if (sortField === "title") {
        comparison = a.title.localeCompare(b.title);
      }

      if (sortField === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime();
      }

      return sortDirection === "oldest" ? comparison : -comparison;
    });
  }, [blogs, search, sortField, sortDirection]);

  return (
    <main style={mainStyle}>
      <div style={pageHeaderStyle}>
        <div>
          <div style={breadcrumbStyle}>Dashboard / Blogs</div>

          <h1 style={pageTitleStyle}>Blogs</h1>

          <p style={pageDescriptionStyle}>
            Manage blog posts, categories, cover images, publishing status and the
            photos/videos attached to each post.
          </p>
        </div>

        <button type="button" onClick={openAddForm} style={addButtonStyle}>
          <span style={addButtonIconStyle}>+</span>
          Add
        </button>
      </div>

      <div style={toolbarStyle}>
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle}>⌕</span>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search title, category, content..."
            style={searchInputStyle}
            aria-label="Search blogs"
          />
        </div>

        <div style={toolbarRightStyle}>
          <select
            value={sortField}
            onChange={(event) =>
              setSortField(event.target.value as SortField)
            }
            style={toolbarSelectStyle}
            aria-label="Sort blogs by"
          >
            <option value="createdAt">Date</option>
            <option value="title">Title</option>
          </select>

          <select
            value={sortDirection}
            onChange={(event) =>
              setSortDirection(event.target.value as SortDirection)
            }
            style={toolbarSelectStyle}
            aria-label="Sort direction"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
      </div>

      <section style={tableCardStyle}>
        <div style={tableScrollStyle}>
          <div style={tableHeaderStyle}>
            <div style={{ width: "40%" }}>Title</div>
            <div style={{ width: "20%" }}>Category</div>
            <div style={{ width: "18%" }}>Image</div>
            <div style={{ width: "12%" }}>Media</div>
            <div style={{ width: "10%", textAlign: "right" }}>Actions</div>
          </div>

          {loading ? (
            <div style={emptyStateStyle}>
              <div style={spinnerStyle}>⟳</div>
              <div style={emptyTitleStyle}>Loading blogs...</div>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={emptyStateStyle}>
              <div style={emptyIconStyle}>✎</div>

              <div style={emptyTitleStyle}>
                {blogs.length === 0 ? "No blogs yet" : "No matching blogs"}
              </div>

              <div style={emptyTextStyle}>
                {blogs.length === 0
                  ? "Create your first blog using the Add button."
                  : "Try changing your search options."}
              </div>

              {blogs.length === 0 && (
                <button
                  type="button"
                  onClick={openAddForm}
                  style={emptyButtonStyle}
                >
                  + Add Blog
                </button>
              )}
            </div>
          ) : (
            filteredBlogs.map((blog) => {
              const isDeleting = deletingId === blog.id;

              return (
                <div key={blog.id} style={referenceTableRowStyle}>
                  <div
                    style={{
                      width: "40%",
                      paddingRight: "20px",
                      minWidth: 0,
                    }}
                  >
                    <div style={referenceTitleStyle}>{blog.title}</div>
                  </div>

                  <div
                    style={{
                      width: "20%",
                      paddingRight: "20px",
                      minWidth: 0,
                    }}
                  >
                    <div style={referenceDescriptionStyle}>{blog.category}</div>
                  </div>

                  <div style={{ width: "18%" }}>
                    {blog.coverImage ? (
                      <div
                        style={{
                          ...referenceImageStyle,
                          backgroundImage: `url("${escapeCssUrl(
                            blog.coverImage
                          )}")`,
                        }}
                      />
                    ) : (
                      <div style={referenceImageStyle}>
                        <span style={noImageTextStyle}>—</span>
                      </div>
                    )}
                  </div>

                  <div style={{ width: "12%" }}>
                    <span style={referenceDescriptionStyle}>
                      {blog.media?.length ?? 0} item{(blog.media?.length ?? 0) === 1 ? "" : "s"}
                    </span>
                  </div>

                  <div
                    style={{
                      width: "10%",
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: "6px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => openEditForm(blog)}
                      style={referenceActionButtonStyle}
                      title="Edit"
                      aria-label={`Edit ${blog.title}`}
                    >
                      ✎
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteBlog(blog)}
                      disabled={isDeleting}
                      style={{
                        ...referenceActionButtonStyle,
                        color: "#475467",
                        opacity: isDeleting ? 0.5 : 1,
                      }}
                      title="Delete"
                      aria-label={`Delete ${blog.title}`}
                    >
                      {isDeleting ? "..." : "🗑"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <div style={referenceFooterStyle}>
        <div>
          Showing{" "}
          {filteredBlogs.length === 0 ? 0 : 1} to{" "}
          {filteredBlogs.length} of {filteredBlogs.length} blogs
        </div>

        <div style={paginationStyle}>
          <button type="button" disabled style={paginationDisabledStyle}>
            ‹ Previous
          </button>

          <button type="button" style={paginationCurrentStyle}>
            Page 1 of 1
          </button>

          <button type="button" disabled style={paginationDisabledStyle}>
            Next ›
          </button>
        </div>
      </div>

      {showForm && (
        <div
          style={modalOverlayStyle}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              closeForm();
            }
          }}
        >
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <div style={modalEyebrowStyle}>CONTENT MANAGEMENT</div>

                <h2 style={modalTitleStyle}>
                  {editingId ? "Edit Blog" : "Add Blog"}
                </h2>

                <p style={modalSubtitleStyle}>
                  Manage the information used by the public Blog page.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={closeModalButtonStyle}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={saveBlog}>
              <div style={modalBodyStyle}>
                {message && <div style={errorMessageStyle}>{message}</div>}

                <div style={formGridStyle}>
                  <FormField label="Title" required>
                    <input
                      value={form.title}
                      onChange={(event) =>
                        handleTitleChange(event.target.value)
                      }
                      placeholder="Education for Every Child"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Slug" required>
                    <input
                      value={form.slug}
                      onChange={(event) =>
                        updateField(
                          "slug",
                          event.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-\s]/g, "")
                            .replace(/\s+/g, "-")
                        )
                      }
                      placeholder="education-for-every-child"
                      style={inputStyle}
                    />

                    <span style={fieldHintStyle}>
                      Public URL: /blog/{form.slug || "your-slug"}
                    </span>
                  </FormField>
                </div>

                <div style={formGridStyle}>
                  <FormField label="Category" required>
                    <input
                      value={form.category}
                      onChange={(event) =>
                        updateField("category", event.target.value)
                      }
                      placeholder="updates"
                      style={inputStyle}
                    />
                  </FormField>

                  <FormField label="Publish Date">
                    <input
                      type="datetime-local"
                      value={form.publishedAt}
                      onChange={(event) =>
                        updateField("publishedAt", event.target.value)
                      }
                      style={inputStyle}
                    />
                  </FormField>
                </div>

                <FormField label="Cover Image URL" required>
                  <input
                    value={form.coverImage}
                    onChange={(event) =>
                      updateField("coverImage", event.target.value)
                    }
                    placeholder="/assets/blog-cover.jpg"
                    style={inputStyle}
                  />
                </FormField>

                {form.coverImage.trim() && (
                  <FormField label="Cover Image Preview">
                    <div
                      style={{
                        ...modalPreviewStyle,
                        backgroundImage: `url("${escapeCssUrl(
                          form.coverImage
                        )}")`,
                      }}
                    />
                  </FormField>
                )}

                <FormField label="Content" required>
                  <textarea
                    value={form.content}
                    onChange={(event) =>
                      updateField("content", event.target.value)
                    }
                    placeholder="Write the complete blog content here..."
                    rows={10}
                    style={textareaStyle}
                  />
                </FormField>

                <FormField label="Status">
                  <div style={statusControlStyle}>
                    <button
                      type="button"
                      onClick={() => updateField("isActive", !form.isActive)}
                      style={{
                        ...toggleStyle,
                        background: form.isActive ? "#2563eb" : "#cbd5e1",
                      }}
                      aria-label="Toggle blog status"
                    >
                      <span
                        style={{
                          ...toggleKnobStyle,
                          transform: form.isActive
                            ? "translateX(18px)"
                            : "translateX(0)",
                        }}
                      />
                    </button>

                    <span style={statusTextStyle}>
                      {form.isActive ? "Published" : "Draft"}
                    </span>
                  </div>
                </FormField>

                {editingId && (
                  <FormField label="Photos & Videos">
                    <div style={videoSourceBoxStyle}>
                      <div style={videoUploadRowStyle}>
                        <label style={videoChooseButtonStyle}>
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
                        <span style={fieldHintStyle}>
                          JPG, PNG, WebP, GIF, MP4 or WebM
                        </span>
                      </div>

                      {(editingBlog?.media?.length ?? 0) > 0 ? (
                        <div style={mediaGridStyle}>
                          {editingBlog!.media!.map((item) => (
                            <div key={item.id} style={mediaItemStyle}>
                              {item.type === "IMAGE" && item.url ? (
                                <div
                                  style={{
                                    ...mediaThumbStyle,
                                    backgroundImage: `url("${escapeCssUrl(item.url)}")`,
                                  }}
                                />
                              ) : (
                                <div style={mediaThumbStyle}>
                                  <span style={noImageTextStyle}>▶ video</span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteMedia(item)}
                                disabled={deletingMediaId === item.id}
                                style={mediaDeleteButtonStyle}
                                title="Remove"
                                aria-label="Remove media item"
                              >
                                {deletingMediaId === item.id ? "..." : "🗑"}
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span style={fieldHintStyle}>
                          No photos or videos attached yet.
                        </span>
                      )}
                    </div>
                  </FormField>
                )}

                {!editingId && (
                  <span style={fieldHintStyle}>
                    Save the blog first, then you can attach photos and videos to it.
                  </span>
                )}
              </div>

              <div style={modalFooterStyle}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...saveButtonStyle,
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? "not-allowed" : "pointer",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Blog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div style={formFieldStyle}>
      <label style={fieldLabelStyle}>
        {label}
        {required && <span style={requiredMarkStyle}>*</span>}
      </label>
      {children}
    </div>
  );
}

function escapeCssUrl(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

const mainStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: "28px 30px 35px",
  boxSizing: "border-box",
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
};

const breadcrumbStyle: CSSProperties = {
  fontSize: "10px",
  color: "#98a2b3",
  marginBottom: "6px",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "23px",
  fontWeight: 750,
  color: "#101828",
};

const pageDescriptionStyle: CSSProperties = {
  margin: "6px 0 0",
  maxWidth: "700px",
  fontSize: "14px",
  lineHeight: 1.5,
  color: "#667085",
};

const addButtonStyle: CSSProperties = {
  height: "34px",
  minWidth: "60px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  padding: "0 15px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const addButtonIconStyle: CSSProperties = {
  fontSize: "15px",
  lineHeight: 1,
};

const toolbarStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  marginBottom: "28px",
  flexWrap: "wrap",
};

const toolbarRightStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const searchWrapperStyle: CSSProperties = {
  flex: 1,
  minWidth: "260px",
  maxWidth: "520px",
  height: "46px",
  background: "#ffffff",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
  boxSizing: "border-box",
};

const searchIconStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "16px",
  marginRight: "7px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#344054",
  fontSize: "14px",
};

const toolbarSelectStyle: CSSProperties = {
  height: "46px",
  minWidth: "195px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  fontSize: "14px",
  padding: "0 14px",
  outline: "none",
  cursor: "pointer",
};

const tableCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #dfe5ec",
  borderRadius: "9px",
  overflow: "hidden",
};

const tableScrollStyle: CSSProperties = {
  minWidth: "950px",
};

const tableHeaderStyle: CSSProperties = {
  minHeight: "51px",
  display: "flex",
  alignItems: "center",
  padding: "0 18px",
  boxSizing: "border-box",
  background: "#f8fafc",
  borderBottom: "1px solid #dfe5ec",
  color: "#344054",
  fontSize: "14px",
  fontWeight: 700,
};

const referenceTableRowStyle: CSSProperties = {
  minHeight: "74px",
  display: "flex",
  alignItems: "center",
  padding: "0 18px",
  boxSizing: "border-box",
  borderBottom: "1px solid #e8edf2",
};

const referenceTitleStyle: CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#1d2939",
  lineHeight: 1.4,
};

const referenceDescriptionStyle: CSSProperties = {
  fontSize: "14px",
  lineHeight: 1.45,
  color: "#344054",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const referenceImageStyle: CSSProperties = {
  width: "54px",
  height: "40px",
  borderRadius: "5px",
  backgroundColor: "#eef1f3",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const referenceActionButtonStyle: CSSProperties = {
  width: "36px",
  height: "36px",
  border: "1px solid #d7dee7",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  fontSize: "16px",
  cursor: "pointer",
};

const noImageTextStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "10px",
};

const referenceFooterStyle: CSSProperties = {
  marginTop: "30px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  color: "#667085",
  fontSize: "14px",
};

const paginationStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

const paginationDisabledStyle: CSSProperties = {
  height: "44px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#f8fafc",
  color: "#98a2b3",
  padding: "0 14px",
  fontSize: "14px",
  fontWeight: 600,
};

const paginationCurrentStyle: CSSProperties = {
  height: "44px",
  border: "1px solid #dfe5ec",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#344054",
  padding: "0 14px",
  fontSize: "14px",
  fontWeight: 600,
};

const emptyStateStyle: CSSProperties = {
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "35px 20px",
};

const emptyIconStyle: CSSProperties = {
  width: "44px",
  height: "44px",
  borderRadius: "8px",
  background: "#eef4ff",
  color: "#2563eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "17px",
};

const emptyTitleStyle: CSSProperties = {
  marginTop: "11px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#344054",
};

const emptyTextStyle: CSSProperties = {
  maxWidth: "350px",
  margin: "5px auto 13px",
  color: "#98a2b3",
  fontSize: "9px",
  lineHeight: 1.5,
};

const emptyButtonStyle: CSSProperties = {
  height: "32px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  padding: "0 12px",
  fontSize: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

const spinnerStyle: CSSProperties = {
  fontSize: "24px",
  color: "#2563eb",
};

const modalOverlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "820px",
  maxHeight: "92vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "9px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 20px 60px rgba(15,23,42,0.18)",
};

const modalHeaderStyle: CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid #eaecf0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "15px",
};

const modalEyebrowStyle: CSSProperties = {
  fontSize: "8px",
  fontWeight: 800,
  letterSpacing: "0.8px",
  color: "#2563eb",
  marginBottom: "5px",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "17px",
  fontWeight: 750,
  color: "#101828",
};

const modalSubtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "9px",
  color: "#98a2b3",
};

const closeModalButtonStyle: CSSProperties = {
  width: "29px",
  height: "29px",
  border: "none",
  borderRadius: "5px",
  background: "#f2f4f7",
  color: "#667085",
  fontSize: "18px",
  cursor: "pointer",
};

const modalBodyStyle: CSSProperties = {
  padding: "19px 20px",
};

const formGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "13px",
};

const formFieldStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginBottom: "14px",
};

const fieldLabelStyle: CSSProperties = {
  fontSize: "9px",
  fontWeight: 700,
  color: "#344054",
};

const requiredMarkStyle: CSSProperties = {
  color: "#dc2626",
  marginLeft: "3px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  height: "37px",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  padding: "0 10px",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "10px",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  padding: "9px 10px",
  outline: "none",
  color: "#344054",
  background: "#ffffff",
  fontSize: "10px",
  lineHeight: 1.5,
  resize: "vertical",
};

const fieldHintStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "8px",
  lineHeight: 1.4,
};

const videoSourceBoxStyle: CSSProperties = {
  border: "1px solid #e4e7ec",
  borderRadius: "8px",
  padding: "12px",
  background: "#f8fafc",
};

const videoUploadRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
  marginBottom: "12px",
};

const videoChooseButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "34px",
  padding: "0 12px",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  fontSize: "9px",
  fontWeight: 700,
  cursor: "pointer",
};

const modalPreviewStyle: CSSProperties = {
  width: "100%",
  height: "145px",
  borderRadius: "6px",
  backgroundColor: "#eef1f3",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  border: "1px solid #e5e7eb",
};

const mediaGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
  gap: "10px",
};

const mediaItemStyle: CSSProperties = {
  position: "relative",
};

const mediaThumbStyle: CSSProperties = {
  width: "100%",
  height: "80px",
  borderRadius: "6px",
  backgroundColor: "#eef1f3",
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  border: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const mediaDeleteButtonStyle: CSSProperties = {
  position: "absolute",
  top: "4px",
  right: "4px",
  width: "24px",
  height: "24px",
  border: "1px solid #d7dee7",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  fontSize: "11px",
  cursor: "pointer",
};

const statusControlStyle: CSSProperties = {
  minHeight: "37px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const toggleStyle: CSSProperties = {
  width: "42px",
  height: "24px",
  padding: "3px",
  border: "none",
  borderRadius: "20px",
  cursor: "pointer",
};

const toggleKnobStyle: CSSProperties = {
  display: "block",
  width: "18px",
  height: "18px",
  borderRadius: "50%",
  background: "#ffffff",
  transition: "transform 0.2s",
};

const statusTextStyle: CSSProperties = {
  fontSize: "10px",
  color: "#667085",
};

const errorMessageStyle: CSSProperties = {
  marginBottom: "14px",
  padding: "9px 11px",
  borderRadius: "5px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  color: "#dc2626",
  fontSize: "9px",
};

const modalFooterStyle: CSSProperties = {
  padding: "12px 20px",
  borderTop: "1px solid #eaecf0",
  background: "#fafbfc",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const cancelButtonStyle: CSSProperties = {
  height: "34px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#ffffff",
  color: "#475467",
  padding: "0 14px",
  fontSize: "9px",
  fontWeight: 650,
  cursor: "pointer",
};

const saveButtonStyle: CSSProperties = {
  height: "34px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#ffffff",
  padding: "0 15px",
  fontSize: "9px",
  fontWeight: 700,
};
