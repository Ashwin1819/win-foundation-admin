"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";

type CVRequest = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  education: string | null;
  currentRole: string | null;
  experience: string | null;
  skills: string | null;
  careerObjective: string | null;
  cvType: string | null;
  additionalRequirements: string | null;
  existingCvUrl: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

type SortOrder = "NEWEST" | "OLDEST";

type FormDataType = {
  status: string;
  adminNotes: string;
};

const emptyForm: FormDataType = {
  status: "PENDING",
  adminNotes: "",
};

export default function CVBuildingPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [sortOrder, setSortOrder] =
    useState<SortOrder>("NEWEST");

  const [selectedRequest, setSelectedRequest] =
    useState<CVRequest | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showEdit, setShowEdit] =
    useState(false);

  const [formData, setFormData] =
    useState<FormDataType>(emptyForm);

  /* =========================================================
     LOAD REQUESTS
  ========================================================= */

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);

      
      const token = "cookie-auth";

      const response = await fetch(
        "/api/cv-requests",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to fetch CV requests"
        );
      }

      setRequests(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch CV requests:",
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
    void fetchRequests();
  }, [fetchRequests]);

  /* =========================================================
     FILTER + SORT
  ========================================================= */

  const filteredRequests = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const filtered = requests.filter(
      (request) => {
        const matchesSearch =
          !query ||
          request.name
            .toLowerCase()
            .includes(query) ||
          request.email
            .toLowerCase()
            .includes(query) ||
          (request.phone ?? "")
            .toLowerCase()
            .includes(query) ||
          (request.currentRole ?? "")
            .toLowerCase()
            .includes(query) ||
          (request.skills ?? "")
            .toLowerCase()
            .includes(query) ||
          (request.cvType ?? "")
            .toLowerCase()
            .includes(query);

        const matchesStatus =
          statusFilter === "ALL" ||
          request.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );

    return [...filtered].sort(
      (a, b) => {
        const first =
          new Date(a.createdAt).getTime();

        const second =
          new Date(b.createdAt).getTime();

        return sortOrder === "NEWEST"
          ? second - first
          : first - second;
      }
    );
  }, [
    requests,
    search,
    statusFilter,
    sortOrder,
  ]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const totalCount = requests.length;

  const pendingCount = requests.filter(
    (item) => item.status === "PENDING"
  ).length;

  const inProgressCount = requests.filter(
    (item) =>
      item.status === "IN_PROGRESS"
  ).length;

  const completedCount = requests.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const rejectedCount = requests.filter(
    (item) => item.status === "REJECTED"
  ).length;

  /* =========================================================
     VIEW
  ========================================================= */

  function openDetails(
    request: CVRequest
  ) {
    setSelectedRequest(request);
    setShowDetails(true);
  }

  /* =========================================================
     EDIT
  ========================================================= */

  function openEdit(
    request: CVRequest
  ) {
    setSelectedRequest(request);

    setFormData({
      status: request.status,
      adminNotes:
        request.adminNotes ?? "",
    });

    setShowEdit(true);
  }

  /* =========================================================
     UPDATE
  ========================================================= */

  async function handleUpdate() {
    if (!selectedRequest) {
      return;
    }

    try {
      setSaving(true);

      
      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/cv-requests",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: selectedRequest.id,
            status: formData.status,
            adminNotes:
              formData.adminNotes,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data?.error ||
            "Failed to update CV request"
        );
        return;
      }

      setRequests((current) =>
        current.map((item) =>
          item.id === selectedRequest.id
            ? data
            : item
        )
      );

      setSelectedRequest(data);
      setShowEdit(false);
    } catch (error) {
      console.error(
        "Update CV request error:",
        error
      );

      alert(
        "Failed to update CV request"
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     DELETE
  ========================================================= */

  async function deleteRequest(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Delete this CV request? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);

      
      const token =
        "cookie-auth";

      const response = await fetch(
        "/api/cv-requests",
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
            "Failed to delete CV request"
        );
        return;
      }

      setRequests((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      if (
        selectedRequest?.id === id
      ) {
        setSelectedRequest(null);
        setShowDetails(false);
        setShowEdit(false);
      }
    } catch (error) {
      console.error(
        "Delete CV request error:",
        error
      );

      alert(
        "Failed to delete CV request"
      );
    } finally {
      setDeletingId(null);
    }
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  function formatDate(
    value: string
  ) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatDateTime(
    value: string
  ) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  function getStatusLabel(
    status: string
  ) {
    switch (status) {
      case "IN_PROGRESS":
        return "In Progress";

      case "COMPLETED":
        return "Completed";

      case "REJECTED":
        return "Rejected";

      case "PENDING":
      default:
        return "Pending";
    }
  }

  function getStatusStyle(
    status: string
  ): CSSProperties {
    switch (status) {
      case "COMPLETED":
        return {
          background: "#ecfdf3",
          color: "#027a48",
        };

      case "IN_PROGRESS":
        return {
          background: "#eff8ff",
          color: "#175cd3",
        };

      case "REJECTED":
        return {
          background: "#fef3f2",
          color: "#b42318",
        };

      case "PENDING":
      default:
        return {
          background: "#fffaeb",
          color: "#b54708",
        };
    }
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={loadingStyle}>
          Loading CV requests...
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
            Connect With Us / CV Building
          </div>

          <h1 style={titleStyle}>
            CV Building
          </h1>

          <p style={subtitleStyle}>
            Manage CV building requests
            submitted by applicants.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void fetchRequests();
          }}
          style={refreshButtonStyle}
        >
          ↻ Refresh
        </button>
      </div>

      {/* STATS */}

      <div style={statsGridStyle}>
        <StatCard
          label="Total Requests"
          value={totalCount}
          icon="▦"
        />

        <StatCard
          label="Pending"
          value={pendingCount}
          icon="◷"
          accent="#b54708"
        />

        <StatCard
          label="In Progress"
          value={inProgressCount}
          icon="↻"
          accent="#175cd3"
        />

        <StatCard
          label="Completed"
          value={completedCount}
          icon="✓"
          accent="#027a48"
        />

        <StatCard
          label="Rejected"
          value={rejectedCount}
          icon="×"
          accent="#b42318"
        />
      </div>

      {/* FILTER BAR */}

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
            placeholder="Search by name, email, role, skills..."
            style={searchInputStyle}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as StatusFilter
            )
          }
          style={selectStyle}
        >
          <option value="ALL">
            All Status
          </option>
          <option value="PENDING">
            Pending
          </option>
          <option value="IN_PROGRESS">
            In Progress
          </option>
          <option value="COMPLETED">
            Completed
          </option>
          <option value="REJECTED">
            Rejected
          </option>
        </select>

        <select
          value={sortOrder}
          onChange={(event) =>
            setSortOrder(
              event.target.value as SortOrder
            )
          }
          style={selectStyle}
        >
          <option value="NEWEST">
            Newest First
          </option>
          <option value="OLDEST">
            Oldest First
          </option>
        </select>
      </div>

      {/* TABLE */}

      <div style={tableCardStyle}>
        <div style={tableHeaderStyle}>
          <div>
            <h2 style={tableTitleStyle}>
              CV Requests
            </h2>

            <p style={tableSubtitleStyle}>
              {filteredRequests.length}{" "}
              request
              {filteredRequests.length !==
              1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        {filteredRequests.length ===
        0 ? (
          <div style={emptyStateStyle}>
            <div style={emptyIconStyle}>
              CV
            </div>

            <h3 style={emptyTitleStyle}>
              No CV requests found
            </h3>

            <p style={emptyTextStyle}>
              CV building requests submitted
              through the website will
              appear here.
            </p>
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
                    Applicant
                  </th>

                  <th style={thStyle}>
                    Contact
                  </th>

                  <th style={thStyle}>
                    Education
                  </th>

                  <th style={thStyle}>
                    CV Type
                  </th>

                  <th style={thStyle}>
                    Status
                  </th>

                  <th style={thStyle}>
                    Date
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
                {filteredRequests.map(
                  (request) => (
                    <tr
                      key={request.id}
                      style={trStyle}
                    >
                      <td
                        style={tdStyle}
                      >
                        <div
                          style={
                            applicantNameStyle
                          }
                        >
                          {request.name}
                        </div>

                        {request.currentRole && (
                          <div
                            style={
                              secondaryTextStyle
                            }
                          >
                            {
                              request.currentRole
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <div>
                          {
                            request.email
                          }
                        </div>

                        {request.phone && (
                          <div
                            style={
                              secondaryTextStyle
                            }
                          >
                            {
                              request.phone
                            }
                          </div>
                        )}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {request.education ||
                          "—"}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {request.cvType ||
                          "—"}
                      </td>

                      <td
                        style={tdStyle}
                      >
                        <span
                          style={{
                            ...statusBadgeStyle,
                            ...getStatusStyle(
                              request.status
                            ),
                          }}
                        >
                          {getStatusLabel(
                            request.status
                          )}
                        </span>
                      </td>

                      <td
                        style={tdStyle}
                      >
                        {formatDate(
                          request.createdAt
                        )}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          textAlign: "right",
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
                              openDetails(
                                request
                              )
                            }
                            style={
                              viewButtonStyle
                            }
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                request
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
                              void deleteRequest(
                                request.id
                              )
                            }
                            disabled={
                              deletingId ===
                              request.id
                            }
                            style={
                              deleteButtonStyle
                            }
                          >
                            {deletingId ===
                            request.id
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

      {/* DETAILS MODAL */}

      {showDetails &&
        selectedRequest && (
          <div
            style={overlayStyle}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowDetails(false);
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
                    CV REQUEST
                  </div>

                  <h2
                    style={
                      modalTitleStyle
                    }
                  >
                    {
                      selectedRequest.name
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(false)
                  }
                  style={
                    closeButtonStyle
                  }
                >
                  ×
                </button>
              </div>

              <div
                style={
                  modalBodyStyle
                }
              >
                <DetailSection
                  title="Applicant Details"
                >
                  <DetailRow
                    label="Name"
                    value={
                      selectedRequest.name
                    }
                  />

                  <DetailRow
                    label="Email"
                    value={
                      selectedRequest.email
                    }
                  />

                  <DetailRow
                    label="Phone"
                    value={
                      selectedRequest.phone
                    }
                  />

                  <DetailRow
                    label="Education"
                    value={
                      selectedRequest.education
                    }
                  />

                  <DetailRow
                    label="Current Role"
                    value={
                      selectedRequest.currentRole
                    }
                  />

                  <DetailRow
                    label="Experience"
                    value={
                      selectedRequest.experience
                    }
                  />
                </DetailSection>

                <DetailSection
                  title="CV Requirements"
                >
                  <DetailRow
                    label="Skills"
                    value={
                      selectedRequest.skills
                    }
                  />

                  <DetailRow
                    label="CV Type"
                    value={
                      selectedRequest.cvType
                    }
                  />

                  <DetailRow
                    label="Career Objective"
                    value={
                      selectedRequest.careerObjective
                    }
                  />

                  <DetailRow
                    label="Additional Requirements"
                    value={
                      selectedRequest.additionalRequirements
                    }
                  />
                </DetailSection>

                <DetailSection
                  title="Request Status"
                >
                  <DetailRow
                    label="Status"
                    value={
                      getStatusLabel(
                        selectedRequest.status
                      )
                    }
                  />

                  <DetailRow
                    label="Submitted"
                    value={formatDateTime(
                      selectedRequest.createdAt
                    )}
                  />

                  <DetailRow
                    label="Last Updated"
                    value={formatDateTime(
                      selectedRequest.updatedAt
                    )}
                  />

                  <DetailRow
                    label="Admin Notes"
                    value={
                      selectedRequest.adminNotes
                    }
                  />
                </DetailSection>

                {selectedRequest.existingCvUrl && (
                  <div
                    style={
                      existingCvBoxStyle
                    }
                  >
                    <div
                      style={
                        existingCvTitleStyle
                      }
                    >
                      Existing CV
                    </div>

                    <a
                      href={
                        selectedRequest.existingCvUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      style={
                        cvLinkStyle
                      }
                    >
                      Open Existing CV ↗
                    </a>
                  </div>
                )}
              </div>

              <div
                style={
                  modalFooterStyle
                }
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowDetails(false);
                    openEdit(
                      selectedRequest
                    );
                  }}
                  style={
                    primaryButtonStyle
                  }
                >
                  Update Request
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetails(false)
                  }
                  style={
                    secondaryButtonStyle
                  }
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      {/* EDIT MODAL */}

      {showEdit &&
        selectedRequest && (
          <div
            style={overlayStyle}
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowEdit(false);
              }
            }}
          >
            <div
              style={{
                ...modalStyle,
                maxWidth: "560px",
              }}
            >
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
                    UPDATE REQUEST
                  </div>

                  <h2
                    style={
                      modalTitleStyle
                    }
                  >
                    {selectedRequest.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowEdit(false)
                  }
                  style={
                    closeButtonStyle
                  }
                >
                  ×
                </button>
              </div>

              <div
                style={
                  editFormStyle
                }
              >
                <label
                  style={
                    labelStyle
                  }
                >
                  Status
                </label>

                <select
                  value={
                    formData.status
                  }
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        status:
                          event.target
                            .value,
                      })
                    )
                  }
                  style={
                    fullInputStyle
                  }
                >
                  <option value="PENDING">
                    Pending
                  </option>

                  <option value="IN_PROGRESS">
                    In Progress
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="REJECTED">
                    Rejected
                  </option>
                </select>

                <label
                  style={
                    labelStyle
                  }
                >
                  Admin Notes
                </label>

                <textarea
                  value={
                    formData.adminNotes
                  }
                  onChange={(event) =>
                    setFormData(
                      (current) => ({
                        ...current,
                        adminNotes:
                          event.target
                            .value,
                      })
                    )
                  }
                  placeholder="Add notes about this CV request..."
                  rows={6}
                  style={{
                    ...fullInputStyle,
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={
                  modalFooterStyle
                }
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowEdit(false)
                  }
                  style={
                    secondaryButtonStyle
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleUpdate()
                  }
                  style={
                    primaryButtonStyle
                  }
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

/* =========================================================
   SMALL COMPONENTS
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

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={detailSectionStyle}>
      <h3
        style={
          detailSectionTitleStyle
        }
      >
        {title}
      </h3>

      <div>{children}</div>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div style={detailRowStyle}>
      <div style={detailLabelStyle}>
        {label}
      </div>

      <div style={detailValueStyle}>
        {value &&
        value.trim() !== ""
          ? value
          : "—"}
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

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "repeat(5, minmax(0, 1fr))",
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
  minWidth: "220px",
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

const trStyle: CSSProperties = {
  background: "#ffffff",
};

const applicantNameStyle: CSSProperties = {
  fontWeight: 600,
  color: "#101828",
  marginBottom: "3px",
};

const secondaryTextStyle: CSSProperties = {
  color: "#667085",
  fontSize: "11px",
  marginTop: "3px",
};

const statusBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "999px",
  padding: "5px 9px",
  fontSize: "11px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const actionGroupStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "6px",
};

const viewButtonStyle: CSSProperties = {
  border: "1px solid #d0d5dd",
  background: "#ffffff",
  color: "#344054",
  borderRadius: "6px",
  padding: "6px 9px",
  fontSize: "11px",
  cursor: "pointer",
};

const editButtonStyle: CSSProperties = {
  border: "1px solid #b2ddff",
  background: "#eff8ff",
  color: "#175cd3",
  borderRadius: "6px",
  padding: "6px 9px",
  fontSize: "11px",
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "1px solid #fecdca",
  background: "#fef3f2",
  color: "#b42318",
  borderRadius: "6px",
  padding: "6px 9px",
  fontSize: "11px",
  cursor: "pointer",
};

const emptyStateStyle: CSSProperties = {
  padding: "70px 20px",
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
  fontSize: "13px",
};

const emptyTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "15px",
  color: "#344054",
};

const emptyTextStyle: CSSProperties = {
  margin: "6px auto 0",
  maxWidth: "430px",
  fontSize: "13px",
  lineHeight: 1.6,
  color: "#667085",
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
  maxWidth: "760px",
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
  fontSize: "19px",
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

const modalBodyStyle: CSSProperties = {
  padding: "20px 22px",
};

const detailSectionStyle: CSSProperties = {
  marginBottom: "22px",
};

const detailSectionTitleStyle: CSSProperties = {
  margin: "0 0 10px",
  paddingBottom: "8px",
  borderBottom: "1px solid #eaecf0",
  color: "#344054",
  fontSize: "13px",
  fontWeight: 700,
};

const detailRowStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns:
    "180px minmax(0, 1fr)",
  gap: "18px",
  padding: "8px 0",
};

const detailLabelStyle: CSSProperties = {
  color: "#667085",
  fontSize: "12px",
  fontWeight: 600,
};

const detailValueStyle: CSSProperties = {
  color: "#344054",
  fontSize: "13px",
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const existingCvBoxStyle: CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #eaecf0",
  borderRadius: "8px",
  padding: "14px",
};

const existingCvTitleStyle: CSSProperties = {
  color: "#344054",
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: "7px",
};

const cvLinkStyle: CSSProperties = {
  color: "#175cd3",
  fontSize: "13px",
  fontWeight: 600,
  textDecoration: "none",
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

const editFormStyle: CSSProperties = {
  padding: "22px",
};

const labelStyle: CSSProperties = {
  display: "block",
  marginBottom: "7px",
  marginTop: "16px",
  color: "#344054",
  fontSize: "12px",
  fontWeight: 600,
};

const fullInputStyle: CSSProperties = {
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