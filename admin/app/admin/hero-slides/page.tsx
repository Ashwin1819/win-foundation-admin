"use client";

import { useEffect, useState } from "react";

type HeroSlide = {
  id: number;
  image: string;
  headline: string;
  subtext: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  order: number;
  isActive: boolean;
};

export default function HeroSlidesPage() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    image: "",
    headline: "",
    subtext: "",
    ctaText: "",
    ctaLink: "",
    order: 0,
    isActive: true,
  });

  useEffect(() => {
    void fetchSlides();
  }, []);

  async function fetchSlides() {
    try {
      const response = await fetch("/api/hero-slides", { cache: "no-store" });
      const data = await response.json();

      setSlides(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch hero slides:", error);
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
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : type === "number"
          ? Number(value)
          : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.image.trim() || !form.headline.trim()) {
      alert("Image and headline are required.");
      return;
    }

    try {
      const response = await fetch("/api/hero-slides", {
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
          ? "Hero slide updated successfully"
          : "Hero slide added successfully"
      );

      resetForm();
      fetchSlides();
    } catch (error) {
      console.error("Save hero slide error:", error);
      alert("Failed to save hero slide");
    }
  }

  function editSlide(slide: HeroSlide) {
    setEditingId(slide.id);

    setForm({
      image: slide.image,
      headline: slide.headline,
      subtext: slide.subtext || "",
      ctaText: slide.ctaText || "",
      ctaLink: slide.ctaLink || "",
      order: slide.order,
      isActive: slide.isActive,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteSlide(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this hero slide?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch("/api/hero-slides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete hero slide");
        return;
      }

      alert("Hero slide deleted successfully");

      fetchSlides();
    } catch (error) {
      console.error("Delete hero slide error:", error);
      alert("Failed to delete hero slide");
    }
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      image: "",
      headline: "",
      subtext: "",
      ctaText: "",
      ctaLink: "",
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
        Hero Slides
      </h1>

      <p style={{ color: "#666", marginBottom: "30px" }}>
        Manage the homepage hero banners and call-to-action buttons.
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
          {editingId ? "Edit Hero Slide" : "Add Hero Slide"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Headline *</label>

            <input
              name="headline"
              value={form.headline}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="Example: Every Child Deserves a Better Future"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Subtext</label>

            <textarea
              name="subtext"
              value={form.subtext}
              onChange={handleChange}
              rows={3}
              style={inputStyle}
              placeholder="Example: Together we can create opportunities for every child."
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Hero Image URL *</label>

            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              required
              style={inputStyle}
              placeholder="https://example.com/hero-image.jpg"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Button Text</label>

            <input
              name="ctaText"
              value={form.ctaText}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Donate Now"
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Button Link</label>

            <input
              name="ctaLink"
              value={form.ctaLink}
              onChange={handleChange}
              style={inputStyle}
              placeholder="/donate"
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
              {editingId ? "Update Hero Slide" : "Add Hero Slide"}
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

      {/* EXISTING SLIDES */}

      <section>
        <h2 style={{ marginBottom: "20px" }}>
          Existing Hero Slides
        </h2>

        {loading ? (
          <p>Loading hero slides...</p>
        ) : slides.length === 0 ? (
          <p style={{ color: "#666" }}>
            No hero slides added yet.
          </p>
        ) : (
          <div
            style={{
              display: "grid",
              gap: "20px",
            }}
          >
            {slides.map((slide) => (
              <div
                key={slide.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                }}
              >
                {slide.image && (
                  <img
                    src={slide.image}
                    alt={slide.headline}
                    style={{
                      width: "100%",
                      maxWidth: "600px",
                      height: "220px",
                      objectFit: "cover",
                      borderRadius: "8px",
                      marginBottom: "15px",
                    }}
                  />
                )}

                <h2>{slide.headline}</h2>

                {slide.subtext && (
                  <p style={{ color: "#666" }}>
                    {slide.subtext}
                  </p>
                )}

                {slide.ctaText && (
                  <p>
                    Button: <strong>{slide.ctaText}</strong>
                  </p>
                )}

                {slide.ctaLink && (
                  <p>
                    Link: {slide.ctaLink}
                  </p>
                )}

                <p style={{ color: "#777" }}>
                  Order: {slide.order} |{" "}
                  {slide.isActive ? "Active" : "Inactive"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "15px",
                  }}
                >
                  <button
                    onClick={() => editSlide(slide)}
                    style={buttonStyle}
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSlide(slide.id)}
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
