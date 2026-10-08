"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

type SiteSettings = {
  id?: string;
  foundationName: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  facebook: string;
  instagram: string;
  youtube: string;
  linkedin: string;
  footerText: string;
  seoTitle: string;
  seoDescription: string;
};

const emptySettings: SiteSettings = {
  foundationName: "WIN Foundations",
  logo: "",
  email: "",
  phone: "",
  address: "",
  facebook: "",
  instagram: "",
  youtube: "",
  linkedin: "",
  footerText: "",
  seoTitle: "",
  seoDescription: "",
};

export default function SiteSettingsPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<SiteSettings>({
      ...emptySettings,
    });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  /* ========================================================
     LOGIN
  ======================================================== */

  const redirectToLogin = useCallback(() => {
    router.push("/admin/login");
  }, [router]);

  /* ========================================================
     LOAD SETTINGS
  ======================================================== */

  const fetchSettings = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        
        const token =
          "cookie-auth";

        const response =
          await fetch(
            "/api/site-settings",
            {
              method: "GET",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load site settings."
          );
        }

        setForm({
          foundationName:
            data?.foundationName ??
            "WIN Foundations",

          logo:
            data?.logo ?? "",

          email:
            data?.email ?? "",

          phone:
            data?.phone ?? "",

          address:
            data?.address ?? "",

          facebook:
            data?.facebook ?? "",

          instagram:
            data?.instagram ?? "",

          youtube:
            data?.youtube ?? "",

          linkedin:
            data?.linkedin ?? "",

          footerText:
            data?.footerText ?? "",

          seoTitle:
            data?.seoTitle ?? "",

          seoDescription:
            data?.seoDescription ?? "",
        });
      } catch (error) {
        console.error(
          "Failed to load site settings:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load site settings."
        );
      } finally {
        setLoading(false);
      }
    },
    [redirectToLogin]
  );

  /* ========================================================
     AUTH
  ======================================================== */

  useEffect(() => {
    void fetchSettings();
  }, [fetchSettings]);

  /* ========================================================
     UPDATE FIELD
  ======================================================== */

  function updateField(
    field: keyof SiteSettings,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setMessage("");
    setError("");
  }

  /* ========================================================
     LOGO UPLOAD
  ======================================================== */

  function handleLogoFile(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select an image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Logo image must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      const result =
        reader.result;

      if (
        typeof result ===
        "string"
      ) {
        setForm((current) => ({
          ...current,
          logo: result,
        }));
      }
    };

    reader.onerror = () => {
      setError(
        "Failed to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  }

  /* ========================================================
     SAVE SETTINGS
  ======================================================== */

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      
      const token =
        "cookie-auth";

      const response =
        await fetch(
          "/api/site-settings",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              form
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save site settings."
        );
      }

      setForm((current) => ({
        ...current,

        foundationName:
          data?.foundationName ??
          current.foundationName,

        logo:
          data?.logo ??
          current.logo,

        email:
          data?.email ??
          current.email,

        phone:
          data?.phone ??
          current.phone,

        address:
          data?.address ??
          current.address,

        facebook:
          data?.facebook ??
          current.facebook,

        instagram:
          data?.instagram ??
          current.instagram,

        youtube:
          data?.youtube ??
          current.youtube,

        linkedin:
          data?.linkedin ??
          current.linkedin,

        footerText:
          data?.footerText ??
          current.footerText,

        seoTitle:
          data?.seoTitle ??
          current.seoTitle,

        seoDescription:
          data?.seoDescription ??
          current.seoDescription,
      }));

      setMessage(
        "Site settings saved successfully."
      );
    } catch (error) {
      console.error(
        "Failed to save site settings:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to save site settings."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================================
     LOADING
  ======================================================== */

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          padding: "40px",
          background: "#f7f8fa",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "30px",
            }}
          >
            Site Settings
          </h1>

          <p
            style={{
              marginTop: "10px",
              color: "#667085",
            }}
          >
            Loading site settings...
          </p>
        </div>
      </main>
    );
  }

  /* ========================================================
     MAIN PAGE
  ======================================================== */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fa",
        padding: "35px",
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
            marginBottom: "28px",
          }}
        >
          <h1
            style={{
              margin: 0,
              color: "#111827",
              fontSize: "30px",
              fontWeight: 700,
            }}
          >
            Site Settings
          </h1>

          <p
            style={{
              marginTop: "8px",
              marginBottom: 0,
              color: "#667085",
              fontSize: "14px",
            }}
          >
            Manage your foundation
            information, logo, social
            links and SEO settings.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              border:
                "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div
            style={{
              marginBottom: "20px",
              padding: "14px 16px",
              borderRadius: "10px",
              border:
                "1px solid #bbf7d0",
              background: "#f0fdf4",
              color: "#15803d",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >
          {/* ==================================================
              FOUNDATION INFORMATION
          ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "26px",
              marginBottom: "22px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              Foundation Information
            </h2>

            <p
              style={{
                marginTop: "6px",
                marginBottom: "22px",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Basic information
              displayed across the
              website.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >
              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={labelStyle}
                >
                  Foundation Name
                </label>

                <input
                  type="text"
                  value={
                    form.foundationName
                  }
                  onChange={(event) =>
                    updateField(
                      "foundationName",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="WIN Foundations"
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Email
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="info@example.org"
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Phone
                </label>

                <input
                  type="text"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div
                style={{
                  gridColumn:
                    "1 / -1",
                }}
              >
                <label
                  style={labelStyle}
                >
                  Address
                </label>

                <textarea
                  value={form.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "90px",
                    resize: "vertical",
                  }}
                  placeholder="Foundation office address"
                />
              </div>
            </div>
          </section>

          {/* ==================================================
              WEBSITE LOGO
          ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "26px",
              marginBottom: "22px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              Website Logo
            </h2>

            <p
              style={{
                marginTop: "6px",
                marginBottom: "22px",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              This logo can be used for
              the main website and
              Admin Panel.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "24px",
                flexWrap: "wrap",
              }}
            >
              {/* PREVIEW */}

              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "14px",
                  border:
                    "1px solid #e5e7eb",
                  background: "#f8fafc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {form.logo ? (
                  <Image
                    src={form.logo}
                    alt="WIN Foundations Logo"
                    width={110}
                    height={110}
                    unoptimized
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "12px",
                      background: "#2563eb",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "28px",
                      fontWeight: 800,
                    }}
                  >
                    W
                  </div>
                )}
              </div>

              {/* UPLOAD */}

              <div
                style={{
                  flex: 1,
                  minWidth: "250px",
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFile}
                  style={{
                    display: "none",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  style={{
                    height: "42px",
                    padding:
                      "0 18px",
                    border: 0,
                    borderRadius: "8px",
                    background:
                      "#2563eb",
                    color: "#ffffff",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Choose Logo
                </button>

                <p
                  style={{
                    marginTop: "10px",
                    marginBottom: 0,
                    color: "#98a2b3",
                    fontSize: "12px",
                  }}
                >
                  Image files only.
                  Maximum size:
                  5 MB.
                </p>

                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <label
                    style={labelStyle}
                  >
                    Logo URL
                  </label>

                  <input
                    type="url"
                    value={form.logo}
                    onChange={(event) =>
                      updateField(
                        "logo",
                        event.target.value
                      )
                    }
                    style={inputStyle}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              SOCIAL MEDIA
          ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "26px",
              marginBottom: "22px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              Social Media
            </h2>

            <p
              style={{
                marginTop: "6px",
                marginBottom: "22px",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Add your foundation&apos;s
              social media links.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(0, 1fr))",
                gap: "20px",
              }}
            >
              <div>
                <label
                  style={labelStyle}
                >
                  Facebook
                </label>

                <input
                  type="url"
                  value={form.facebook}
                  onChange={(event) =>
                    updateField(
                      "facebook",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  Instagram
                </label>

                <input
                  type="url"
                  value={form.instagram}
                  onChange={(event) =>
                    updateField(
                      "instagram",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  YouTube
                </label>

                <input
                  type="url"
                  value={form.youtube}
                  onChange={(event) =>
                    updateField(
                      "youtube",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  LinkedIn
                </label>

                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(event) =>
                    updateField(
                      "linkedin",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="https://linkedin.com/..."
                />
              </div>
            </div>
          </section>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "26px",
              marginBottom: "22px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              Footer
            </h2>

            <p
              style={{
                marginTop: "6px",
                marginBottom: "22px",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Text displayed in the
              website footer.
            </p>

            <label
              style={labelStyle}
            >
              Footer Text
            </label>

            <textarea
              value={form.footerText}
              onChange={(event) =>
                updateField(
                  "footerText",
                  event.target.value
                )
              }
              style={{
                ...inputStyle,
                minHeight: "110px",
                resize: "vertical",
              }}
              placeholder="Together we can create meaningful change."
            />
          </section>

          {/* ==================================================
              SEO
          ================================================== */}

          <section
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "26px",
              marginBottom: "22px",
              boxShadow:
                "0 2px 8px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "19px",
                color: "#111827",
              }}
            >
              SEO Settings
            </h2>

            <p
              style={{
                marginTop: "6px",
                marginBottom: "22px",
                color: "#667085",
                fontSize: "13px",
              }}
            >
              Search engine title and
              description for the website.
            </p>

            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              <div>
                <label
                  style={labelStyle}
                >
                  SEO Title
                </label>

                <input
                  type="text"
                  value={form.seoTitle}
                  onChange={(event) =>
                    updateField(
                      "seoTitle",
                      event.target.value
                    )
                  }
                  style={inputStyle}
                  placeholder="WIN Foundations"
                />
              </div>

              <div>
                <label
                  style={labelStyle}
                >
                  SEO Description
                </label>

                <textarea
                  value={
                    form.seoDescription
                  }
                  onChange={(event) =>
                    updateField(
                      "seoDescription",
                      event.target.value
                    )
                  }
                  style={{
                    ...inputStyle,
                    minHeight: "110px",
                    resize: "vertical",
                  }}
                  placeholder="Describe WIN Foundations..."
                />
              </div>
            </div>
          </section>

          {/* ==================================================
              SAVE
          ================================================== */}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              paddingBottom: "30px",
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={{
                minWidth: "180px",
                height: "46px",
                padding:
                  "0 24px",
                border: 0,
                borderRadius: "9px",
                background:
                  saving
                    ? "#93c5fd"
                    : "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                cursor: saving
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {saving
                ? "Saving..."
                : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

/* ============================================================
   STYLES
============================================================ */

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "8px",
  color: "#344054",
  fontSize: "13px",
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  border:
    "1px solid #d0d5dd",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#111827",
  fontSize: "13px",
  outline: "none",
};