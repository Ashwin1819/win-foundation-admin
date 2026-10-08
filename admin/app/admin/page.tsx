"use client";

import { useEffect, useState } from "react";

type DashboardStats = {
  donations: number;
  campaigns: number;
  testimonials: number;
  updates: number;
  messages: number;
  volunteers: number;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<DashboardStats>({
    donations: 0,
    campaigns: 0,
    testimonials: 0,
    updates: 0,
    messages: 0,
    volunteers: 0,
  });

  useEffect(() => {
    async function load() {
        try {
          const [
            donationsRes,
            campaignsRes,
            testimonialsRes,
            updatesRes,
            messagesRes,
            volunteersRes,
          ] = await Promise.all([
            fetch("/api/donations"),

            fetch("/api/campaigns"),

            fetch("/api/testimonials"),

            fetch("/api/updates"),

            fetch("/api/messages"),

            fetch("/api/volunteers"),
          ]);

          const donationsData = donationsRes.ok
            ? await donationsRes.json()
            : [];

          const campaignsData = campaignsRes.ok
            ? await campaignsRes.json()
            : [];

          const testimonialsData = testimonialsRes.ok
            ? await testimonialsRes.json()
            : [];

          const updatesData = updatesRes.ok
            ? await updatesRes.json()
            : [];

          const messagesData = messagesRes.ok
            ? await messagesRes.json()
            : [];

          const volunteersData = volunteersRes.ok
            ? await volunteersRes.json()
            : [];

          setStats({
            donations: Array.isArray(donationsData)
              ? donationsData.length
              : 0,

            campaigns: Array.isArray(campaignsData)
              ? campaignsData.length
              : 0,

            testimonials: Array.isArray(testimonialsData)
              ? testimonialsData.length
              : 0,

            updates: Array.isArray(updatesData)
              ? updatesData.length
              : 0,

            messages: Array.isArray(messagesData)
              ? messagesData.length
              : 0,

            volunteers: Array.isArray(volunteersData)
              ? volunteersData.length
              : 0,
          });
        } catch (error) {
          console.error(
            "Dashboard loading error:",
            error
          );
        } finally {
          setLoading(false);
        }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading administration panel...
      </div>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          Dashboard
        </h1>

        <p style={styles.subtitle}>
          WIN Foundations admin dashboard.
        </p>
      </div>

      <div style={styles.statsGrid}>
        <DashboardCard
          value={stats.donations}
          title="Total Donations"
        />

        <DashboardCard
          value={stats.campaigns}
          title="Total Campaigns"
        />

        <DashboardCard
          value={stats.testimonials}
          title="Total Testimonials"
        />

        <DashboardCard
          value={stats.updates}
          title="Total Updates"
        />

        <DashboardCard
          value={stats.messages}
          title="Total Messages"
        />

        <DashboardCard
          value={stats.volunteers}
          title="Total Volunteers"
        />
      </div>
    </main>
  );
}

function DashboardCard({
  value,
  title,
}: {
  value: number;
  title: string;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardValue}>
        {value}
      </div>

      <div style={styles.cardTitle}>
        {title}
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
    width: "100%",
    background: "#f5f7fa",
    padding: "36px",
    boxSizing: "border-box",
  },

  loading: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fa",
    color: "#344054",
    fontFamily: "Arial, sans-serif",
  },

  header: {
    marginBottom: "30px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#101828",
  },

  subtitle: {
    margin: "10px 0 0",
    fontSize: "15px",
    color: "#667085",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(6, minmax(150px, 1fr))",
    gap: "18px",
    width: "100%",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e4e7ec",
    borderRadius: "8px",
    minHeight: "125px",
    padding: "22px",
    boxSizing: "border-box",
  },

  cardValue: {
    fontSize: "30px",
    lineHeight: 1,
    fontWeight: 700,
    color: "#101828",
    marginBottom: "15px",
  },

  cardTitle: {
    fontSize: "14px",
    color: "#667085",
    fontWeight: 500,
  },
};