"use client";

import { FormEvent, useState } from "react";

type FormDataType = {
  organizationName: string;
  contactPersonName: string;
  email: string;
  phone: string;
  website: string;
  partnershipType: string;
  partnershipMessage: string;
};

const initialForm: FormDataType = {
  organizationName: "",
  contactPersonName: "",
  email: "",
  phone: "",
  website: "",
  partnershipType: "",
  partnershipMessage: "",
};

export default function PartnerPage() {
  const [formData, setFormData] = useState<FormDataType>(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await fetch("/api/partner-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit application");
      }

      setSuccess(
        "Thank you! Your partnership application has been submitted successfully."
      );

      setFormData(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      {/* Header */}
      <section style={styles.hero}>
        <div style={styles.container}>
          <h1 style={styles.title}>Become a Partner</h1>

          <p style={styles.subtitle}>
            Partner with Win Foundations to create lasting impact together —
            as a corporate, institutional, or community partner.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={styles.formSection}>
        <div style={styles.container}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              name="organizationName"
              placeholder="Organization Name"
              value={formData.organizationName}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="text"
              name="contactPersonName"
              placeholder="Contact Person Name"
              value={formData.contactPersonName}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              required
              style={styles.input}
            />

            <input
              type="url"
              name="website"
              placeholder="Website (optional)"
              value={formData.website}
              onChange={handleChange}
              style={styles.input}
            />

            <select
              name="partnershipType"
              value={formData.partnershipType}
              onChange={handleChange}
              required
              style={styles.select}
            >
              <option value="">Select Partnership Type</option>
              <option value="Corporate Partnership">
                Corporate Partnership
              </option>
              <option value="Institutional Partnership">
                Institutional Partnership
              </option>
              <option value="Community Partnership">
                Community Partnership
              </option>
              <option value="CSR Partnership">CSR Partnership</option>
              <option value="Funding Partnership">
                Funding Partnership
              </option>
              <option value="Strategic Partnership">
                Strategic Partnership
              </option>
              <option value="Other">Other</option>
            </select>

            <textarea
              name="partnershipMessage"
              placeholder="Tell us about the partnership you have in mind"
              value={formData.partnershipMessage}
              onChange={handleChange}
              required
              rows={6}
              style={styles.textarea}
            />

            {success && <div style={styles.success}>{success}</div>}

            {error && <div style={styles.error}>{error}</div>}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#ffffff",
    color: "#111827",
  },

  hero: {
    padding: "80px 24px 40px",
    background: "#ffffff",
  },

  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
  },

  title: {
    margin: 0,
    fontSize: "58px",
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: "-1.5px",
    color: "#111827",
  },

  subtitle: {
    maxWidth: "900px",
    margin: "22px 0 0",
    fontSize: "23px",
    lineHeight: 1.55,
    color: "#374151",
  },

  formSection: {
    padding: "30px 24px 100px",
  },

  form: {
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },

  input: {
    width: "100%",
    height: "62px",
    padding: "0 22px",
    border: "1.5px solid #333333",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "19px",
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    height: "62px",
    padding: "0 22px",
    border: "1.5px solid #333333",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "19px",
    outline: "none",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "150px",
    padding: "18px 22px",
    border: "1.5px solid #333333",
    borderRadius: "12px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "19px",
    lineHeight: 1.5,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },

  button: {
    width: "100%",
    height: "62px",
    border: "none",
    borderRadius: "10px",
    background: "#1261d8",
    color: "#ffffff",
    fontSize: "19px",
    fontWeight: 700,
    marginTop: "4px",
    transition: "0.2s",
  },

  success: {
    padding: "16px 18px",
    borderRadius: "10px",
    background: "#e8f8ee",
    border: "1px solid #9bd5ae",
    color: "#176b35",
    fontSize: "16px",
    lineHeight: 1.5,
  },

  error: {
    padding: "16px 18px",
    borderRadius: "10px",
    background: "#fff0f0",
    border: "1px solid #efaaaa",
    color: "#a32020",
    fontSize: "16px",
    lineHeight: 1.5,
  },
};