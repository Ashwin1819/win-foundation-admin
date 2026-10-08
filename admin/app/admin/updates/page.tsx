"use client";

import { useEffect, useMemo, useState } from "react";

type UpdateItem = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage: string | null;
  publishedAt: string | null;
  isActive: boolean;
  sortOrder: number;
};

type FormData = {
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  featuredImage: string;
  publishedAt: string;
  isActive: boolean;
  sortOrder: string;
};

const emptyForm: FormData = {
  title: "",
  slug: "",
  shortDescription: "",
  content: "",
  featuredImage: "",
  publishedAt: "",
  isActive: true,
  sortOrder: "0",
};

export default function UpdatesPage() {
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  async function loadUpdates() {
    try {
      setLoading(true);

      const response = await fetch("/api/updates");

      if (!response.ok) {
        throw new Error("Failed to fetch updates");
      }

      const data = await response.json();
      setUpdates(data);
    } catch (error) {
      console.error("Load updates error:", error);
      setMessage("Failed to load updates");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadUpdates();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const totalUpdates = updates.length;

  const activeUpdates = updates.filter(
    (update) => update.isActive
  ).length;

  const inactiveUpdates = updates.filter(
    (update) => !update.isActive
  ).length;

  const filteredUpdates = useMemo(() => {
    const query = search.trim().toLowerCase();

    return updates
      .filter((update) => {
        if (statusFilter === "ACTIVE") {
          return update.isActive;
        }

        if (statusFilter === "INACTIVE") {
          return !update.isActive;
        }

        return true;
      })
      .filter((update) => {
        if (!query) return true;

        return (
          update.title.toLowerCase().includes(query) ||
          update.slug.toLowerCase().includes(query) ||
          update.shortDescription.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [updates, search, statusFilter]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((previous) => ({
        ...previous,
        [name]: checked,
      }));

      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openCreate() {
    setEditingId(null);
    setFormData(emptyForm);
    setMessage("");
    setShowForm(true);
  }

  function startEdit(update: UpdateItem) {
    setEditingId(update.id);

    setFormData({
      title: update.title,
      slug: update.slug,
      shortDescription: update.shortDescription,
      content: update.content,
      featuredImage: update.featuredImage || "",
      publishedAt: update.publishedAt
        ? update.publishedAt.substring(0, 10)
        : "",
      isActive: update.isActive,
      sortOrder: String(update.sortOrder),
    });

    setMessage("");
    setShowForm(true);
  }

  function cancelForm() {
    setEditingId(null);
    setFormData(emptyForm);
    setShowForm(false);
    setMessage("");
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      
      const token = "cookie-auth";

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        shortDescription: formData.shortDescription.trim(),
        content: formData.content.trim(),
        featuredImage: formData.featuredImage.trim(),

        publishedAt: formData.publishedAt
          ? `${formData.publishedAt}T00:00:00Z`
          : null,

        isActive: formData.isActive,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      const response = await fetch("/api/updates", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to save update"
        );
      }

      setMessage(
        editingId
          ? "Update edited successfully!"
          : "Update created successfully!"
      );

      setEditingId(null);
      setFormData(emptyForm);
      setShowForm(false);

      await loadUpdates();
    } catch (error) {
      console.error("Save update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to save update"
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(update: UpdateItem) {
    try {
      
      const token = "cookie-auth";

      const payload = {
        id: update.id,
        title: update.title,
        slug: update.slug,
        shortDescription: update.shortDescription,
        content: update.content,
        featuredImage: update.featuredImage,
        publishedAt: update.publishedAt,
        isActive: !update.isActive,
        sortOrder: update.sortOrder,
      };

      const response = await fetch("/api/updates", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to update status"
        );
      }

      setMessage(
        update.isActive
          ? "Update deactivated successfully."
          : "Update activated successfully."
      );

      await loadUpdates();
    } catch (error) {
      console.error("Toggle update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to update status"
      );
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this update?"
    );

    if (!confirmed) return;

    try {
      
      const token = "cookie-auth";

      const response = await fetch("/api/updates", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Failed to delete update"
        );
      }

      setMessage("Update deleted successfully!");

      await loadUpdates();
    } catch (error) {
      console.error("Delete update error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to delete update"
      );
    }
  }

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] px-5 py-8 text-[#10233f] md:px-8">
      <div className="mx-auto max-w-[1550px]">

        {/* Breadcrumb */}
        <div className="mb-3 text-sm text-[#71809a]">
          Administration
          <span className="mx-2">/</span>
          Content
          <span className="mx-2">/</span>
          Updates
        </div>

        {/* Header */}
        <div className="mb-7 flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#10233f] md:text-[34px]">
              Latest Updates
            </h1>

            <p className="mt-2 text-[15px] text-[#60718d]">
              Create and manage news, announcements and updates
              displayed on the WIN Foundations website.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(37,99,235,0.22)] transition hover:bg-[#1d4ed8]"
          >
            <span className="text-lg leading-none">+</span>
            Add Update
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-sm font-medium text-[#405575]">
              {message}
            </p>

            <button
              type="button"
              onClick={() => setMessage("")}
              className="text-xl text-[#8b99ad] hover:text-[#10233f]"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Updates"
            value={totalUpdates}
          />

          <StatCard
            label="Active"
            value={activeUpdates}
          />

          <StatCard
            label="Inactive"
            value={inactiveUpdates}
          />
        </div>

        {/* Updates List */}
        <section className="overflow-hidden rounded-xl border border-[#dfe7f1] bg-white shadow-[0_2px_8px_rgba(16,35,63,0.04)]">

          {/* List Header */}
          <div className="flex flex-col gap-4 border-b border-[#e8edf4] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
            <div>
              <h2 className="text-lg font-semibold text-[#10233f]">
                All Updates
              </h2>

              <p className="mt-1 text-xs text-[#8390a4]">
                {filteredUpdates.length} update
                {filteredUpdates.length !== 1 ? "s" : ""} shown
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">

              {/* Search */}
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#60718d]">
                  ⌕
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search updates..."
                  className="h-10 w-full rounded-lg border border-[#dce4ee] bg-white pl-9 pr-3 text-sm outline-none transition placeholder:text-[#9aa6b7] focus:border-[#2563eb] focus:ring-2 focus:ring-blue-50 sm:w-[280px]"
                />
              </div>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-10 rounded-lg border border-[#dce4ee] bg-white px-3 text-sm text-[#405575] outline-none focus:border-[#2563eb]"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-5">
            {loading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <div className="text-sm text-[#71809a]">
                  Loading updates...
                </div>
              </div>
            ) : filteredUpdates.length === 0 ? (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#d8e1ed] bg-[#fafcff] px-5 text-center">

                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#edf4ff] text-xl text-[#2563eb]">
                  +
                </div>

                <h3 className="text-base font-semibold text-[#243957]">
                  No updates found
                </h3>

                <p className="mt-1 max-w-md text-sm text-[#7c8aa0]">
                  {search || statusFilter !== "ALL"
                    ? "Try changing your search or status filter."
                    : "Create your first update to display it here."}
                </p>

                {!search && statusFilter === "ALL" && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-4 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
                  >
                    Add Update
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUpdates.map((update) => (
                  <div
                    key={update.id}
                    className="group rounded-xl border border-[#e0e7f0] bg-white p-4 transition hover:border-[#cbd8e8] hover:shadow-[0_5px_18px_rgba(16,35,63,0.06)] md:p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

                      {/* Image */}
                      <div className="flex h-[105px] w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#edf4ff] lg:w-[155px]">
                        {update.featuredImage ? (
                          <div
                            className="h-full w-full bg-cover bg-center bg-no-repeat"
                            style={{
                              backgroundImage: `url("${update.featuredImage}")`,
                            }}
                            role="img"
                            aria-label={update.title}
                          />
                        ) : (
                          <div className="text-3xl text-[#2563eb]">
                            ◉
                          </div>
                        )}
                      </div>

                      {/* Main Content */}
                      <div className="min-w-0 flex-1">

                        <div className="flex flex-wrap items-start gap-2">
                          <h3 className="text-[16px] font-semibold text-[#10233f]">
                            {update.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              update.isActive
                                ? "bg-[#eaf7ef] text-[#198754]"
                                : "bg-[#f1f3f6] text-[#71809a]"
                            }`}
                          >
                            {update.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-[#71809a]">
                          /updates/{update.slug}
                        </p>

                        <p className="mt-2 line-clamp-2 text-sm text-[#526783]">
                          {update.shortDescription}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#71809a]">

                          <span>
                            Published:{" "}
                            <strong className="text-[#344967]">
                              {formatDate(update.publishedAt)}
                            </strong>
                          </span>

                          <span>
                            Order:{" "}
                            <strong className="text-[#344967]">
                              {update.sortOrder}
                            </strong>
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-1 text-[11px] text-[#8996a9]">
                          {update.content}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex shrink-0 flex-col gap-2 lg:w-[130px]">

                        <button
                          type="button"
                          onClick={() => startEdit(update)}
                          className="h-9 rounded-lg border border-[#d9e2ed] bg-white px-4 text-xs font-semibold text-[#405575] transition hover:border-[#2563eb] hover:text-[#2563eb]"
                        >
                          ✎ &nbsp; Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleStatus(update)
                          }
                          className="h-9 rounded-lg border border-[#d8e4f4] bg-[#f2f7ff] px-4 text-xs font-semibold text-[#2563eb] transition hover:bg-[#e8f1ff]"
                        >
                          {update.isActive
                            ? "Deactivate"
                            : "Activate"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(update.id)
                          }
                          className="h-9 rounded-lg border border-[#ffdede] bg-[#fff8f8] px-4 text-xs font-semibold text-[#dc3545] transition hover:bg-[#fff0f0]"
                        >
                          🗑 &nbsp; Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10233f]/40 px-4 py-6 backdrop-blur-[2px]">

          <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#e6ebf2] px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-[#10233f]">
                  {editingId
                    ? "Edit Update"
                    : "Add New Update"}
                </h2>

                <p className="mt-1 text-xs text-[#7b899d]">
                  Add news or update information displayed on
                  the public website.
                </p>
              </div>

              <button
                type="button"
                onClick={cancelForm}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f4f6f9] text-xl text-[#71809a] hover:bg-[#e9edf3]"
              >
                ×
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(92vh-145px)] overflow-y-auto px-6 py-6">

              <form
                id="update-form"
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  <Field
                    label="Update Title"
                    required
                    className="md:col-span-2"
                  >
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Example: WIN Foundations distributes school kits"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Slug" required>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="win-foundation-distributes-school-kits"
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Featured Image URL">
                    <input
                      type="url"
                      name="featuredImage"
                      value={formData.featuredImage}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className={inputClass}
                    />
                  </Field>

                  <Field
                    label="Short Description"
                    required
                    className="md:col-span-2"
                  >
                    <textarea
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleChange}
                      placeholder="Short summary of the update"
                      required
                      rows={3}
                      className={textareaClass}
                    />
                  </Field>

                  <Field
                    label="Full Content"
                    required
                    className="md:col-span-2"
                  >
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Write the complete update content here..."
                      required
                      rows={8}
                      className={textareaClass}
                    />
                  </Field>

                  <Field label="Published Date">
                    <input
                      type="date"
                      name="publishedAt"
                      value={formData.publishedAt}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Display Order">
                    <input
                      type="number"
                      name="sortOrder"
                      value={formData.sortOrder}
                      onChange={handleChange}
                      min="0"
                      className={inputClass}
                    />
                  </Field>

                  <div className="flex items-center pt-2">
                    <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-[#405575]">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 accent-[#2563eb]"
                      />
                      Active Update
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-[#e6ebf2] bg-[#fbfcfe] px-6 py-4 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={cancelForm}
                className="rounded-lg border border-[#d9e2ed] bg-white px-5 py-2.5 text-sm font-semibold text-[#526783] hover:bg-[#f5f7fa]"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="update-form"
                disabled={saving}
                className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update"
                    : "Create Update"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* -------------------------------- */
/* Reusable UI pieces */
/* -------------------------------- */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-[#dfe7f1] bg-white px-5 py-5 shadow-[0_2px_8px_rgba(16,35,63,0.03)]">
      <p className="text-xs font-medium text-[#71809a]">
        {label}
      </p>

      <p className="mt-3 text-3xl font-bold tracking-tight text-[#10233f]">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  required,
  children,
  className = "",
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-[#405575]">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-[#d9e2ed] bg-white px-3.5 py-2.5 text-sm text-[#243957] outline-none transition placeholder:text-[#9aa6b7] focus:border-[#2563eb] focus:ring-3 focus:ring-blue-50";

const textareaClass =
  "w-full resize-y rounded-lg border border-[#d9e2ed] bg-white px-3.5 py-2.5 text-sm text-[#243957] outline-none transition placeholder:text-[#9aa6b7] focus:border-[#2563eb] focus:ring-3 focus:ring-blue-50";