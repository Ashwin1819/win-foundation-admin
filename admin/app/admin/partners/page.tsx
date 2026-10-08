"use client";

import { useEffect, useState } from "react";

type Partner = {
  id: number;
  name: string;
  logo: string;
  websiteUrl: string | null;
  order: number;
  isActive: boolean;
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    logo: "",
    websiteUrl: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    void fetchPartners();
  }, []);

  async function fetchPartners() {
    try {
      const response = await fetch("/api/partners", { cache: "no-store" });
      const data = await response.json();

      setPartners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? e.target.checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.logo.trim()) {
      alert("Partner name and logo URL are required.");
      return;
    }

    try {
      const response = await fetch("/api/partners", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: editingId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Something went wrong");
        return;
      }

      alert(
        editingId
          ? "Partner updated successfully"
          : "Partner added successfully"
      );

      resetForm();
      fetchPartners();
    } catch (error) {
      console.error("Save partner error:", error);
      alert("Failed to save partner");
    }
  }

  function editPartner(partner: Partner) {
    setEditingId(partner.id);

    setForm({
      name: partner.name,
      logo: partner.logo || "",
      websiteUrl: partner.websiteUrl || "",
      order: partner.order,
      isActive: partner.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deletePartner(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this partner?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/partners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete partner");
        return;
      }

      alert("Partner deleted successfully");

      fetchPartners();
    } catch (error) {
      console.error("Delete partner error:", error);
      alert("Failed to delete partner");
    }
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      name: "",
      logo: "",
      websiteUrl: "",
      order: 0,
      isActive: true,
    });
  }

  return (
    <main
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "32px", marginBottom: "10px" }}>
        Partners & Supporters
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Manage partner and supporter organizations displayed on the website.
      </p>

      {/* FORM */}

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "40px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {editingId ? "Edit Partner" : "Add Partner"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Partner Name *</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Example: ABC Foundation"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Logo URL *</label>

            <input
              name="logo"
              value={form.logo}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="https://example.com/logo.png"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Website URL</label>

            <input
              name="websiteUrl"
              value={form.websiteUrl}
              onChange={handleChange}
              style={inputStyle}
              placeholder="https://example.com"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Display Order</label>

            <input
              type="number"
              name="order"
              value={form.order}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={buttonStyle}>
              {editingId ? "Update Partner" : "Add Partner"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  ...buttonStyle,
                  background: "#777",
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      {/* EXISTING PARTNERS */}

      <section>
        <h2 style={{ marginBottom: "20px" }}>
          Existing Partners
        </h2>

        {loading ? (
          <p>Loading partners...</p>
        ) : partners.length === 0 ? (
          <p style={{ color: "#666" }}>
            No partners added yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {partners.map((partner) => (
              <div
                key={partner.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                {partner.logo && (
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    style={{
                      width: "120px",
                      height: "80px",
                      objectFit: "contain",
                      marginBottom: "15px",
                    }}
                  />
                )}

                <h3>{partner.name}</h3>

                {partner.websiteUrl && (
                  <p style={{ color: "#666" }}>
                    {partner.websiteUrl}
                  </p>
                )}

                <p style={{ color: "#777" }}>
                  Order: {partner.order} |{" "}
                  {partner.isActive ? "Active" : "Inactive"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() => editPartner(partner)}
                    style={buttonStyle}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deletePartner(partner.id)}
                    style={{
                      ...buttonStyle,
                      background: "#d32f2f",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "10px",
  marginTop: "6px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 18px",
  border: "none",
  borderRadius: "6px",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
