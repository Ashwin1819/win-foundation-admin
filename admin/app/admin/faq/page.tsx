"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

type FAQ = {
  id: number;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type FormDataType = {
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
};

const emptyForm: FormDataType = {
  question: "",
  answer: "",
  order: 0,
  isActive: true,
};

export default function FAQPage() {
  const router = useRouter();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"ALL" | "ACTIVE" | "INACTIVE">(
      "ALL"
    );

  const [showModal, setShowModal] =
    useState(false);

  const [editingFAQ, setEditingFAQ] =
    useState<FAQ | null>(null);

  const [formData, setFormData] =
    useState<FormDataType>(emptyForm);

  /* =========================================================
     FETCH FAQS
  ========================================================= */

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/faq",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to fetch FAQs"
        );
      }

      setFaqs(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch FAQs:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    void fetchFAQs();
  }, [fetchFAQs]);

  /* =========================================================
     FILTER
  ========================================================= */

  const filteredFAQs = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return [...faqs]
      .filter((faq) => {
        const matchesSearch =
          !query ||
          faq.question
            .toLowerCase()
            .includes(query) ||
          faq.answer
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          (statusFilter === "ACTIVE" &&
            faq.isActive) ||
          (statusFilter === "INACTIVE" &&
            !faq.isActive);

        return (
          matchesSearch &&
          matchesStatus
        );
      })
      .sort(
        (a, b) =>
          a.order - b.order
      );
  }, [
    faqs,
    search,
    statusFilter,
  ]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const totalCount = faqs.length;

  const activeCount = faqs.filter(
    (faq) => faq.isActive
  ).length;

  const inactiveCount = faqs.filter(
    (faq) => !faq.isActive
  ).length;

  /* =========================================================
     MODAL
  ========================================================= */

  function openAddModal() {
    setEditingFAQ(null);

    setFormData({
      ...emptyForm,
      order: faqs.length + 1,
    });

    setShowModal(true);
  }

  function openEditModal(faq: FAQ) {
    setEditingFAQ(faq);

    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      isActive: faq.isActive,
    });

    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingFAQ(null);
    setFormData(emptyForm);
  }

  /* =========================================================
     FORM
  ========================================================= */

  function handleChange(
    event:
      React.ChangeEvent<
        HTMLInputElement |
          HTMLTextAreaElement |
          HTMLSelectElement
      >
  ) {
    const {
      name,
      value,
      type,
    } = event.target;

    setFormData((current) => ({
      ...current,
      [name]:
        type === "checkbox"
          ? (
              event.target as HTMLInputElement
            ).checked
          : name === "order"
            ? Number(value)
            : value,
    }));
  }

  /* =========================================================
     SAVE
  ========================================================= */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !formData.question.trim() ||
      !formData.answer.trim()
    ) {
      alert(
        "Question and answer are required."
      );
      return;
    }

    try {
      setSaving(true);

      
      const token =
        "cookie-auth";

      const method = editingFAQ
        ? "PUT"
        : "POST";

      const body = editingFAQ
        ? {
            id: editingFAQ.id,
            ...formData,
          }
        : formData;

      const response = await fetch(
        "/api/faq",
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Failed to save FAQ"
        );
        return;
      }

      if (editingFAQ) {
        setFaqs((current) =>
          current.map((faq) =>
            faq.id === editingFAQ.id
              ? data
              : faq
          )
        );
      } else {
        setFaqs((current) => [
          ...current,
          data,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error(
        "Save FAQ error:",
        error
      );

      alert("Failed to save FAQ.");
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function deleteFAQ(id: number) {
    const confirmed =
      window.confirm(
        "Delete this FAQ? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      
      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/faq",
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Failed to delete FAQ"
        );
        return;
      }

      setFaqs((current) =>
        current.filter(
          (faq) => faq.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete FAQ error:",
        error
      );

      alert("Failed to delete FAQ.");
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     TOGGLE STATUS
  ========================================================= */

  async function toggleStatus(
    faq: FAQ
  ) {
    try {
      
      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/faq",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: faq.id,
            isActive: !faq.isActive,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Failed to update FAQ"
        );
        return;
      }

      setFaqs((current) =>
        current.map((item) =>
          item.id === faq.id
            ? data
            : item
        )
      );
    } catch (error) {
      console.error(
        "Toggle FAQ error:",
        error
      );

      alert(
        "Failed to update FAQ."
      );
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          Loading FAQs...
        </div>
      </main>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main style={pageStyle}>
      {/* HEADER */}

      <div style={headerStyle}>
        <div>
          <div style={breadcrumbStyle}>
            Connect With Us / FAQ
          </div>

          <h1 style={titleStyle}>
            FAQ
          </h1>

          <p style={subtitleStyle}>
            Manage frequently asked
            questions displayed on the
            website.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "9px",
          }}
        >
          <button
            type="button"
            onClick={() =>
              void fetchFAQs()
            }
            style={refreshButtonStyle}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            style={addButtonStyle}
          >
            + Add FAQ
          </button>
        </div>
      </div>

      {/* STATS */}

      <div style={statsGridStyle}>
        <StatCard
          label="Total FAQs"
          value={totalCount}
          icon="?"
        />

        <StatCard
          label="Active"
          value={activeCount}
          icon="✓"
          accent="#027a48"
        />

        <StatCard
          label="Inactive"
          value={inactiveCount}
          icon="×"
          accent="#b42318"
        />
      </div>

      {/* FILTER */}

      <div style={filterCardStyle}>
        <div style={searchWrapperStyle}>
          <span style={searchIconStyle}>
            ⌕
          </span>

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search questions, answers, categories..."
            style={searchInputStyle}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | "ACTIVE"
                | "INACTIVE"
            )
          }
          style={selectStyle}
        >
          <option value="ALL">
            All Status
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="INACTIVE">
            Inactive
          </option>
        </select>
      </div>

      {/* TABLE */}

      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h2 style={tableTitleStyle}>
              Frequently Asked Questions
            </h2>

            <p style={tableSubtitleStyle}>
              {filteredFAQs.length}{" "}
              FAQ
              {filteredFAQs.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        {filteredFAQs.length ===
        0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>
              ?
            </div>

            <h3 style={emptyTitleStyle}>
              No FAQs found
            </h3>

            <p style={emptyTextStyle}>
              Add your first frequently
              asked question using the
              Add FAQ button.
            </p>

            <button
              type="button"
              onClick={openAddModal}
              style={emptyAddButtonStyle}
            >
              + Add FAQ
            </button>
          </div>
        ) : (
          <div
            style={{
              overflowX: "auto",
            }}
          >
            <table
              style={tableStyle}
            >
              <thead>
                <tr>
                  <th style={thStyle}>
                    Order
                  </th>

                  <th style={thStyle}>
                    Question
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th
                    style={{
                      ...thStyle,
                      textAlign: "right",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredFAQs.map(
                  (faq) => (
                    <tr
                      key={faq.id}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          width: "70px",
                        }}
                      >
                        <span
                          style={
                            orderBadgeStyle
                          }
                        >
                          {faq.order}
                        </span>
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <div
                          style={
                            questionStyle
                          }
                        >
                          {faq.question}
                        </div>

                        <div
                          style={
                            answerPreviewStyle
                          }
                        >
                          {faq.answer}
                        </div>
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            void toggleStatus(
                              faq
                            )
                          }
                          style={{
                            ...statusBadgeStyle,
                            ...(faq.isActive
                              ? activeStyle
                              : inactiveStyle),
                          }}
                        >
                          {faq.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign:
                            "right",
                        }}
                      >
                        <div
                          style={
                            actionGroupStyle
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                faq
                              )
                            }
                            style={
                              editButtonStyle
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deleteFAQ(
                                faq.id
                              )
                            }
                            disabled={
                              deletingId ===
                              faq.id
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            {deletingId ===
                            faq.id
                              ? "..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}

      {showModal && (
        <div
          style={overlayStyle}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div style={modalStyle}>
            <div
              style={
                modalHeaderStyle
              }
            >
              <div>
                <div
                  style={
                    modalEyebrowStyle
                  }
                >
                  {editingFAQ
                    ? "EDIT FAQ"
                    : "NEW FAQ"}
                </div>

                <h2
                  style={
                    modalTitleStyle
                  }
                >
                  {editingFAQ
                    ? "Edit Frequently Asked Question"
                    : "Add Frequently Asked Question"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                style={
                  closeButtonStyle
                }
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
            >
              <div
                style={
                  formBodyStyle
                }
              >
                <label
                  style={labelStyle}
                >
                  Question *
                </label>

                <input
                  name="question"
                  value={
                    formData.question
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter the frequently asked question"
                  style={
                    inputStyle
                  }
                  required
                />

                <label
                  style={labelStyle}
                >
                  Answer *
                </label>

                <textarea
                  name="answer"
                  value={
                    formData.answer
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="Enter the answer"
                  rows={7}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
                  required
                />

                <div
                  style={
                    twoColumnStyle
                  }
                >
                  <div>
                    <label
                      style={
                        labelStyle
                      }
                    >
                      Display Order
                    </label>

                    <input
                      name="order"
                      type="number"
                      min="0"
                      value={
                        formData.order
                      }
                      onChange={
                        handleChange
                      }
                      style={
                        inputStyle
                      }
                    />
                  </div>
                </div>

                <label
                  style={
                    checkboxRowStyle
                  }
                >
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={
                      formData.isActive
                    }
                    onChange={
                      handleChange
                    }
                  />

                  <span>
                    Show this FAQ on
                    the website
                  </span>
                </label>
              </div>

              <div
                style={
                  modalFooterStyle
                }
              >
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  style={
                    secondaryButtonStyle
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={
                    primaryButtonStyle
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingFAQ
                      ? "Save Changes"
                      : "Add FAQ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* =========================================================
   COMPONENTS
========================================================= */

function StatCard({
  label,
  value,
  icon,
  accent = "#344054",
}: {
  label: string;
  value: number;
  icon: string;
  accent?: string;
}) {
  return (
    <div style={statCardStyle}>
      <div
        style={{
          ...statIconStyle,
          color: accent,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={statLabelStyle}>
          {label}
        </div>

        <div
          style={{
            ...statValueStyle,
            color: accent,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px 30px 50px",
  background: "#f7f8fc",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  color: "#101828",
};

const loadingStyle: CSSProperties = {
  minHeight: "70vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#667085",
  fontSize: "15px",
};

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const breadcrumbStyle: CSSProperties = {
  color: "#667085",
  fontSize: "12px",
  marginBottom: "7px",
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: "26px",
  fontWeight: 700,
  letterSpacing: "-0.4px",
};

const subtitleStyle: CSSProperties = {
  margin: "7px 0 0",
  color: "#667085",
  fontSize: "14px",
};

const refreshButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "8px",
  padding: "10px 14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const addButtonStyle: CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "10px 15px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(3, minmax(0, 1fr))",
  gap: "14px",
  marginBottom: "18px",
};

const statCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  padding: "17px",
  display: "flex",
  alignItems: "center",
  gap: "13px",
};

const statIconStyle: CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "9px",
  background: "#f2f4f7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
  fontWeight: 700,
};

const statLabelStyle: CSSProperties = {
  color: "#667085",
  fontSize: "12px",
  marginBottom: "4px",
};

const statValueStyle: CSSProperties = {
  fontSize: "23px",
  fontWeight: 700,
};

const filterCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  padding: "14px",
  display: "flex",
  gap: "10px",
  alignItems: "center",
  marginBottom: "18px",
};

const searchWrapperStyle: CSSProperties = {
  position: "relative",
  flex: 1,
};

const searchIconStyle: CSSProperties = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  color: "#98a2b3",
  fontSize: "17px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  padding: "10px 12px 10px 36px",
  fontSize: "13px",
  outline: "none",
  color: "#101828",
};

const selectStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  background: "#ffffff",
  padding: "10px 32px 10px 12px",
  fontSize: "13px",
  color: "#344054",
  minWidth: "145px",
  cursor: "pointer",
};

const tableCardStyle: CSSProperties = {
  background: "#ffffff",
  border: "1px solid #eaecf0",
  borderRadius: "10px",
  overflow: "hidden",
};

const tableHeaderStyle: CSSProperties = {
  padding: "18px 20px",
  borderBottom: "1px solid #eaecf0",
};

const tableTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "16px",
  fontWeight: 700,
};

const tableSubtitleStyle: CSSProperties = {
  margin: "4px 0 0",
  fontSize: "12px",
  color: "#667085",
};

const tableStyle: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13px",
};

const thStyle: CSSProperties = {
  padding: "12px 16px",
  textAlign: "left",
  background: "#f9fafb",
  color: "#667085",
  fontSize: "11px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.3px",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 16px",
  borderTop: "1px solid #f2f4f7",
  verticalAlign: "middle",
  color: "#344054",
};

const orderBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "27px",
  height: "27px",
  borderRadius: "7px",
  background: "#f2f4f7",
  color: "#344054",
  fontSize: "12px",
  fontWeight: 700,
};

const questionStyle: CSSProperties = {
  color: "#101828",
  fontWeight: 600,
  lineHeight: 1.4,
  maxWidth: "600px",
};

const answerPreviewStyle: CSSProperties = {
  color: "#667085",
  fontSize: "11px",
  marginTop: "4px",
  maxWidth: "600px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const categoryBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "5px 9px",
  borderRadius: "999px",
  background: "#f2f4f7",
  color: "#344054",
  fontSize: "11px",
  fontWeight: 600,
};

const mutedStyle: CSSProperties = {
  color: "#98a2b3",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "11px",
  fontWeight: 600,
  cursor: "pointer",
};

const activeStyle: CSSProperties = {
  background: "#ecfdf3",
  color: "#027a48",
  border: "1px solid #abefc6",
};

const inactiveStyle: CSSProperties = {
  background: "#fef3f2",
  color: "#b42318",
  border: "1px solid #fecdca",
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

const emptyStateStyle: CSSProperties = {
  padding: "65px 20px",
  textAlign: "center",
};

const emptyIconStyle: CSSProperties = {
  width: "58px",
  height: "58px",
  borderRadius: "14px",
  background: "#f2f4f7",
  color: "#667085",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 14px",
  fontWeight: 700,
  fontSize: "22px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  color: "#344054",
};

const emptyTextStyle: CSSProperties = {
  margin: "6px auto 16px",
  maxWidth: "430px",
  fontSize: "13px",
  lineHeight: 1.6,
  color: "#667085",
};

const emptyAddButtonStyle: CSSProperties = {
  border: "none",
  background: "#101828",
  color: "#ffffff",
  borderRadius: "7px",
  padding: "9px 14px",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1000,
  background:
    "rgba(16, 24, 40, 0.48)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const modalStyle: CSSProperties = {
  width: "100%",
  maxWidth: "680px",
  maxHeight: "90vh",
  overflowY: "auto",
  background: "#ffffff",
  borderRadius: "12px",
  boxShadow:
    "0 20px 50px rgba(16, 24, 40, 0.2)",
};

const modalHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  padding: "20px 22px",
  borderBottom: "1px solid #eaecf0",
};

const modalEyebrowStyle: CSSProperties = {
  color: "#667085",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.8px",
  marginBottom: "5px",
};

const modalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "18px",
  fontWeight: 700,
  color: "#101828",
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

const twoColumnStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) minmax(0, 1fr)",
  gap: "14px",
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