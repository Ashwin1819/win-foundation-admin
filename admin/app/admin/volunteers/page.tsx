"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type Volunteer = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  city: string | null;
  age: number | null;
  occupation: string | null;
  skills: string | null;
  areaOfInterest: string | null;
  availability: string | null;
  message: string | null;
  status: string;
  createdAt: string;
};

type SortOrder = "newest" | "oldest";

type DateFilter =
  | "all"
  | "today"
  | "week"
  | "month";

type StatusFilter =
  | "all"
  | "NEW"
  | "APPROVED"
  | "REJECTED";

export default function VolunteersPage() {
  const router = useRouter();

  const [volunteers, setVolunteers] = useState<Volunteer[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] =
    useState<SortOrder>("newest");

  const [dateFilter, setDateFilter] =
    useState<DateFilter>("all");

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [selectedVolunteer, setSelectedVolunteer] =
    useState<Volunteer | null>(null);

  const [updatingId, setUpdatingId] =
    useState<string | null>(null);

  const fetchVolunteers = useCallback(async () => {
    try {
      
      const token = "cookie-auth";

      const response = await fetch("/api/volunteers", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data);
        return;
      }

      setVolunteers(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch volunteers:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchVolunteers();
  }, [fetchVolunteers]);

  async function updateStatus(
    volunteer: Volunteer,
    status: string
  ) {
    try {
      setUpdatingId(volunteer.id);

      
      const token = "cookie-auth";

      const response = await fetch(
        "/api/volunteers",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: volunteer.id,
            status,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.error ||
            "Failed to update application status"
        );
        return;
      }

      setVolunteers((current) =>
        current.map((item) =>
          item.id === volunteer.id
            ? {
                ...item,
                status: data.status ?? status,
              }
            : item
        )
      );

      setSelectedVolunteer((current) =>
        current?.id === volunteer.id
          ? {
              ...current,
              status: data.status ?? status,
            }
          : current
      );
    } catch (error) {
      console.error(
        "Update volunteer status error:",
        error
      );

      alert(
        "Failed to update application status"
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteVolunteer(id: string) {
    const confirmed = window.confirm(
      "Delete this volunteer application?"
    );

    if (!confirmed) {
      return;
    }

    try {
      
      const token = "cookie-auth";

      const response = await fetch(
        "/api/volunteers",
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
        alert(
          data.error ||
            "Failed to delete application"
        );
        return;
      }

      setVolunteers((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      if (
        selectedVolunteer?.id === id
      ) {
        setSelectedVolunteer(null);
      }
    } catch (error) {
      console.error(
        "Delete volunteer error:",
        error
      );

      alert(
        "Failed to delete application"
      );
    }
  }

  const filteredVolunteers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    const filtered = volunteers.filter(
      (volunteer) => {
        if (query) {
          const values = [
            volunteer.fullName,
            volunteer.email,
            volunteer.phone,
            volunteer.city,
            volunteer.occupation,
            volunteer.skills,
            volunteer.areaOfInterest,
            volunteer.availability,
            volunteer.message,
          ];

          const matchesSearch = values
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(query)
            );

          if (!matchesSearch) {
            return false;
          }
        }

        if (
          statusFilter !== "all" &&
          volunteer.status !== statusFilter
        ) {
          return false;
        }

        if (dateFilter !== "all") {
          const created = new Date(
            volunteer.createdAt
          );

          const now = new Date();

          if (
            dateFilter === "today"
          ) {
            const sameDay =
              created.getDate() ===
                now.getDate() &&
              created.getMonth() ===
                now.getMonth() &&
              created.getFullYear() ===
                now.getFullYear();

            if (!sameDay) {
              return false;
            }
          }

          if (
            dateFilter === "week"
          ) {
            const weekAgo = new Date();

            weekAgo.setDate(
              now.getDate() - 7
            );

            if (created < weekAgo) {
              return false;
            }
          }

          if (
            dateFilter === "month"
          ) {
            const sameMonth =
              created.getMonth() ===
                now.getMonth() &&
              created.getFullYear() ===
                now.getFullYear();

            if (!sameMonth) {
              return false;
            }
          }
        }

        return true;
      }
    );

    return [...filtered].sort(
      (a, b) => {
        const first = new Date(
          a.createdAt
        ).getTime();

        const second = new Date(
          b.createdAt
        ).getTime();

        return sortOrder === "newest"
          ? second - first
          : first - second;
      }
    );
  }, [
    volunteers,
    search,
    sortOrder,
    dateFilter,
    statusFilter,
  ]);

  const pendingCount = volunteers.filter(
    (item) => item.status === "NEW"
  ).length;

  const approvedCount = volunteers.filter(
    (item) => item.status === "APPROVED"
  ).length;

  const rejectedCount = volunteers.filter(
    (item) => item.status === "REJECTED"
  ).length;

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}

        <div style={styles.header}>
          <div>
            <div style={styles.breadcrumb}>
              Dashboard / Volunteers
            </div>

            <h1 style={styles.title}>
              Volunteer Applications
            </h1>

            <p style={styles.subtitle}>
              View and manage people who
              registered as volunteers through
              the website.
            </p>
          </div>
        </div>

        {/* STAT CARDS */}

        <div style={styles.statsGrid}>
          <StatCard
            label="Total Applications"
            value={volunteers.length}
          />

          <StatCard
            label="Pending"
            value={pendingCount}
          />

          <StatCard
            label="Approved"
            value={approvedCount}
          />

          <StatCard
            label="Rejected"
            value={rejectedCount}
          />
        </div>

        {/* TOOLBAR */}

        <div style={styles.toolbar}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>
              ⌕
            </span>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search name, email, phone, city..."
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as StatusFilter
                )
              }
              style={styles.select}
            >
              <option value="all">
                All Status
              </option>

              <option value="NEW">
                New
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="REJECTED">
                Rejected
              </option>
            </select>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target
                    .value as DateFilter
                )
              }
              style={styles.select}
            >
              <option value="all">
                All Dates
              </option>

              <option value="today">
                Today
              </option>

              <option value="week">
                This Week
              </option>

              <option value="month">
                This Month
              </option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) =>
                setSortOrder(
                  event.target
                    .value as SortOrder
                )
              }
              style={styles.select}
            >
              <option value="newest">
                Newest First
              </option>

              <option value="oldest">
                Oldest First
              </option>
            </select>
          </div>
        </div>

        {/* TABLE */}

        <div style={styles.tableCard}>
          {loading ? (
            <div style={styles.loading}>
              Loading volunteer
              applications...
            </div>
          ) : filteredVolunteers.length ===
            0 ? (
            <div style={styles.empty}>
              <div style={styles.emptyIcon}>
                ♡
              </div>

              <h3 style={styles.emptyTitle}>
                No volunteer applications
                found
              </h3>

              <p style={styles.emptyText}>
                Volunteer registrations
                submitted through the website
                will appear here.
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>
                      Name
                    </th>

                    <th style={styles.th}>
                      Contact
                    </th>

                    <th style={styles.th}>
                      City
                    </th>

                    <th style={styles.th}>
                      Area of Interest
                    </th>

                    <th style={styles.th}>
                      Availability
                    </th>

                    <th style={styles.th}>
                      Status
                    </th>

                    <th style={styles.th}>
                      Date
                    </th>

                    <th
                      style={{
                        ...styles.th,
                        textAlign: "center",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredVolunteers.map(
                    (volunteer) => (
                      <tr
                        key={volunteer.id}
                      >
                        <td style={styles.td}>
                          <div
                            style={
                              styles.nameCell
                            }
                          >
                            {volunteer.fullName}
                          </div>

                          {volunteer.age !==
                            null && (
                            <div
                              style={
                                styles.muted
                              }
                            >
                              Age{" "}
                              {volunteer.age}
                            </div>
                          )}
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.email
                            }
                          >
                            {volunteer.email}
                          </div>

                          <div
                            style={
                              styles.phone
                            }
                          >
                            {volunteer.phone ||
                              "—"}
                          </div>
                        </td>

                        <td style={styles.td}>
                          {volunteer.city ||
                            "—"}
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.truncated
                            }
                            title={
                              volunteer.areaOfInterest ||
                              ""
                            }
                          >
                            {volunteer.areaOfInterest ||
                              "—"}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div
                            style={
                              styles.truncated
                            }
                            title={
                              volunteer.availability ||
                              ""
                            }
                          >
                            {volunteer.availability ||
                              "—"}
                          </div>
                        </td>

                        <td style={styles.td}>
                          <select
                            value={
                              volunteer.status ||
                              "NEW"
                            }
                            disabled={
                              updatingId ===
                              volunteer.id
                            }
                            onChange={(event) =>
                              void updateStatus(
                                volunteer,
                                event.target
                                  .value
                              )
                            }
                            style={getStatusSelectStyle(
                              volunteer.status
                            )}
                          >
                            <option value="NEW">
                New
              </option>

                            <option value="APPROVED">
                              Approved
                            </option>

                            <option value="REJECTED">
                              Rejected
                            </option>
                          </select>
                        </td>

                        <td style={styles.td}>
                          {formatDate(
                            volunteer.createdAt
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            textAlign:
                              "center",
                          }}
                        >
                          <div
                            style={
                              styles.actionGroup
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedVolunteer(
                                  volunteer
                                )
                              }
                              style={
                                styles.viewButton
                              }
                            >
                              View
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void deleteVolunteer(
                                  volunteer.id
                                )
                              }
                              title="Delete application"
                              style={
                                styles.deleteButton
                              }
                            >
                              🗑
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

        {!loading && (
          <p style={styles.footerCount}>
            Showing{" "}
            {filteredVolunteers.length} of{" "}
            {volunteers.length} volunteer
            applications
          </p>
        )}
      </div>

      {/* DETAILS MODAL */}

      {selectedVolunteer && (
        <div
          style={styles.overlay}
          onClick={() =>
            setSelectedVolunteer(null)
          }
        >
          <div
            style={styles.modal}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div style={styles.modalHeader}>
              <div>
                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  Volunteer Details
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  Complete volunteer
                  application
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedVolunteer(
                    null
                  )
                }
                style={styles.closeButton}
              >
                ×
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.detailGrid}>
                <Detail
                  label="Full Name"
                  value={
                    selectedVolunteer.fullName
                  }
                />

                <Detail
                  label="Email"
                  value={
                    selectedVolunteer.email
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    selectedVolunteer.phone
                  }
                />

                <Detail
                  label="City"
                  value={
                    selectedVolunteer.city
                  }
                />

                <Detail
                  label="Age"
                  value={
                    selectedVolunteer.age
                      ?.toString()
                  }
                />

                <Detail
                  label="Occupation"
                  value={
                    selectedVolunteer.occupation
                  }
                />

                <Detail
                  label="Skills"
                  value={
                    selectedVolunteer.skills
                  }
                  full
                />

                <Detail
                  label="Area of Interest"
                  value={
                    selectedVolunteer.areaOfInterest
                  }
                  full
                />

                <Detail
                  label="Availability"
                  value={
                    selectedVolunteer.availability
                  }
                  full
                />

                <Detail
                  label="Application Date"
                  value={formatDate(
                    selectedVolunteer.createdAt
                  )}
                />

                <Detail
                  label="Status"
                  value={
                    selectedVolunteer.status
                  }
                />

                <Detail
                  label="Message"
                  value={
                    selectedVolunteer.message
                  }
                  full
                />
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                type="button"
                onClick={() =>
                  setSelectedVolunteer(
                    null
                  )
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

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>
        {label}
      </div>

      <div style={styles.statValue}>
        {value}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  full = false,
}: {
  label: string;
  value: string | null | undefined;
  full?: boolean;
}) {
  return (
    <div
      style={{
        ...styles.detailItem,
        ...(full
          ? styles.detailFull
          : {}),
      }}
    >
      <div style={styles.detailLabel}>
        {label}
      </div>

      <div style={styles.detailValue}>
        {value || "Not provided"}
      </div>
    </div>
  );
}

function formatDate(date: string) {
  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "—";
  }

  return value.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getStatusSelectStyle(
  status: string
): React.CSSProperties {
  const normalized =
    status.toUpperCase();

  if (normalized === "APPROVED") {
    return {
      ...styles.statusSelect,
      background: "#ecfdf3",
      color: "#027a48",
      borderColor: "#abefc6",
    };
  }

  if (normalized === "REJECTED") {
    return {
      ...styles.statusSelect,
      background: "#fef3f2",
      color: "#b42318",
      borderColor: "#fecdca",
    };
  }

  return {
    ...styles.statusSelect,
    background: "#fffaeb",
    color: "#b54708",
    borderColor: "#fedf89",
  };
}

const styles: Record<
  string,
  React.CSSProperties
> = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    padding: "32px 40px 50px",
  },

  container: {
    width: "100%",
    maxWidth: "1500px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "26px",
  },

  breadcrumb: {
    fontSize: "13px",
    color: "#667085",
    marginBottom: "10px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#172033",
  },

  subtitle: {
    margin: "9px 0 0",
    fontSize: "15px",
    color: "#667085",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e2e7ef",
    borderRadius: "8px",
    padding: "20px",
  },

  statLabel: {
    fontSize: "13px",
    color: "#667085",
    marginBottom: "8px",
  },

  statValue: {
    fontSize: "27px",
    fontWeight: 700,
    color: "#172033",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  searchBox: {
    width: "380px",
    maxWidth: "100%",
    height: "46px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #d5dbe5",
    borderRadius: "6px",
    background: "#ffffff",
    overflow: "hidden",
  },

  searchIcon: {
    paddingLeft: "14px",
    fontSize: "21px",
    color: "#667085",
  },

  searchInput: {
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    padding: "0 14px 0 10px",
    fontSize: "14px",
    color: "#172033",
    background: "transparent",
  },

  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },

  select: {
    height: "46px",
    minWidth: "145px",
    border: "1px solid #d5dbe5",
    borderRadius: "6px",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: "14px",
    color: "#172033",
    outline: "none",
    cursor: "pointer",
  },

  tableCard: {
    width: "100%",
    background: "#ffffff",
    border: "1px solid #dfe4ec",
    borderRadius: "8px",
    overflow: "hidden",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "1250px",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },

  th: {
    padding: "15px 16px",
    textAlign: "left",
    background: "#f8fafc",
    borderBottom: "1px solid #dfe4ec",
    color: "#344054",
    fontSize: "13px",
    fontWeight: 700,
  },

  td: {
    padding: "15px 16px",
    borderBottom: "1px solid #e5e7eb",
    color: "#101828",
    fontSize: "14px",
    verticalAlign: "middle",
    lineHeight: 1.45,
  },

  nameCell: {
    fontWeight: 600,
    color: "#172033",
  },

  muted: {
    marginTop: "3px",
    color: "#98a2b3",
    fontSize: "12px",
  },

  email: {
    fontSize: "13px",
    color: "#344054",
    wordBreak: "break-word",
  },

  phone: {
    marginTop: "4px",
    fontSize: "13px",
    color: "#667085",
  },

  truncated: {
    maxWidth: "175px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  statusSelect: {
    minWidth: "110px",
    height: "34px",
    borderRadius: "20px",
    padding: "0 10px",
    fontSize: "12px",
    fontWeight: 600,
    outline: "none",
    cursor: "pointer",
  },

  actionGroup: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  },

  viewButton: {
    height: "34px",
    padding: "0 12px",
    border: "1px solid #d0d5dd",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#344054",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  },

  deleteButton: {
    width: "34px",
    height: "34px",
    border: "1px solid #dfe4ec",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#b42318",
    cursor: "pointer",
    fontSize: "15px",
  },

  loading: {
    padding: "70px 20px",
    textAlign: "center",
    color: "#667085",
    fontSize: "15px",
  },

  empty: {
    padding: "80px 20px",
    textAlign: "center",
  },

  emptyIcon: {
    width: "52px",
    height: "52px",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "#eef4ff",
    color: "#2563eb",
    fontSize: "25px",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "18px",
    color: "#172033",
  },

  emptyText: {
    margin: "9px 0 0",
    color: "#667085",
    fontSize: "14px",
  },

  footerCount: {
    margin: "13px 0 0",
    color: "#667085",
    fontSize: "13px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "rgba(15, 23, 42, 0.45)",
  },

  modal: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "90vh",
    overflow: "hidden",
    background: "#ffffff",
    borderRadius: "10px",
    boxShadow:
      "0 20px 60px rgba(15, 23, 42, 0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "22px 24px",
    borderBottom: "1px solid #e5e7eb",
  },

  modalTitle: {
    margin: 0,
    fontSize: "21px",
    color: "#172033",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    fontSize: "13px",
    color: "#667085",
  },

  closeButton: {
    width: "34px",
    height: "34px",
    border: "none",
    borderRadius: "6px",
    background: "#f2f4f7",
    color: "#475467",
    fontSize: "23px",
    lineHeight: 1,
    cursor: "pointer",
  },

  modalBody: {
    padding: "24px",
    maxHeight: "65vh",
    overflowY: "auto",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "18px",
  },

  detailItem: {
    minWidth: 0,
  },

  detailFull: {
    gridColumn: "1 / -1",
  },

  detailLabel: {
    marginBottom: "6px",
    fontSize: "12px",
    fontWeight: 700,
    color: "#667085",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },

  detailValue: {
    minHeight: "20px",
    padding: "11px 12px",
    border: "1px solid #e4e7ec",
    borderRadius: "6px",
    background: "#f9fafb",
    color: "#172033",
    fontSize: "14px",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #e5e7eb",
  },

  secondaryButton: {
    height: "40px",
    padding: "0 18px",
    border: "1px solid #d0d5dd",
    borderRadius: "6px",
    background: "#ffffff",
    color: "#344054",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
  },
};