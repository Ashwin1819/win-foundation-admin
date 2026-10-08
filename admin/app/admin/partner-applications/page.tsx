/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type PartnerApplication = {
  id: string;
  organization: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  partnershipType: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS = [
  "NEW",
  "REVIEWING",
  "APPROVED",
  "REJECTED",
];

export default function PartnerApplicationsPage() {
  const [applications, setApplications] = useState<
    PartnerApplication[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] =
    useState<PartnerApplication | null>(null);
  const [updating, setUpdating] = useState<string | null>(
    null
  );

  const getToken = async () => {
    return "cookie-auth";
  };

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/partner-applications",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to fetch applications"
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
          : "Failed to load applications"
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
        item.organization
          .toLowerCase()
          .includes(value) ||
        item.contactName
          .toLowerCase()
          .includes(value) ||
        item.email
          .toLowerCase()
          .includes(value) ||
        item.phone
          .toLowerCase()
          .includes(value) ||
        item.partnershipType
          .toLowerCase()
          .includes(value) ||
        item.status
          .toLowerCase()
          .includes(value)
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
        "/api/partner-applications",
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
          data?.error ||
            "Failed to update status"
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
      "Are you sure you want to delete this partner application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = await getToken();

      const response = await fetch(
        "/api/partner-applications",
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
          data?.error ||
            "Failed to delete application"
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
            Dashboard / Connect With Us / Become a Partner
          </div>

          <h1 style={styles.title}>
            Become a Partner
          </h1>

          <p style={styles.subtitle}>
            Manage partnership applications received
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
                (item) =>
                  item.status === "REVIEWING"
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
                (item) =>
                  item.status === "APPROVED"
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
          placeholder="Search organization, contact, email..."
          style={styles.search}
        />
      </div>

      {/* TABLE */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>
              Partner Applications
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
            <div style={styles.loadingSpinner}>
              Loading...
            </div>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>
              🤝
            </div>

            <h3 style={styles.emptyTitle}>
              No partner applications found
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
                    Organization
                  </th>

                  <th style={styles.th}>
                    Contact Person
                  </th>

                  <th style={styles.th}>
                    Contact
                  </th>

                  <th style={styles.th}>
                    Partnership Type
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
                        <strong
                          style={styles.organization}
                        >
                          {
                            application.organization
                          }
                        </strong>

                        {application.website && (
                          <a
                            href={
                              application.website
                            }
                            target="_blank"
                            rel="noreferrer"
                            style={styles.website}
                          >
                            Website ↗
                          </a>
                        )}
                      </td>

                      <td style={styles.td}>
                        {
                          application.contactName
                        }
                      </td>

                      <td style={styles.td}>
                        <div>
                          {application.email}
                        </div>

                        <div
                          style={
                            styles.phone
                          }
                        >
                          {application.phone}
                        </div>
                      </td>

                      <td style={styles.td}>
                        {
                          application.partnershipType
                        }
                      </td>

                      <td style={styles.td}>
                        {formatDate(
                          application.createdAt
                        )}
                      </td>

                      <td style={styles.td}>
                        <select
                          value={
                            application.status
                          }
                          disabled={
                            updating ===
                            application.id
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
                        <div
                          style={
                            styles.actionButtons
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(
                                application
                              )
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
                            style={
                              styles.deleteButton
                            }
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

      {/* VIEW MODAL */}
      {selected && (
        <div
          style={styles.overlay}
          onClick={() => setSelected(null)}
        >
          <div
            style={styles.modal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  Partner Application
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Submitted on{" "}
                  {formatDate(
                    selected.createdAt
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <Detail
                  label="Organization Name"
                  value={
                    selected.organization
                  }
                />

                <Detail
                  label="Contact Person"
                  value={
                    selected.contactName
                  }
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
                  label="Website"
                  value={
                    selected.website || "-"
                  }
                />

                <Detail
                  label="Partnership Type"
                  value={
                    selected.partnershipType
                  }
                />

                <Detail
                  label="Status"
                  value={selected.status}
                />
              </div>

              <div style={styles.messageBox}>
                <div
                  style={
                    styles.messageLabel
                  }
                >
                  Partnership Message
                </div>

                <div
                  style={
                    styles.messageText
                  }
                >
                  {selected.message}
                </div>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                style={styles.secondaryButton}
              >
                Close
              </button>
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
        {value}
      </div>
    </div>
  );
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "34px 58px",
    color: "#172033",
  },

  header: {
    marginBottom: "28px",
  },

  breadcrumb: {
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "10px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "22px",
  },

  statCard: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    padding: "20px 22px",
  },

  statNumber: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#172033",
  },

  statLabel: {
    marginTop: "7px",
    color: "#64748b",
    fontSize: "13px",
  },

  toolbar: {
    marginBottom: "14px",
  },

  search: {
    width: "100%",
    height: "44px",
    padding: "0 15px",
    border: "1px solid #d8dee8",
    borderRadius: "7px",
    background: "#fff",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    overflow: "hidden",
  },

  cardHeader: {
    padding: "20px 22px",
    borderBottom: "1px solid #edf0f4",
  },

  cardTitle: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 700,
  },

  cardSubtitle: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
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
    padding: "13px 16px",
    fontSize: "11px",
    color: "#64748b",
    fontWeight: 700,
    textTransform: "uppercase",
    borderBottom: "1px solid #e5e7eb",
    background: "#fbfcfe",
  },

  td: {
    padding: "17px 16px",
    fontSize: "13px",
    borderBottom: "1px solid #edf0f4",
    verticalAlign: "middle",
  },

  organization: {
    display: "block",
    color: "#172033",
    marginBottom: "5px",
  },

  website: {
    color: "#2563eb",
    fontSize: "11px",
    textDecoration: "none",
  },

  phone: {
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
  },

  statusSelect: {
    minWidth: "120px",
    height: "32px",
    padding: "0 8px",
    borderRadius: "16px",
    border: "1px solid transparent",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    outline: "none",
  },

  statusNew: {
    background: "#fff7ed",
    color: "#c2410c",
    borderColor: "#fed7aa",
  },

  statusReviewing: {
    background: "#eff6ff",
    color: "#1d4ed8",
    borderColor: "#bfdbfe",
  },

  statusApproved: {
    background: "#ecfdf5",
    color: "#15803d",
    borderColor: "#bbf7d0",
  },

  statusRejected: {
    background: "#fef2f2",
    color: "#b91c1c",
    borderColor: "#fecaca",
  },

  actionButtons: {
    display: "flex",
    gap: "7px",
  },

  viewButton: {
    border: "1px solid #dbe3ef",
    background: "#fff",
    color: "#2563eb",
    padding: "7px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  deleteButton: {
    border: "1px solid #fecaca",
    background: "#fff5f5",
    color: "#dc2626",
    padding: "7px 11px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },

  empty: {
    padding: "75px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    fontSize: "30px",
    marginBottom: "12px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "16px",
  },

  emptyText: {
    margin: "8px 0 0",
    color: "#94a3b8",
    fontSize: "13px",
  },

  loadingSpinner: {
    color: "#64748b",
    fontSize: "14px",
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
    maxWidth: "700px",
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "12px",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 24px",
    borderBottom: "1px solid #edf0f4",
  },

  modalTitle: {
    margin: 0,
    fontSize: "20px",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },

  closeButton: {
    width: "32px",
    height: "32px",
    border: "1px solid #e2e8f0",
    background: "#fff",
    borderRadius: "6px",
    fontSize: "22px",
    lineHeight: 1,
    cursor: "pointer",
    color: "#64748b",
  },

  modalBody: {
    padding: "24px",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  detail: {
    minWidth: 0,
  },

  detailLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: "6px",
  },

  detailValue: {
    fontSize: "14px",
    color: "#172033",
    wordBreak: "break-word",
  },

  messageBox: {
    marginTop: "24px",
    padding: "17px",
    background: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },

  messageLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 700,
    marginBottom: "9px",
  },

  messageText: {
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#334155",
    whiteSpace: "pre-wrap",
  },

  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #edf0f4",
    display: "flex",
    justifyContent: "flex-end",
  },

  secondaryButton: {
    padding: "9px 18px",
    borderRadius: "6px",
    border: "1px solid #dbe3ef",
    background: "#fff",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },
};