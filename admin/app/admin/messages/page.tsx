"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  createdAt: string;
};

export default function MessagesPage() {
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch("/api/messages");

          const text = await response.text();

          let data: Message[] | { error?: string } =
            [];

          if (text.trim()) {
            try {
              data = JSON.parse(text);
            } catch {
              console.error(
                "Invalid API response:",
                text
              );
            }
          }

          if (!response.ok) {
            const errorData = data as {
              error?: string;
            };

            throw new Error(
              errorData.error ||
                "Failed to fetch messages"
            );
          }

          setMessages(data as Message[]);
        } catch (error) {
          console.error(
            "Failed to fetch messages:",
            error
          );

          alert("Failed to load messages");
        } finally {
          setLoading(false);
        }
    }

    void load();
  }, []);

  async function updateStatus(
    id: string,
    status: string
  ) {
    try {
      
      const token = "cookie-auth";

      const response = await fetch(
        "/api/messages",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id,
            status,
          }),
        }
      );

      const text = await response.text();

      let data: {
        error?: string;
      } = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error(
            "Invalid status response:",
            text
          );
        }
      }

      if (!response.ok) {
        alert(
          data.error ||
            `Failed to update status (${response.status})`
        );
        return;
      }

      setMessages((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                status,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Update status error:",
        error
      );

      alert("Failed to update status");
    }
  }

  async function deleteMessage(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    try {
      
      const token = "cookie-auth";

      const response = await fetch(
        `/api/messages?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      let data: {
        error?: string;
      } = {};

      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          console.error(
            "Invalid delete response:",
            text
          );
        }
      }

      if (!response.ok) {
        alert(
          data.error ||
            "Failed to delete message"
        );
        return;
      }

      setMessages((previous) =>
        previous.filter(
          (item) => item.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Delete message error:",
        error
      );

      alert("Something went wrong");
    }
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  }

  function getStatusStyle(status: string) {
    if (status === "CONTACTED") {
      return {
        background: "#dbeafe",
        color: "#1e40af",
      };
    }

    if (status === "CLOSED") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    return {
      background: "#fef3c7",
      color: "#92400e",
    };
  }

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Loading messages...</h2>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          maxWidth: "1300px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "32px",
                marginBottom: "8px",
              }}
            >
              Contact Messages
            </h1>

            <p
              style={{
                color: "#666",
              }}
            >
              Manage messages received
              through the contact form.
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/admin")
            }
            style={{
              padding: "11px 18px",
              border:
                "1px solid #ddd",
              borderRadius: "8px",
              background: "white",
              cursor: "pointer",
            }}
          >
            ← Dashboard
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div style={cardStyle}>
            <p>Total Messages</p>
            <h2>{messages.length}</h2>
          </div>

          <div style={cardStyle}>
            <p>New</p>
            <h2
              style={{
                color: "#d97706",
              }}
            >
              {
                messages.filter(
                  (item) =>
                    item.status ===
                    "NEW"
                ).length
              }
            </h2>
          </div>

          <div style={cardStyle}>
            <p>Contacted</p>
            <h2
              style={{
                color: "#2563eb",
              }}
            >
              {
                messages.filter(
                  (item) =>
                    item.status ===
                    "CONTACTED"
                ).length
              }
            </h2>
          </div>

          <div style={cardStyle}>
            <p>Closed</p>
            <h2
              style={{
                color: "#15803d",
              }}
            >
              {
                messages.filter(
                  (item) =>
                    item.status ===
                    "CLOSED"
                ).length
              }
            </h2>
          </div>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px",
              borderBottom:
                "1px solid #eee",
            }}
          >
            <h2>
              Received Messages
            </h2>
          </div>

          {messages.length === 0 ? (
            <div
              style={{
                padding: "60px",
                textAlign: "center",
              }}
            >
              <h3>
                No messages yet
              </h3>

              <p>
                Contact form submissions
                will appear here.
              </p>
            </div>
          ) : (
            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: "1000px",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background:
                        "#fafafa",
                    }}
                  >
                    <th style={thStyle}>
                      Sender
                    </th>

                    <th style={thStyle}>
                      Subject
                    </th>

                    <th style={thStyle}>
                      Message
                    </th>

                    <th style={thStyle}>
                      Date
                    </th>

                    <th style={thStyle}>
                      Status
                    </th>

                    <th style={thStyle}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {messages.map(
                    (item) => (
                      <tr
                        key={item.id}
                        style={{
                          borderTop:
                            "1px solid #eee",
                        }}
                      >
                        <td style={tdStyle}>
                          <strong>
                            {item.name}
                          </strong>

                          <div>
                            {item.email}
                          </div>

                          {item.phone && (
                            <div>
                              {
                                item.phone
                              }
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          {item.subject ||
                            "No subject"}
                        </td>

                        <td style={tdStyle}>
                          {item.message}
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            item.createdAt
                          )}
                        </td>

                        <td style={tdStyle}>
                          <select
                            value={
                              item.status
                            }
                            onChange={(
                              e
                            ) =>
                              updateStatus(
                                item.id,
                                e.target
                                  .value
                              )
                            }
                            style={{
                              padding:
                                "7px 10px",
                              border:
                                "none",
                              borderRadius:
                                "20px",
                              fontWeight:
                                600,
                              cursor:
                                "pointer",
                              ...getStatusStyle(
                                item.status
                              ),
                            }}
                          >
                            <option value="NEW">
                              New
                            </option>

                            <option value="CONTACTED">
                              Contacted
                            </option>

                            <option value="CLOSED">
                              Closed
                            </option>
                          </select>
                        </td>

                        <td style={tdStyle}>
                          <button
                            onClick={() =>
                              deleteMessage(
                                item.id
                              )
                            }
                            style={{
                              padding:
                                "7px 12px",
                              border:
                                "none",
                              borderRadius:
                                "7px",
                              background:
                                "#fee2e2",
                              color:
                                "#991b1b",
                              cursor:
                                "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  boxShadow:
    "0 2px 10px rgba(0,0,0,0.06)",
};

const thStyle: React.CSSProperties = {
  padding: "14px 16px",
  textAlign: "left",
  fontSize: "13px",
  color: "#555",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  fontSize: "14px",
  verticalAlign: "top",
};