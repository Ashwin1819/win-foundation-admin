"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ReplyStatus = "PENDING" | "APPROVED" | "REJECTED";

type Reply = {
  id: string;
  name: string;
  email: string;
  message: string;
  page: string | null;
  status: ReplyStatus;
  createdAt: string;
  updatedAt: string;
};

const PAGE_SIZE = 10;

export default function RepliesPage() {
  const router = useRouter();

  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<
    "newest" | "oldest"
  >("newest");

  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  const fetchReplies = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/replies?sort=${sortOrder}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to fetch replies"
        );
      }

      setReplies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load replies:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load replies."
      );
    } finally {
      setLoading(false);
    }
  }, [sortOrder]);

  useEffect(() => {
    void fetchReplies();
  }, [fetchReplies]);

  const filteredReplies = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return replies.filter((reply) => {
      /* Search filter */
      if (searchValue) {
        const matchesSearch =
          reply.name
            .toLowerCase()
            .includes(searchValue) ||
          reply.email
            .toLowerCase()
            .includes(searchValue) ||
          reply.message
            .toLowerCase()
            .includes(searchValue);

        if (!matchesSearch) {
          return false;
        }
      }

      /* Date filter */
      if (dateFilter !== "all") {
        const replyDate = new Date(reply.createdAt);
        const now = new Date();

        if (dateFilter === "today") {
          const startOfToday = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );

          if (replyDate < startOfToday) {
            return false;
          }
        }

        if (dateFilter === "7days") {
          const sevenDaysAgo = new Date();

          sevenDaysAgo.setDate(
            sevenDaysAgo.getDate() - 7
          );

          if (replyDate < sevenDaysAgo) {
            return false;
          }
        }

        if (dateFilter === "30days") {
          const thirtyDaysAgo = new Date();

          thirtyDaysAgo.setDate(
            thirtyDaysAgo.getDate() - 30
          );

          if (replyDate < thirtyDaysAgo) {
            return false;
          }
        }
      }

      return true;
    });
  }, [replies, search, dateFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReplies.length / PAGE_SIZE)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedReplies = filteredReplies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  async function deleteReply(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this reply?"
    );

    if (!confirmed) {
      return;
    }

    try {
      
      setDeletingId(id);

      const token = "cookie-auth";

      const response = await fetch("/api/replies", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to delete reply"
        );
      }

      setReplies((current) =>
        current.filter((reply) => reply.id !== id)
      );

      if (
        paginatedReplies.length === 1 &&
        currentPage > 1
      ) {
        setPage((current) => current - 1);
      }
    } catch (error) {
      console.error("Delete reply error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete reply."
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

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "22px 16px 40px",
        color: "#172033",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              lineHeight: 1.2,
              fontWeight: 700,
              color: "#182235",
            }}
          >
            Replies
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              fontSize: 16,
              color: "#64748b",
            }}
          >
            View and manage blog comment replies.
          </p>
        </div>

        {/* FILTERS */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            marginTop: 42,
            flexWrap: "wrap",
          }}
        >
          {/* SEARCH */}

          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search name, email, comment..."
            style={{
              width: 356,
              height: 46,
              padding: "0 13px",
              border: "1px solid #cbd5e1",
              borderRadius: 5,
              background: "#ffffff",
              color: "#172033",
              fontSize: 16,
              outline: "none",
              boxSizing: "border-box",
            }}
          />

          {/* RIGHT FILTERS */}

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            {/* DATE */}

            <select
              value={dateFilter}
              onChange={(event) => {
                setDateFilter(event.target.value);
                setPage(1);
              }}
              style={{
                width: 196,
                height: 46,
                padding: "0 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 5,
                background: "#ffffff",
                color: "#172033",
                fontSize: 16,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="all">Date</option>
              <option value="today">Today</option>
              <option value="7days">
                Last 7 days
              </option>
              <option value="30days">
                Last 30 days
              </option>
            </select>

            {/* SORT */}

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
              style={{
                width: 148,
                height: 46,
                padding: "0 12px",
                border: "1px solid #cbd5e1",
                borderRadius: 5,
                background: "#ffffff",
                color: "#172033",
                fontSize: 16,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="newest">
                Newest first
              </option>

              <option value="oldest">
                Oldest first
              </option>
            </select>
          </div>
        </div>

        {/* LOADING */}

        {loading ? (
          <div
            style={{
              textAlign: "center",
              paddingTop: 72,
              color: "#64748b",
              fontSize: 16,
            }}
          >
            Loading replies...
          </div>
        ) : filteredReplies.length === 0 ? (
          /* EMPTY STATE */

          <div
            style={{
              textAlign: "center",
              paddingTop: 68,
              color: "#64748b",
              fontSize: 16,
            }}
          >
            No replies yet.
          </div>
        ) : (
          <>
            {/* TABLE */}

            <div
              style={{
                marginTop: 30,
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                overflow: "hidden",
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
                    borderCollapse: "collapse",
                    minWidth: 850,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        background: "#f8fafc",
                        borderBottom:
                          "1px solid #e2e8f0",
                      }}
                    >
                      <th style={thStyle}>
                        Name
                      </th>

                      <th style={thStyle}>
                        Email
                      </th>

                      <th style={thStyle}>
                        Comment
                      </th>

                      <th style={thStyle}>
                        Date
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
                    {paginatedReplies.map((reply) => (
                      <tr
                        key={reply.id}
                        style={{
                          borderBottom:
                            "1px solid #e2e8f0",
                        }}
                      >
                        {/* NAME */}

                        <td style={tdStyle}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: "#172033",
                            }}
                          >
                            {reply.name}
                          </div>
                        </td>

                        {/* EMAIL */}

                        <td style={tdStyle}>
                          {reply.email}
                        </td>

                        {/* COMMENT */}

                        <td
                          style={{
                            ...tdStyle,
                            maxWidth: 420,
                          }}
                        >
                          <div
                            style={{
                              overflow: "hidden",
                              textOverflow:
                                "ellipsis",
                              whiteSpace:
                                "nowrap",
                            }}
                            title={reply.message}
                          >
                            {reply.message}
                          </div>
                        </td>

                        {/* DATE */}

                        <td style={tdStyle}>
                          {formatDate(
                            reply.createdAt
                          )}
                        </td>

                        {/* STATUS */}

                        <td style={tdStyle}>
                          <span
                            style={{
                              display:
                                "inline-block",
                              padding:
                                "4px 9px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              background:
                                reply.status ===
                                "APPROVED"
                                  ? "#dcfce7"
                                  : reply.status ===
                                    "REJECTED"
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                reply.status ===
                                "APPROVED"
                                  ? "#166534"
                                  : reply.status ===
                                    "REJECTED"
                                  ? "#991b1b"
                                  : "#92400e",
                            }}
                          >
                            {reply.status}
                          </span>
                        </td>

                        {/* ACTION */}

                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              deleteReply(
                                reply.id
                              )
                            }
                            disabled={
                              deletingId ===
                              reply.id
                            }
                            style={{
                              border: "none",
                              background:
                                "transparent",
                              color: "#dc2626",
                              fontSize: 14,
                              cursor:
                                deletingId ===
                                reply.id
                                  ? "default"
                                  : "pointer",
                              opacity:
                                deletingId ===
                                reply.id
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            {deletingId ===
                            reply.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
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
                  filteredReplies.length
                )}{" "}
                of {filteredReplies.length}{" "}
                replies
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
                  disabled={currentPage === 1}
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
  padding: "13px 16px",
  textAlign: "left",
  fontSize: 13,
  fontWeight: 600,
  color: "#475569",
};

const tdStyle: React.CSSProperties = {
  padding: "15px 16px",
  fontSize: 14,
  color: "#475569",
  verticalAlign: "middle",
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