"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function VolunteerPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    age: "",
    occupation: "",
    skills: "",
    areaOfInterest: "",
    availability: "",
    message: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

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

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setSuccess(false);

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        "/api/volunteers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
  name: form.name.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  city: form.city.trim(),
  age: form.age
    ? Number(form.age)
    : null,
  occupation: form.occupation.trim(),
  skills: form.skills.trim(),
  areaOfInterest: form.areaOfInterest,
  availability: form.availability,
  message: form.message.trim(),
}),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to submit volunteer application"
        );
      }

      setSuccess(true);

      setForm({
        name: "",
        email: "",
        phone: "",
        city: "",
        age: "",
        occupation: "",
        skills: "",
        areaOfInterest: "",
        availability: "",
        message: "",
      });

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Volunteer submission error:",
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
          maxWidth: "1000px",
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
              color: "#db2777",
              cursor: "pointer",
              fontSize: "15px",
              marginBottom: "15px",
            }}
          >
            ← Back to Home
          </button>

          <h1
            style={{
              fontSize:
                "clamp(36px, 6vw, 56px)",
              margin: "0 0 15px",
              color: "#111827",
            }}
          >
            Join Us
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
            Become a volunteer and help WIN Foundations
            create meaningful opportunities for children
            and communities.
          </p>
        </div>

        {/* SUCCESS */}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #86efac",
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
              }}
            >
              🎉 Thank You for Volunteering!
            </h2>

            <p style={{ margin: 0 }}>
              Your volunteer application has
              been submitted successfully.
            </p>
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fee2e2",
              border: "1px solid #fca5a5",
              color: "#991b1b",
              padding: "15px 18px",
              borderRadius: "10px",
              marginBottom: "25px",
            }}
          >
            {error}
          </div>
        )}

        {/* FORM */}

        <div
          style={{
            background: "white",
            borderRadius: "18px",
            padding: "clamp(22px, 5vw, 40px)",
            boxShadow:
              "0 8px 30px rgba(0,0,0,0.07)",
          }}
        >
          <h2
            style={{
              marginTop: 0,
              fontSize: "26px",
              marginBottom: "25px",
            }}
          >
            Volunteer Application
          </h2>

          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >
              {/* NAME */}

              <div>
                <label style={labelStyle}>
                  Full Name *
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* EMAIL */}

              <div>
                <label style={labelStyle}>
                  Email *
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* PHONE */}

              <div>
                <label style={labelStyle}>
                  Phone *
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  required
                  style={inputStyle}
                />
              </div>

              {/* CITY */}

              <div>
                <label style={labelStyle}>
                  City
                </label>

                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Enter your city"
                  style={inputStyle}
                />
              </div>

              {/* AGE */}

              <div>
                <label style={labelStyle}>
                  Age
                </label>

                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  min="1"
                  max="100"
                  style={inputStyle}
                />
              </div>

              {/* OCCUPATION */}

              <div>
                <label style={labelStyle}>
                  Occupation
                </label>

                <input
                  name="occupation"
                  value={form.occupation}
                  onChange={handleChange}
                  placeholder="Student / Professional / Other"
                  style={inputStyle}
                />
              </div>

              {/* SKILLS */}

              <div>
                <label style={labelStyle}>
                  Skills
                </label>

                <input
                  name="skills"
                  value={form.skills}
                  onChange={handleChange}
                  placeholder="Teaching, Design, Social Media..."
                  style={inputStyle}
                />
              </div>

              {/* AREA OF INTEREST */}

              <div>
                <label style={labelStyle}>
                  Area of Interest
                </label>

                <select
                  name="areaOfInterest"
                  value={form.areaOfInterest}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select an area
                  </option>

                  <option value="Education">
                    Education
                  </option>

                  <option value="Healthcare">
                    Healthcare
                  </option>

                  <option value="Women Empowerment">
                    Women Empowerment
                  </option>

                  <option value="Community Development">
                    Community Development
                  </option>

                  <option value="Fundraising">
                    Fundraising
                  </option>

                  <option value="Social Media">
                    Social Media
                  </option>

                  <option value="Events">
                    Events
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              {/* AVAILABILITY */}

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label style={labelStyle}>
                  Availability
                </label>

                <select
                  name="availability"
                  value={form.availability}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">
                    Select your availability
                  </option>

                  <option value="Weekdays">
                    Weekdays
                  </option>

                  <option value="Weekends">
                    Weekends
                  </option>

                  <option value="Both">
                    Weekdays & Weekends
                  </option>

                  <option value="Occasionally">
                    Occasionally
                  </option>
                </select>
              </div>

              {/* MESSAGE */}

              <div
                style={{
                  gridColumn: "1 / -1",
                }}
              >
                <label style={labelStyle}>
                  Message
                </label>

                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us why you would like to volunteer..."
                  rows={6}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                  }}
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
                background: submitting
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
                ? "Submitting..."
                : "Submit Volunteer Application"}
            </button>
          </form>
        </div>

        {/* BOTTOM NOTE */}

        <div
          style={{
            textAlign: "center",
            marginTop: "25px",
            color: "#6b7280",
            fontSize: "14px",
          }}
        >
          Thank you for choosing to support WIN
          Foundation.
        </div>
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
  background: "white",
};