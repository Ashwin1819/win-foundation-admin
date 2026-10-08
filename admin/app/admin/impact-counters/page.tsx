"use client";

import { useEffect, useState } from "react";

type ImpactCounter = {
  id: number;
  label: string;
  number: number;
  icon: string | null;
  order: number;
};

export default function ImpactCountersPage() {
  const [counters, setCounters] = useState<ImpactCounter[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    label: "",
    number: 0,
    icon: "",
    order: 0,
  });

  useEffect(() => {
    void fetchCounters();
  }, []);

  async function fetchCounters() {
    try {
      const response = await fetch("/api/impact-counters", { cache: "no-store" });
      const data = await response.json();

      setCounters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch impact counters:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.label.trim()) {
      alert("Label is required.");
      return;
    }

    try {
      const response = await fetch("/api/impact-counters", {
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
          ? "Impact counter updated successfully"
          : "Impact counter added successfully"
      );

      resetForm();
      fetchCounters();
    } catch (error) {
      console.error("Save impact counter error:", error);
      alert("Failed to save impact counter");
    }
  }

  function editCounter(counter: ImpactCounter) {
    setEditingId(counter.id);

    setForm({
      label: counter.label,
      number: counter.number,
      icon: counter.icon || "",
      order: counter.order,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteCounter(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this impact counter?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/impact-counters", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete impact counter");
        return;
      }

      alert("Impact counter deleted successfully");
      fetchCounters();
    } catch (error) {
      console.error("Delete impact counter error:", error);
      alert("Failed to delete impact counter");
    }
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      label: "",
      number: 0,
      icon: "",
      order: 0,
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
        Impact Counters
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Manage WIN Foundations impact statistics.
      </p>

      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "12px",
          padding: "25px",
          marginBottom: "40px",
        }}
      >
        <h2 style={{ marginBottom: "20px" }}>
          {editingId ? "Edit Impact Counter" : "Add Impact Counter"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Label *</label>

            <input
              name="label"
              value={form.label}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Example: Children Supported"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Number *</label>

            <input
              type="number"
              name="number"
              value={form.number}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Example: 10000"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Icon</label>

            <input
              name="icon"
              value={form.icon}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Icon name or URL"
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

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" style={buttonStyle}>
              {editingId ? "Update Impact Counter" : "Add Impact Counter"}
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

      <section>
        <h2 style={{ marginBottom: "20px" }}>Existing Impact Counters</h2>

        {loading ? (
          <p>Loading impact counters...</p>
        ) : counters.length === 0 ? (
          <p style={{ color: "#666" }}>
            No impact counters added yet.
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
            {counters.map((counter) => (
              <div
                key={counter.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                <h2 style={{ fontSize: "32px", margin: "0 0 5px" }}>
                  {counter.number}
                </h2>

                <h3>{counter.label}</h3>

                {counter.icon && (
                  <p style={{ color: "#666" }}>
                    Icon: {counter.icon}
                  </p>
                )}

                <p style={{ color: "#777" }}>
                  Order: {counter.order}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() => editCounter(counter)}
                    style={buttonStyle}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteCounter(counter.id)}
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
