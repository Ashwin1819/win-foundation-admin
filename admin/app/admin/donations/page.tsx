"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

type Donation = {
  id: string;
  donorName: string;
  email: string;
  phone: string | null;
  amount: number;
  donationType: string;
  campaignId: number | null;
  campaign: { title: string } | null;
  paymentMethod: string | null;
  paymentStatus: string;
  transactionId: string | null;
  receiptNumber: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
};

function campaignName(donation: Donation) {
  return donation.campaign?.title ?? "General Donation";
}



export default function DonationsPage() {
  const router = useRouter();

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [campaignFilter, setCampaignFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateField, setDateField] = useState("DATE");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const response = await fetch("/api/donations", {
          method: "GET",
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Failed to fetch payments");
        }

        setDonations(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch payments:", error);
        alert(
          error instanceof Error ? error.message : "Failed to load payments"
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const campaigns = useMemo(() => {
    return Array.from(
      new Set(donations.map((donation) => campaignName(donation)))
    ).sort((a, b) => a.localeCompare(b));
  }, [donations]);

  const filteredDonations = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = donations.filter((donation) => {
      const created = new Date(donation.createdAt);

      const matchesSearch =
        !query ||
        donation.donorName.toLowerCase().includes(query) ||
        donation.email.toLowerCase().includes(query) ||
        (donation.phone || "").toLowerCase().includes(query) ||
        campaignName(donation).toLowerCase().includes(query) ||
        (donation.transactionId || "").toLowerCase().includes(query);

      const matchesCampaign =
        campaignFilter === "ALL" || campaignName(donation) === campaignFilter;

      const createdDate = new Date(
        created.getFullYear(),
        created.getMonth(),
        created.getDate()
      );

      const startDate = fromDate
        ? new Date(`${fromDate}T00:00:00`)
        : null;
      const endDate = toDate
        ? new Date(`${toDate}T23:59:59.999`)
        : null;

      const matchesFrom = !startDate || createdDate >= startDate;
      const matchesTo = !endDate || createdDate <= endDate;

      return (
        matchesSearch &&
        matchesCampaign &&
        matchesFrom &&
        matchesTo
      );
    });

    result.sort((a, b) => {
      const first = new Date(a.createdAt).getTime();
      const second = new Date(b.createdAt).getTime();
      return sortOrder === "NEWEST" ? second - first : first - second;
    });

    return result;
  }, [donations, search, campaignFilter, fromDate, toDate, sortOrder]);

  const completedPayments = donations.filter(
    (donation) => donation.paymentStatus === "SUCCESS"
  );
  const failedPayments = donations.filter(
    (donation) => donation.paymentStatus === "FAILED"
  );

  const completedAmount = completedPayments.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );
  const failedAmount = failedPayments.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );
  const allAttemptsAmount = donations.reduce(
    (sum, donation) => sum + Number(donation.amount || 0),
    0
  );

  async function updateStatus(id: string, paymentStatus: string) {
    try {
      setUpdatingId(id);

      
      const token = "cookie-auth";

      const response = await fetch("/api/donations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id, paymentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to update status");
        return;
      }

      setDonations((current) =>
        current.map((donation) =>
          donation.id === id ? { ...donation, paymentStatus } : donation
        )
      );
    } catch (error) {
      console.error("Update payment status error:", error);
      alert("Failed to update payment status");
    } finally {
      setUpdatingId(null);
    }
  }

  function printReceipt(donation: Donation) {
    const receiptWindow = window.open("", "_blank", "width=800,height=900");

    if (!receiptWindow) {
      alert("Please allow pop-ups to print the receipt.");
      return;
    }

    const amount = Number(donation.amount || 0).toLocaleString("en-IN");
    const date = new Date(donation.createdAt).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    receiptWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Donation Receipt - ${escapeHtml(donation.receiptNumber || donation.id)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #111827; }
            .receipt { max-width: 680px; margin: 0 auto; border: 1px solid #ddd; padding: 32px; }
            h1 { margin: 0 0 8px; font-size: 26px; }
            .muted { color: #667085; margin-bottom: 28px; }
            .row { display: flex; justify-content: space-between; gap: 30px; padding: 12px 0; border-bottom: 1px solid #eee; }
            .label { color: #667085; }
            .value { font-weight: 600; text-align: right; }
            .amount { font-size: 24px; }
            .footer { margin-top: 28px; color: #667085; font-size: 12px; }
            @media print { body { padding: 0; } .receipt { border: 0; } }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>WIN Foundations</h1>
            <div class="muted">Donation Payment Receipt</div>
            <div class="row"><span class="label">Receipt</span><span class="value">${escapeHtml(donation.receiptNumber || "—")}</span></div>
            <div class="row"><span class="label">Donor</span><span class="value">${escapeHtml(donation.donorName)}</span></div>
            <div class="row"><span class="label">Email</span><span class="value">${escapeHtml(donation.email)}</span></div>
            <div class="row"><span class="label">Phone</span><span class="value">${escapeHtml(donation.phone || "—")}</span></div>
            <div class="row"><span class="label">Campaign</span><span class="value">${escapeHtml(campaignName(donation))}</span></div>
            <div class="row"><span class="label">Payment Method</span><span class="value">${escapeHtml(donation.paymentMethod || "—")}</span></div>
            <div class="row"><span class="label">Transaction ID</span><span class="value">${escapeHtml(donation.transactionId || "—")}</span></div>
            <div class="row"><span class="label">Status</span><span class="value">${escapeHtml(donation.paymentStatus)}</span></div>
            <div class="row"><span class="label">Date</span><span class="value">${escapeHtml(date)}</span></div>
            <div class="row"><span class="label">Amount</span><span class="value amount">₹${amount}</span></div>
            <div class="footer">Thank you for supporting WIN Foundations.</div>
          </div>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);

    receiptWindow.document.close();
  }

  async function resendEmail(donation: Donation) {
    try {
      
      const token = "cookie-auth";

      const response = await fetch("/api/donations/resend-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          donationId: donation.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data?.error || "Failed to resend receipt email");
        return;
      }

      alert(`Receipt email sent successfully to ${donation.email}`);
    } catch (error) {
      console.error("Resend receipt email error:", error);
      alert("Failed to resend receipt email");
    }
  }

  function exportToCSV() {
    if (filteredDonations.length === 0) {
      alert("There are no payments to export.");
      return;
    }

    const headers = [
      "Campaign",
      "Amount",
      "Donor Name",
      "Email",
      "Phone",
      "Payment Method",
      "Status",
      "Date",
      "Transaction ID",
      "Receipt Number",
    ];

    const rows = filteredDonations.map((donation) => [
      campaignName(donation),
      donation.amount,
      donation.donorName,
      donation.email,
      donation.phone || "",
      donation.paymentMethod || "",
      donation.paymentStatus,
      new Date(donation.createdAt).toLocaleString(),
      donation.transactionId || "",
      donation.receiptNumber || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "win-foundation-payments.csv";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function formatDate(value: string) {
    try {
      return new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return value;
    }
  }

 if (loading) {
  return (
    <main style={mainStyle}>
      <div style={loadingStyle}>Loading payments...</div>
    </main>
  );
}

 return (
  <main style={mainStyle}>
        <div style={pageHeaderStyle}>
          <div>
            <div style={breadcrumbStyle}>Dashboard / Payments</div>
            <h1 style={pageTitleStyle}>Payments</h1>
            <p style={pageDescriptionStyle}>
              Live transactions with campaign and donor details.
            </p>
          </div>

          <div style={headerActionsStyle}>
            <button
              type="button"
              style={syncButtonStyle}
              onClick={() => window.location.reload()}
            >
              Sync Payments
            </button>

            <button type="button" onClick={exportToCSV} style={headerButtonStyle}>
              Download Excel
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              style={headerButtonStyle}
            >
              Download PDF
            </button>
          </div>
        </div>

        <section style={statsGridStyle}>
          <StatCard
            value={`₹${completedAmount.toLocaleString("en-IN")}`}
            label="Completed Amount"
            valueColor="#008b67"
          />
          <StatCard
            value={String(completedPayments.length)}
            label="Completed Payments"
            valueColor="#008b67"
          />
          <StatCard
            value={`₹${failedAmount.toLocaleString("en-IN")}`}
            label="Failed Amount"
            valueColor="#d92d20"
          />
          <StatCard
            value={String(failedPayments.length)}
            label="Failed Payments"
            valueColor="#d92d20"
          />
          <StatCard
            value={`₹${allAttemptsAmount.toLocaleString("en-IN")}`}
            label={`All Attempts (${donations.length})`}
            valueColor="#101828"
          />
        </section>

        <section style={filtersCardStyle}>
          <div style={filterRowStyle}>
            <div style={searchBoxStyle}>
              <span style={searchIconStyle}>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search campaign, donor, email"
                style={searchInputStyle}
              />
            </div>

            <select
              value={campaignFilter}
              onChange={(event) => setCampaignFilter(event.target.value)}
              style={filterSelectStyle}
            >
              <option value="ALL">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign} value={campaign}>
                  {campaign}
                </option>
              ))}
            </select>

            <label style={dateInputWrapperStyle}>
              <span style={dateLabelStyle}>From:</span>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                style={dateInputStyle}
              />
            </label>

            <label style={dateInputWrapperStyle}>
              <span style={dateLabelStyle}>To:</span>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                style={dateInputStyle}
              />
            </label>
          </div>

          <div style={filterRowStyle}>
            <select
              value={dateField}
              onChange={(event) => setDateField(event.target.value)}
              style={smallFilterStyle}
              aria-label="Sort field"
            >
              <option value="DATE">Date</option>
            </select>

            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              style={smallSortStyle}
              aria-label="Sort order"
            >
              <option value="NEWEST">Newest first</option>
              <option value="OLDEST">Oldest first</option>
            </select>
          </div>
        </section>

        <section style={tableCardStyle}>
          <div style={tableScrollStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Campaign</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Donor</th>
                  <th style={thStyle}>Payment method</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDonations.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={emptyCellStyle}>
                      No payments found.
                    </td>
                  </tr>
                ) : (
                  filteredDonations.map((donation) => (
                    <tr key={donation.id}>
                      <td style={tdStyle}>
                        <div style={campaignNameStyle}>
                          {campaignName(donation)}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <strong style={amountStyle}>
                          ₹{Number(donation.amount).toLocaleString("en-IN")}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        <div style={donorDetailsStyle}>
                          {donation.donorName && (
                            <div>
                              <span style={orangeLabelStyle}>Name:</span>{" "}
                              {donation.donorName}
                            </div>
                          )}
                          <div>
                            <span style={orangeLabelStyle}>Email:</span>{" "}
                            {donation.email}
                          </div>
                          {donation.phone && (
                            <div>
                              <span style={orangeLabelStyle}>Phone:</span>{" "}
                              {donation.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <strong style={paymentMethodStyle}>
                          {donation.paymentMethod || "—"}
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {donation.paymentStatus === "SUCCESS" ? (
                          <span
                            style={{
                              ...statusSelectStyle,
                              ...getStatusStyle(donation.paymentStatus),
                              cursor: "default",
                              display: "inline-block",
                            }}
                          >
                            completed
                          </span>
                        ) : (
                          <select
                            value={donation.paymentStatus}
                            disabled={updatingId === donation.id}
                            onChange={(event) =>
                              updateStatus(donation.id, event.target.value)
                            }
                            style={{
                              ...statusSelectStyle,
                              ...getStatusStyle(donation.paymentStatus),
                            }}
                          >
                            <option value="PENDING">pending</option>
                            <option value="FAILED">failed</option>
                          </select>
                        )}
                      </td>

                      <td style={tdStyle}>
                        <div style={dateCellStyle}>
                          {formatDate(donation.createdAt)}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: "right" }}>
                        <div style={actionGroupStyle}>
                          <button
                            type="button"
                            style={receiptButtonStyle}
                            onClick={() => printReceipt(donation)}
                          >
                            Print
                            <br />
                            Receipt
                          </button>

                          <button
                            type="button"
                            style={emailButtonStyle}
                            onClick={() => resendEmail(donation)}
                          >
                            Resend
                            <br />
                            Email
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <div style={resultCountStyle}>
          Showing {filteredDonations.length} of {donations.length} payments
        </div>
      </main>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStatusStyle(status: string): CSSProperties {
  if (status === "SUCCESS") {
    return { background: "#eafaf0", color: "#197344" };
  }

  if (status === "FAILED") {
    return { background: "#fff0f0", color: "#b42318" };
  }

  if (status === "REFUNDED") {
    return { background: "#fff7df", color: "#9a6700" };
  }

  return { background: "#eef4ff", color: "#2563eb" };
}

function StatCard({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  return (
    <div style={statCardStyle}>
      <div style={{ ...statValueStyle, color: valueColor }}>{value}</div>
      <div style={statLabelStyle}>{label}</div>
    </div>
  );
}

const layoutStyle: CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  background: "#f5f7fa",
};

































const mainStyle: CSSProperties = {
  width: "100%",
  minWidth: 0,
  padding: "28px 24px 35px",
  boxSizing: "border-box",
};

const pageHeaderStyle: CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "18px",
};

const breadcrumbStyle: CSSProperties = {
  fontSize: "10px",
  color: "#98a2b3",
  marginBottom: "6px",
};

const pageTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: "22px",
  fontWeight: 750,
  color: "#101828",
};

const pageDescriptionStyle: CSSProperties = {
  margin: "5px 0 0",
  maxWidth: "700px",
  fontSize: "11px",
  lineHeight: 1.5,
  color: "#667085",
};

const headerActionsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const headerButtonStyle: CSSProperties = {
  height: "38px",
  padding: "0 16px",
  border: "none",
  borderRadius: "5px",
  background: "#111827",
  color: "#fff",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 700,
};

const syncButtonStyle: CSSProperties = {
  ...headerButtonStyle,
  background: "#12a66a",
};

const statsGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  gap: "14px",
  margin: "22px 0 28px",
};

const statCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "17px 20px",
  minHeight: "128px",
  boxSizing: "border-box",
};

const statValueStyle: CSSProperties = {
  fontSize: "25px",
  lineHeight: 1.1,
  fontWeight: 800,
  letterSpacing: "-0.5px",
};

const statLabelStyle: CSSProperties = {
  marginTop: "9px",
  color: "#667085",
  fontSize: "13px",
  fontWeight: 550,
};

const filtersCardStyle: CSSProperties = {
  marginBottom: "25px",
};

const filterRowStyle: CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "center",
  marginBottom: "10px",
  flexWrap: "wrap",
};

const searchBoxStyle: CSSProperties = {
  flex: "1 1 250px",
  minWidth: "220px",
  height: "39px",
  background: "#fff",
  border: "1px solid #d8dee8",
  borderRadius: "5px",
  display: "flex",
  alignItems: "center",
  padding: "0 12px",
  boxSizing: "border-box",
};

const searchIconStyle: CSSProperties = {
  color: "#98a2b3",
  fontSize: "16px",
  marginRight: "7px",
};

const searchInputStyle: CSSProperties = {
  width: "100%",
  border: "none",
  outline: "none",
  background: "transparent",
  color: "#344054",
  fontSize: "12px",
};

const filterSelectStyle: CSSProperties = {
  flex: "1 1 300px",
  height: "39px",
  minWidth: "230px",
  border: "1px solid #d8dee8",
  borderRadius: "5px",
  background: "#fff",
  color: "#475467",
  padding: "0 10px",
  fontSize: "12px",
};

const dateInputWrapperStyle: CSSProperties = {
  height: "39px",
  border: "1px solid #d8dee8",
  borderRadius: "5px",
  background: "#fff",
  display: "flex",
  alignItems: "center",
  padding: "0 9px",
  gap: "7px",
};

const dateLabelStyle: CSSProperties = {
  color: "#667085",
  fontSize: "11px",
  fontWeight: 600,
};

const dateInputStyle: CSSProperties = {
  height: "32px",
  border: "none",
  outline: "none",
  color: "#344054",
  background: "transparent",
  fontSize: "12px",
};

const smallFilterStyle: CSSProperties = {
  width: "170px",
  height: "39px",
  border: "1px solid #d8dee8",
  borderRadius: "5px",
  background: "#fff",
  color: "#475467",
  padding: "0 10px",
  fontSize: "12px",
};

const smallSortStyle: CSSProperties = {
  width: "175px",
  height: "39px",
  border: "1px solid #d8dee8",
  borderRadius: "5px",
  background: "#fff",
  color: "#475467",
  padding: "0 10px",
  fontSize: "12px",
};

const tableCardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #dfe5ec",
  borderRadius: "8px",
  overflow: "hidden",
};

const tableScrollStyle: CSSProperties = {
  overflowX: "auto",
};

const tableStyle: CSSProperties = {
  width: "100%",
  minWidth: "1120px",
  borderCollapse: "collapse",
};

const thStyle: CSSProperties = {
  padding: "16px 15px",
  textAlign: "left",
  fontSize: "12px",
  color: "#344054",
  fontWeight: 750,
  background: "#f8fafc",
  borderBottom: "1px solid #e4e9ef",
  whiteSpace: "nowrap",
};

const tdStyle: CSSProperties = {
  padding: "14px 15px",
  fontSize: "12px",
  color: "#344054",
  verticalAlign: "middle",
  borderBottom: "1px solid #e4e9ef",
};

const campaignNameStyle: CSSProperties = {
  color: "#101828",
  fontSize: "13px",
  fontWeight: 650,
  maxWidth: "190px",
};

const amountStyle: CSSProperties = {
  color: "#101828",
  fontSize: "13px",
  fontWeight: 600,
  whiteSpace: "nowrap",
};

const donorDetailsStyle: CSSProperties = {
  lineHeight: 1.55,
  color: "#667085",
  fontSize: "11px",
  minWidth: "240px",
};

const orangeLabelStyle: CSSProperties = {
  color: "#e04f16",
  fontWeight: 700,
};

const paymentMethodStyle: CSSProperties = {
  color: "#101828",
  fontSize: "12px",
  fontWeight: 550,
};

const statusSelectStyle: CSSProperties = {
  border: "none",
  borderRadius: "5px",
  padding: "7px 10px",
  fontWeight: 650,
  fontSize: "11px",
  cursor: "pointer",
  outline: "none",
};

const dateCellStyle: CSSProperties = {
  color: "#344054",
  fontSize: "12px",
  lineHeight: 1.45,
  whiteSpace: "nowrap",
};

const actionGroupStyle: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
};

const receiptButtonStyle: CSSProperties = {
  minWidth: "84px",
  height: "46px",
  border: "1px solid #d0d5dd",
  borderRadius: "5px",
  background: "#f8fafc",
  color: "#344054",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 650,
  lineHeight: 1.2,
};

const emailButtonStyle: CSSProperties = {
  minWidth: "90px",
  height: "46px",
  border: "none",
  borderRadius: "5px",
  background: "#2563eb",
  color: "#fff",
  cursor: "pointer",
  fontSize: "10px",
  fontWeight: 650,
  lineHeight: 1.2,
};

const emptyCellStyle: CSSProperties = {
  height: "180px",
  textAlign: "center",
  color: "#667085",
  fontSize: "13px",
};

const resultCountStyle: CSSProperties = {
  padding: "10px 0",
  color: "#667085",
  fontSize: "11px",
};

const loadingStyle: CSSProperties = {
  minHeight: "80vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#667085",
  fontSize: "13px",
};
