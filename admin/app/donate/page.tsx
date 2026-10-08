"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = {
  id: string;
  title: string;
  slug: string;
  isActive: boolean;
};

export default function DonatePage() {
  const router = useRouter();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  const [amount, setAmount] = useState("1000");
  const [customAmount, setCustomAmount] = useState("");

  const [donationType, setDonationType] =
    useState("ONE_TIME");

  const [form, setForm] = useState({
    donorName: "",
    donorEmail: "",
    donorPhone: "",
    campaign: "",
    paymentMethod: "UPI",
    address: "",
  });

  const [loadingCampaigns, setLoadingCampaigns] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [success, setSuccess] =
    useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const response = await fetch(
          "/api/campaigns"
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data)) {
          const activeCampaigns =
            data.filter(
              (campaign: Campaign) =>
                campaign.isActive
            );

          setCampaigns(activeCampaigns);
        }
      } catch (error) {
        console.error(
          "Failed to load campaigns:",
          error
        );
      } finally {
        setLoadingCampaigns(false);
      }
    }

    fetchCampaigns();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function getDonationAmount() {
    if (amount === "CUSTOM") {
      return Number(customAmount);
    }

    return Number(amount);
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess(false);

    const donationAmount =
      getDonationAmount();

    if (
      !donationAmount ||
      donationAmount <= 0
    ) {
      setError(
        "Please enter a valid donation amount."
      );
      return;
    }

    if (!form.donorName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.donorEmail.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.donorPhone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/donations",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            donorName:
              form.donorName.trim(),

            donorEmail:
              form.donorEmail.trim(),

            donorPhone:
              form.donorPhone.trim(),

            amount: donationAmount,

            donationType,

            campaign:
              form.campaign || null,

            paymentMethod:
              form.paymentMethod,

            paymentStatus: "PENDING",

            address:
              form.address.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to submit donation"
        );
      }

      setSuccess(true);

      setForm({
        donorName: "",
        donorEmail: "",
        donorPhone: "",
        campaign: "",
        paymentMethod: "UPI",
        address: "",
      });

      setAmount("1000");
      setCustomAmount("");
      setDonationType("ONE_TIME");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Donation submission error:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #fff5f8 0%, #ffffff 45%, #f9fafb 100%)",
        padding: "40px 20px 80px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            textAlign: "center",
            marginBottom: "40px",
          }}
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#db2777",
              fontSize: "15px",
              marginBottom: "15px",
            }}
          >
            ← Back to Home
          </button>

          <h1
            style={{
              fontSize:
                "clamp(36px, 6vw, 58px)",
              margin: "0 0 15px",
              color: "#111827",
              fontWeight: 700,
            }}
          >
            Make a Difference
          </h1>

          <p
            style={{
              maxWidth: "650px",
              margin: "0 auto",
              color: "#6b7280",
              fontSize: "18px",
              lineHeight: 1.7,
            }}
          >
            Your contribution can help us create
            better opportunities for children and
            communities.
          </p>
        </div>

        {/* SUCCESS MESSAGE */}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              border:
                "1px solid #86efac",
              color: "#166534",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "25px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: "22px",
              }}
            >
              ❤️ Thank You for Your Donation!
            </h2>

            <p style={{ margin: 0 }}>
              Your donation has been recorded
              successfully. Payment status is
              currently pending.
            </p>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border:
                "1px solid #fca5a5",
              color: "#991b1b",
              padding: "15px 18px",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
              gap: "30px",
              alignItems: "start",
            }}
          >
            {/* LEFT SIDE */}

            <div
              style={{
                background: "white",
                borderRadius: "18px",
                padding: "30px",
                boxShadow:
                  "0 8px 30px rgba(0,0,0,0.07)",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  marginBottom: "25px",
                  fontSize: "25px",
                  color: "#111827",
                }}
              >
                Donation Details
              </h2>

              {/* AMOUNT */}

              <label
                style={labelStyle}
              >
                Select Donation Amount
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(4, 1fr)",
                  gap: "10px",
                  marginBottom: "15px",
                }}
              >
                {[
                  "500",
                  "1000",
                  "2500",
                  "5000",
                ].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setAmount(value)
                    }
                    style={{
                      padding: "13px 8px",
                      borderRadius: "9px",
                      border:
                        amount === value
                          ? "2px solid #db2777"
                          : "1px solid #ddd",
                      background:
                        amount === value
                          ? "#fce7f3"
                          : "white",
                      color:
                        amount === value
                          ? "#be185d"
                          : "#333",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ₹{Number(value).toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  setAmount("CUSTOM")
                }
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "9px",
                  border:
                    amount === "CUSTOM"
                      ? "2px solid #db2777"
                      : "1px solid #ddd",
                  background:
                    amount === "CUSTOM"
                      ? "#fce7f3"
                      : "white",
                  color:
                    amount === "CUSTOM"
                      ? "#be185d"
                      : "#333",
                  fontWeight: 600,
                  cursor: "pointer",
                  marginBottom: "15px",
                }}
              >
                Custom Amount
              </button>

              {amount === "CUSTOM" && (
                <input
                  type="number"
                  min="1"
                  placeholder="Enter custom amount"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(
                      e.target.value
                    )
                  }
                  style={inputStyle}
                />
              )}

              {/* DONATION TYPE */}

              <label
                style={{
                  ...labelStyle,
                  marginTop: "25px",
                }}
              >
                Donation Frequency
              </label>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    setDonationType(
                      "ONE_TIME"
                    )
                  }
                  style={{
                    padding: "13px",
                    borderRadius: "9px",
                    border:
                      donationType ===
                      "ONE_TIME"
                        ? "2px solid #db2777"
                        : "1px solid #ddd",
                    background:
                      donationType ===
                      "ONE_TIME"
                        ? "#fce7f3"
                        : "white",
                    color:
                      donationType ===
                      "ONE_TIME"
                        ? "#be185d"
                        : "#333",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  One Time
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setDonationType(
                      "MONTHLY"
                    )
                  }
                  style={{
                    padding: "13px",
                    borderRadius: "9px",
                    border:
                      donationType ===
                      "MONTHLY"
                        ? "2px solid #db2777"
                        : "1px solid #ddd",
                    background:
                      donationType ===
                      "MONTHLY"
                        ? "#fce7f3"
                        : "white",
                    color:
                      donationType ===
                      "MONTHLY"
                        ? "#be185d"
                        : "#333",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Monthly
                </button>
              </div>

              {/* CAMPAIGN */}

              <label
                style={{
                  ...labelStyle,
                  marginTop: "25px",
                }}
              >
                Support a Campaign
              </label>

              <select
                name="campaign"
                value={form.campaign}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="">
                  General Donation
                </option>

                {loadingCampaigns ? (
                  <option disabled>
                    Loading campaigns...
                  </option>
                ) : (
                  campaigns.map((campaign) => (
                    <option
                      key={campaign.id}
                      value={campaign.title}
                    >
                      {campaign.title}
                    </option>
                  ))
                )}
              </select>

              {/* PAYMENT METHOD */}

              <label
                style={{
                  ...labelStyle,
                  marginTop: "25px",
                }}
              >
                Payment Method
              </label>

              <select
                name="paymentMethod"
                value={form.paymentMethod}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="UPI">
                  UPI
                </option>
                <option value="CARD">
                  Credit / Debit Card
                </option>
                <option value="NET_BANKING">
                  Net Banking
                </option>
                <option value="BANK_TRANSFER">
                  Bank Transfer
                </option>
              </select>

              {/* DONOR INFORMATION */}

              <h2
                style={{
                  marginTop: "35px",
                  marginBottom: "20px",
                  fontSize: "22px",
                }}
              >
                Your Information
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr",
                  gap: "18px",
                }}
              >
                <div>
                  <label style={labelStyle}>
                    Full Name *
                  </label>

                  <input
                    name="donorName"
                    value={form.donorName}
                    onChange={handleChange}
                    placeholder="Enter your name"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Email *
                  </label>

                  <input
                    type="email"
                    name="donorEmail"
                    value={form.donorEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Phone *
                  </label>

                  <input
                    type="tel"
                    name="donorPhone"
                    value={form.donorPhone}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>
                    Address
                  </label>

                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="City / Address"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  marginTop: "30px",
                  padding: "16px",
                  border: "none",
                  borderRadius: "10px",
                  background:
                    submitting
                      ? "#9ca3af"
                      : "#db2777",
                  color: "white",
                  fontSize: "17px",
                  fontWeight: 700,
                  cursor: submitting
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                {submitting
                  ? "Processing..."
                  : `Donate ₹${
                      getDonationAmount() > 0
                        ? getDonationAmount().toLocaleString(
                            "en-IN"
                          )
                        : "0"
                    }`}
              </button>
            </div>

            {/* RIGHT SIDE */}

            <div
              style={{
                position: "sticky",
                top: "30px",
              }}
            >
              <div
                style={{
                  background:
                    "linear-gradient(145deg, #111827, #3f1728)",
                  color: "white",
                  borderRadius: "18px",
                  padding: "30px",
                  boxShadow:
                    "0 12px 35px rgba(0,0,0,0.15)",
                }}
              >
                <p
                  style={{
                    color: "#f9a8d4",
                    fontWeight: 600,
                    marginTop: 0,
                  }}
                >
                  YOUR CONTRIBUTION
                </p>

                <h2
                  style={{
                    fontSize: "38px",
                    margin:
                      "10px 0 15px",
                  }}
                >
                  ₹
                  {getDonationAmount()
                    ? getDonationAmount().toLocaleString(
                        "en-IN"
                      )
                    : "0"}
                </h2>

                <p
                  style={{
                    color: "#d1d5db",
                    lineHeight: 1.7,
                  }}
                >
                  Every contribution helps
                  WIN Foundations create
                  meaningful opportunities
                  for children and communities.
                </p>

                <div
                  style={{
                    borderTop:
                      "1px solid rgba(255,255,255,0.15)",
                    marginTop: "25px",
                    paddingTop: "20px",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: "#f9a8d4",
                    }}
                  >
                    Donation Type
                  </p>

                  <strong>
                    {donationType ===
                    "MONTHLY"
                      ? "Monthly Donation"
                      : "One-Time Donation"}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  background: "white",
                  marginTop: "20px",
                  padding: "22px",
                  borderRadius: "15px",
                  boxShadow:
                    "0 5px 20px rgba(0,0,0,0.06)",
                }}
              >
                <h3
                  style={{
                    marginTop: 0,
                  }}
                >
                  Secure & Transparent
                </h3>

                <p
                  style={{
                    color: "#6b7280",
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  Your donation information
                  is securely recorded and
                  managed by WIN Foundations.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: 600,
  fontSize: "14px",
  marginBottom: "8px",
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "13px 14px",
  border: "1px solid #d1d5db",
  borderRadius: "9px",
  fontSize: "15px",
  boxSizing: "border-box",
  outline: "none",
  background: "white",
};