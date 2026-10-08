"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminProfile = {
  id: number;
  email: string;
  role: "SUPER_ADMIN" | "EDITOR";
};

export default function ProfilePage() {
  const router = useRouter();

  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (cancelled) return;

        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }

        const data = await response.json();
        setAdmin(data.admin);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !admin) {
    return (
      <main style={styles.loading}>
        Loading...
      </main>
    );
  }

  return (
    <main style={styles.page}>
      {/* PAGE HEADER */}
      <div style={styles.header}>
        <h1 style={styles.title}>My Profile</h1>

        <p style={styles.subtitle}>
          Your account details.
        </p>
      </div>

      <div style={styles.grid}>
        {/* ACCOUNT DETAILS */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            Account details
          </h2>

          <div style={styles.accountDetails}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                Email
              </span>

              <span style={styles.detailValue}>
                {admin.email}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>
                Role
              </span>

              <span style={styles.detailValue}>
                {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Editor"}
              </span>
            </div>
          </div>
        </section>

        {/* EDIT PROFILE / PASSWORD — not available */}
        <section style={styles.card}>
          <h2 style={styles.cardTitle}>
            Edit profile &amp; password
          </h2>

          <p style={styles.helpText}>
            Self-service profile and password changes aren&apos;t available
            yet — admin login now runs through the backend&apos;s AdminUser
            system, which doesn&apos;t yet expose an endpoint for this. Ask a
            Super Admin to update your account from Admin Users, or add a
            change-password endpoint on the backend.
          </p>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100%",
    padding: "32px 42px 60px",
    background: "#f6f8fb",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f6f8fb",
    color: "#667085",
    fontSize: "15px",
  },

  header: {
    marginBottom: "28px",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#172033",
  },

  subtitle: {
    margin: "8px 0 0",
    fontSize: "16px",
    color: "#667085",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "26px",
    alignItems: "stretch",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #dce2e9",
    borderRadius: "9px",
    padding: "28px",
    minHeight: "160px",
    boxSizing: "border-box",
  },

  cardTitle: {
    margin: "0 0 24px",
    fontSize: "19px",
    fontWeight: 700,
    color: "#172033",
  },

  accountDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  detailRow: {
    display: "grid",
    gridTemplateColumns: "145px 1fr",
    gap: "10px",
    alignItems: "start",
  },

  detailLabel: {
    fontSize: "16px",
    color: "#667085",
    fontWeight: 600,
  },

  detailValue: {
    fontSize: "16px",
    color: "#172033",
    fontWeight: 500,
    wordBreak: "break-word",
  },

  helpText: {
    margin: 0,
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#667085",
  },
};
