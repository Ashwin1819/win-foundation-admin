/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type InternshipApplication = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  areaOfInterest: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Backend-only fields — no form inputs exist for these (college/course have no
  // backend equivalent), shown read-only in the detail view.
  city?: string | null;
  availability?: string | null;
};

const STATUS_OPTIONS = [
  "NEW",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
];

export default function InternshipPage() {
  const [applications, setApplications] = useState<
    InternshipApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<InternshipApplication | null>(null);

  const [updating, setUpdating] = useState<string | null>(null);

  const getToken = async () => {
    return "cookie-auth";
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/internship-applications",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to fetch internship applications"
        );
      }

      setApplications(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load internship applications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const filteredApplications = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return applications;
    }

    return applications.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(value) ||
        item.email.toLowerCase().includes(value) ||
        item.phone.toLowerCase().includes(value) ||
        item.college.toLowerCase().includes(value) ||
        item.course.toLowerCase().includes(value) ||
        item.areaOfInterest.toLowerCase().includes(value) ||
        item.status.toLowerCase().includes(value)
      );
    });
  }, [applications, search]);

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      setUpdating(id);

      const token = await getToken();

      const response = await fetch(
        "/api/internship-applications",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to update status"
        );
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item
        )
      );

      if (selected?.id === id) {
        setSelected({
          ...selected,
          status,
        });
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to update status"
      );
    } finally {
      setUpdating(null);
    }
  };

  const deleteApplication = async (id: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this internship application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = await getToken();

      const response = await fetch(
        "/api/internship-applications",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete application"
        );
      }

      setApplications((current) =>
        current.filter((item) => item.id !== id)
      );

      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete application"
      );
    }
  };

  const formatDate = (value: string) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return styles.statusApproved;

      case "REJECTED":
        return styles.statusRejected;

      case "REVIEWING":
        return styles.statusReviewing;

      default:
        return styles.statusNew;
    }
  };

  return (
    <main style={styles.page}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <div style={styles.breadcrumb}>
            Dashboard / Connect With Us / Internship
          </div>

          <h1 style={styles.title}>
            Internship
          </h1>

          <p style={styles.subtitle}>
            Manage internship applications received
            from the website.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {applications.length}
          </div>

          <div style={styles.statLabel}>
            Total Applications
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statNumber,
              color: "#f59e0b",
            }}
          >
            {
              applications.filter(
                (item) => item.status === "NEW"
              ).length
            }
          </div>

          <div style={styles.statLabel}>
            New
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statNumber,
              color: "#2563eb",
            }}
          >
            {
              applications.filter(
                (item) => item.status === "REVIEWING"
              ).length
            }
          </div>

          <div style={styles.statLabel}>
            Reviewing
          </div>
        </div>

        <div style={styles.statCard}>
          <div
            style={{
              ...styles.statNumber,
              color: "#16a34a",
            }}
          >
            {
              applications.filter(
                (item) => item.status === "APPROVED"
              ).length
            }
          </div>

          <div style={styles.statLabel}>
            Approved
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={styles.toolbar}>
        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search name, college, email..."
          style={styles.search}
        />
      </div>

      {/* TABLE */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Internship Applications
            </h2>

            <p style={styles.cardSubtitle}>
              {filteredApplications.length} application
              {filteredApplications.length !== 1
                ? "s"
                : ""}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.empty}>
            Loading...
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🎓
            </div>

            <h3 style={styles.emptyTitle}>
              No internship applications found
            </h3>

            <p style={styles.emptyText}>
              Applications submitted through the
              website will appear here.
            </p>
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Applicant
                  </th>

                  <th style={styles.th}>
                    College
                  </th>

                  <th style={styles.th}>
                    Contact
                  </th>

                  <th style={styles.th}>
                    Area
                  </th>

                  <th style={styles.th}>
                    Date
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>

                  <th style={styles.th}>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.map(
                  (application) => (
                    <tr key={application.id}>
                      <td style={styles.td}>
                        <strong>
                          {application.fullName}
                        </strong>

                        <div style={styles.smallText}>
                          {application.course}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {application.college}
                      </td>

                      <td style={styles.td}>
                        <div>
                          {application.email}
                        </div>

                        <div style={styles.smallText}>
                          {application.phone}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {application.areaOfInterest}
                      </td>

                      <td style={styles.td}>
                        {formatDate(
                          application.createdAt
                        )}
                      </td>

                      <td style={styles.td}>
                        <select
                          value={application.status}
                          disabled={
                            updating === application.id
                          }
                          onChange={(event) =>
                            updateStatus(
                              application.id,
                              event.target.value
                            )
                          }
                          style={{
                            ...styles.statusSelect,
                            ...getStatusStyle(
                              application.status
                            ),
                          }}
                        >
                          {STATUS_OPTIONS.map(
                            (status) => (
                              <option
                                key={status}
                                value={status}
                              >
                                {status}
                              </option>
                            )
                          )}
                        </select>
                      </td>

                      <td style={styles.td}>
                        <div style={styles.actions}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(application)
                            }
                            style={styles.viewButton}
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteApplication(
                                application.id
                              )
                            }
                            style={styles.deleteButton}
                          >
                            Delete
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
      {selected && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  Internship Application
                </h2>

                <p style={styles.modalSubtitle}>
                  Applicant details
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.detailsGrid}>
              <Detail
                label="Full Name"
                value={selected.fullName}
              />

              <Detail
                label="Email"
                value={selected.email}
              />

              <Detail
                label="Phone"
                value={selected.phone}
              />

              <Detail
                label="College / Institution"
                value={selected.college}
              />

              <Detail
                label="Course / Degree"
                value={selected.course}
              />

              <Detail
                label="Preferred Area"
                value={selected.areaOfInterest}
              />

              <Detail
                label="City"
                value={selected.city || "—"}
              />

              <Detail
                label="Availability"
                value={selected.availability || "—"}
              />

              <Detail
                label="Status"
                value={selected.status}
              />

              <Detail
                label="Submitted"
                value={formatDate(
                  selected.createdAt
                )}
              />
            </div>

            <div style={styles.messageBox}>
              <div style={styles.messageLabel}>
                Message
              </div>

              <div style={styles.message}>
                {selected.message || "-"}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div style={styles.detail}>
      <div style={styles.detailLabel}>
        {label}
      </div>

      <div style={styles.detailValue}>
        {value || "-"}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "36px 48px 70px",
    background: "#f5f7fb",
    color: "#111827",
  },

  header: {
    marginBottom: "30px",
  },

  breadcrumb: {
    color: "#8ca0bd",
    fontSize: "13px",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "15px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "24px",
  },

  statNumber: {
    fontSize: "32px",
    fontWeight: 700,
    color: "#111827",
  },

  statLabel: {
    marginTop: "10px",
    color: "#64748b",
    fontSize: "14px",
  },

  toolbar: {
    marginBottom: "16px",
  },

  search: {
    width: "100%",
    height: "48px",
    padding: "0 16px",
    border: "1px solid #dbe3ed",
    borderRadius: "8px",
    background: "#ffffff",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #dbe3ed",
    borderRadius: "10px",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "22px 24px",
    borderBottom: "1px solid #edf1f5",
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
  },

  cardSubtitle: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: "14px",
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1050px",
  },

  th: {
    textAlign: "left",
    padding: "15px 16px",
    fontSize: "12px",
    textTransform: "uppercase",
    color: "#64748b",
    background: "#fbfcfe",
    borderBottom: "1px solid #e5eaf0",
  },

  td: {
    padding: "18px 16px",
    fontSize: "14px",
    borderBottom: "1px solid #edf1f5",
    verticalAlign: "middle",
  },

  smallText: {
    marginTop: "5px",
    color: "#94a3b8",
    fontSize: "12px",
  },

  statusSelect: {
    minWidth: "125px",
    padding: "8px 12px",
    borderRadius: "18px",
    fontSize: "12px",
    fontWeight: 700,
    border: "1px solid",
    outline: "none",
  },

  statusNew: {
    background: "#fff7ed",
    color: "#c2410c",
    borderColor: "#fed7aa",
  },

  statusReviewing: {
    background: "#eff6ff",
    color: "#2563eb",
    borderColor: "#bfdbfe",
  },

  statusApproved: {
    background: "#ecfdf5",
    color: "#15803d",
    borderColor: "#bbf7d0",
  },

  statusRejected: {
    background: "#fef2f2",
    color: "#dc2626",
    borderColor: "#fecaca",
  },

  actions: {
    display: "flex",
    gap: "8px",
  },

  viewButton: {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#2563eb",
    padding: "8px 13px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    padding: "8px 13px",
    borderRadius: "7px",
    cursor: "pointer",
  },

  empty: {
    minHeight: "260px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "40px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 500,
  },

  emptyText: {
    color: "#94a3b8",
    fontSize: "14px",
    marginTop: "8px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#ffffff",
    borderRadius: "14px",
    boxShadow: "0 25px 70px rgba(0,0,0,0.18)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "24px",
    borderBottom: "1px solid #edf1f5",
  },

  modalTitle: {
    margin: 0,
    fontSize: "21px",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    fontSize: "24px",
    cursor: "pointer",
    color: "#475569",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
    padding: "24px",
  },

  detail: {
    padding: "14px",
    background: "#f8fafc",
    borderRadius: "8px",
  },

  detailLabel: {
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "7px",
  },

  detailValue: {
    color: "#111827",
    fontSize: "14px",
    fontWeight: 500,
    wordBreak: "break-word",
  },

  messageBox: {
    margin: "0 24px 24px",
    padding: "16px",
    background: "#f8fafc",
    borderRadius: "8px",
  },

  messageLabel: {
    color: "#64748b",
    fontSize: "12px",
    marginBottom: "8px",
  },

  message: {
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
};