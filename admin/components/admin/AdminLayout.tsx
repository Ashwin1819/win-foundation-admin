"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type AdminLayoutProps = {
  children: React.ReactNode;
};

const mainMenuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: "▦",
  },
  {
    label: "Homepage",
    path: "/admin/home-settings",
    icon: "⌂",
  },
  {
    label: "About Us Page",
    path: "/admin/about-page",
    icon: "ℹ",
  },
  {
    label: "Page Headers",
    path: "/admin/page-headers",
    icon: "▭",
  },
  {
    label: "Initiatives",
    path: "/admin/initiatives",
    icon: "◇",
  },
];

const connectItems = [
  {
    label: "Campaigns",
    path: "/admin/campaigns",
  },
  {
    label: "Become a Partner",
    path: "/admin/partner-applications",
  },
  {
    label: "Internship",
    path: "/admin/internship",
  },
  {
    label: "Volunteer",
    path: "/admin/volunteers",
  },
  {
    label: "CV Building",
    path: "/admin/cv-building",
  },
  {
    label: "FAQ",
    path: "/admin/faq",
  },
  {
    label: "Form Builder",
    path: "/admin/form-fields",
  },
];

const bottomMenuItems = [
  {
    label: "Payments",
    path: "/admin/donations",
    icon: "₹",
  },
  {
    label: "Testimonial",
    path: "/admin/testimonials",
    icon: "❝",
  },
  {
    label: "Updates",
    path: "/admin/updates",
    icon: "▤",
  },
  {
    label: "Blogs",
    path: "/admin/blogs",
    icon: "📝",
  },
  {
    label: "Replies",
    path: "/admin/messages",
    icon: "♧",
  },
  {
    label: "Media",
    path: "/admin/media",
    icon: "▧",
  },
  {
    label: "Gallery",
    path: "/admin/gallery",
    icon: "▦",
  },
  {
    label: "Map Points",
    path: "/admin/camp-locations",
    icon: "⌖",
  },
  {
    label: "Join our Team",
    path: "/admin/team-members",
    icon: "♙",
  },
  {
    label: "My Profile",
    path: "/admin/profile",
    icon: "◉",
  },
  {
    label: "Site Settings",
    path: "/admin/site-settings",
    icon: "⚙",
  },
  {
    label: "Footer Links",
    path: "/admin/footer-links",
    icon: "▾",
  },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [email, setEmail] = useState("Admin");
  const [logo, setLogo] = useState("");
  const [connectOpen, setConnectOpen] = useState(true);

  /*
   * =======================================================
   * LOAD SITE LOGO
   * =======================================================
   */

  async function loadSiteLogo() {
    try {
      const response = await fetch(
        "/api/site-settings",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (
        data &&
        typeof data.logo === "string"
      ) {
        setLogo(data.logo);
      } else {
        setLogo("");
      }
    } catch (error) {
      console.error(
        "Failed to load site logo:",
        error
      );
    }
  }

  /*
   * =======================================================
   * AUTHENTICATION
   * =======================================================
   */

  useEffect(() => {
    // These two pages are reachable without being logged in — don't bounce
    // an unauthenticated visitor away from them before they can use them.
    if (pathname === "/admin/login" || pathname === "/admin/reset-password") {
      return;
    }

    let cancelled = false;

    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });

        if (cancelled) return;

        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }

        const data = await response.json();

        setEmail(data?.admin?.email || "Admin");

        await loadSiteLogo();
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/admin/login");
      }
    }

    void checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  /*
   * =======================================================
   * LISTEN FOR LOGO UPDATE
   *
   * Site Settings page sends this event after saving
   * a new logo.
   * =======================================================
   */

  useEffect(() => {
    const handleLogoUpdated = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<{
          logo?: string;
        }>;

      const newLogo =
        customEvent.detail?.logo;

      if (
        typeof newLogo === "string"
      ) {
        setLogo(newLogo);
      }
    };

    window.addEventListener(
      "site-logo-updated",
      handleLogoUpdated
    );

    return () => {
      window.removeEventListener(
        "site-logo-updated",
        handleLogoUpdated
      );
    };
  }, []);

  /*
   * =======================================================
   * LOGOUT
   * =======================================================
   */

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });

      router.replace(
        "/admin/login"
      );
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }

  /*
   * =======================================================
   * LOGIN PAGE
   * =======================================================
   */

  if (
    pathname === "/admin/login" ||
    pathname === "/admin/reset-password"
  ) {
    return <>{children}</>;
  }

  /*
   * =======================================================
   * ACTIVE MENU
   * =======================================================
   */

  function isActive(
    path: string
  ) {
    if (path === "/admin") {
      return pathname === "/admin";
    }

    return (
      pathname === path ||
      pathname.startsWith(
        `${path}/`
      )
    );
  }

  const connectActive =
    pathname ===
      "/admin/campaigns" ||
    pathname.startsWith(
      "/admin/connect"
    );

  /*
   * =======================================================
   * ADMIN PANEL
   * =======================================================
   */

  return (
    <div className="admin-shell">

      {/* SIDEBAR */}

      <aside className="admin-sidebar">

        {/* BRAND */}

        <div className="admin-brand">

          <div
            className="admin-logo"
            style={
              logo
                ? {
                    backgroundColor:
                      "#ffffff",

                    backgroundImage:
                      `url(${JSON.stringify(
                        logo
                      )})`,

                    backgroundRepeat:
                      "no-repeat",

                    backgroundPosition:
                      "center",

                    backgroundSize:
                      "contain",
                  }
                : undefined
            }
          >
            {!logo && "W"}
          </div>

          <div>
            <div className="admin-brand-title">
              WIN Foundations
            </div>

            <div className="admin-brand-subtitle">
              Admin Panel
            </div>
          </div>

        </div>

        {/* MENU TITLE */}

        <div className="admin-menu-title">
          MAIN MENU
        </div>

        {/* NAVIGATION */}

        <nav className="admin-nav">

          {/* MAIN MENU */}

          {mainMenuItems.map(
            (item) => (
              <button
                key={item.path}
                type="button"
                className={`admin-menu-item ${
                  isActive(
                    item.path
                  )
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  router.push(
                    item.path
                  )
                }
              >
                <span className="admin-menu-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            )
          )}

          {/* CONNECT WITH US */}

          <button
            type="button"
            className={`admin-menu-item connect-main ${
              connectActive
                ? "active"
                : ""
            }`}
            onClick={() =>
              setConnectOpen(
                (value) => !value
              )
            }
          >
            <span className="admin-menu-icon">
              ◇
            </span>

            <span className="connect-title">
              Connect With Us
            </span>

            <span className="connect-arrow">
              {connectOpen
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {/* CONNECT SUBMENU */}

          {connectOpen && (
            <div className="connect-submenu">

              {connectItems.map(
                (item) => (
                  <button
                    key={item.path}
                    type="button"
                    className={`connect-submenu-item ${
                      isActive(
                        item.path
                      )
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      router.push(
                        item.path
                      )
                    }
                  >
                    <span className="submenu-dot">
                      •
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </button>
                )
              )}

            </div>
          )}

          {/* OTHER MENU ITEMS */}

          {bottomMenuItems.map(
            (item) => (
              <button
                key={item.path}
                type="button"
                className={`admin-menu-item ${
                  isActive(
                    item.path
                  )
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  router.push(
                    item.path
                  )
                }
              >
                <span className="admin-menu-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            )
          )}

        </nav>

        {/* ADMIN FOOTER */}

        <div className="admin-footer">

          <div className="admin-user">

            <div className="admin-avatar">
              {email
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="admin-user-info">

              <strong>
                Admin
              </strong>

              <span>
                {email}
              </span>

            </div>

          </div>

          <button
            type="button"
            className="admin-logout"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* PAGE CONTENT */}

      <main className="admin-content">
        {children}
      </main>

      {/* STYLES */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          min-height: 100%;
        }

        body {
          background: #f5f7fa;
          font-family:
            Inter,
            Arial,
            sans-serif;
        }

        /* ADMIN SHELL */

        .admin-shell {
          min-height: 100vh;
          width: 100%;
          background: #f5f7fa;
        }

        /* SIDEBAR */

        .admin-sidebar {
          position: fixed;

          top: 0;
          left: 0;
          bottom: 0;

          width: 255px;

          background: #ffffff;

          border-right:
            1px solid #e5e7eb;

          display: flex;
          flex-direction: column;

          z-index: 1000;
        }

        /* BRAND */

        .admin-brand {
          height: 84px;

          flex: 0 0 84px;

          padding: 0 20px;

          display: flex;
          align-items: center;

          gap: 11px;

          border-bottom:
            1px solid #edf0f3;
        }

        .admin-logo {
          width: 40px;
          height: 40px;

          border-radius: 8px;

          background: #2563eb;

          color: #ffffff;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 20px;
          font-weight: 800;

          flex-shrink: 0;

          background-repeat:
            no-repeat;

          background-position:
            center;

          background-size:
            contain;
        }

        .admin-brand-title {
          color: #172033;

          font-size: 15px;

          font-weight: 700;
        }

        .admin-brand-subtitle {
          margin-top: 2px;

          color: #8993a5;

          font-size: 11px;
        }

        /* MENU TITLE */

        .admin-menu-title {
          padding:
            23px 22px 10px;

          color: #98a2b3;

          font-size: 10px;

          letter-spacing: 1px;

          font-weight: 700;
        }

        /* NAVIGATION */

        .admin-nav {
          flex: 1;

          min-height: 0;

          overflow-y: auto;

          padding:
            0 10px 10px;
        }

        /* MENU ITEM */

        .admin-menu-item {
          width: 100%;

          height: 42px;

          margin-bottom: 2px;

          padding:
            0 13px;

          border: 0;

          border-radius: 7px;

          background:
            transparent;

          color: #53617a;

          display: flex;

          align-items: center;

          gap: 12px;

          font-size: 13px;

          font-weight: 600;

          text-align: left;

          cursor: pointer;
        }

        .admin-menu-item:hover {
          background: #f5f7fb;
        }

        .admin-menu-item.active {
          color: #2563eb;

          background: #eaf1ff;

          box-shadow:
            inset 3px 0 0 #2563eb;
        }

        .admin-menu-icon {
          width: 20px;

          min-width: 20px;

          display: inline-flex;

          align-items: center;

          justify-content: center;

          color: #8994a8;

          font-size: 14px;
        }

        .admin-menu-item.active
          .admin-menu-icon {
          color: #2563eb;
        }

        /* CONNECT */

        .connect-main {
          margin-top: 4px;
        }

        .connect-title {
          flex: 1;
        }

        .connect-arrow {
          margin-left: auto;

          font-size: 13px;

          color: #7d8798;
        }

        /* CONNECT SUBMENU */

        .connect-submenu {
          margin:
            0 0 6px 24px;

          padding:
            3px 0 3px 10px;

          border-left:
            1px solid #dfe5ef;
        }

        .connect-submenu-item {
          width: 100%;

          height: 36px;

          padding:
            0 8px;

          border: 0;

          background:
            transparent;

          color: #667085;

          display: flex;

          align-items: center;

          gap: 8px;

          border-radius: 6px;

          font-size: 12px;

          font-weight: 500;

          text-align: left;

          cursor: pointer;
        }

        .connect-submenu-item:hover {
          background: #f5f7fb;

          color: #2563eb;
        }

        .connect-submenu-item.active {
          background: #eaf1ff;

          color: #2563eb;

          font-weight: 700;
        }

        .submenu-dot {
          color: #a0a9b8;

          font-size: 15px;
        }

        .connect-submenu-item.active
          .submenu-dot {
          color: #2563eb;
        }

        /* FOOTER */

        .admin-footer {
          flex: 0 0 auto;

          padding:
            12px 15px 15px;

          border-top:
            1px solid #edf0f3;

          background:
            #ffffff;
        }

        .admin-user {
          display: flex;

          align-items: center;

          gap: 9px;

          padding:
            4px 4px 9px;
        }

        .admin-avatar {
          width: 34px;
          height: 34px;

          border-radius: 50%;

          background: #111827;

          color: #ffffff;

          display: flex;

          align-items: center;
          justify-content: center;

          font-size: 12px;

          font-weight: 700;

          flex-shrink: 0;
        }

        .admin-user-info {
          min-width: 0;

          display: flex;

          flex-direction: column;

          gap: 2px;
        }

        .admin-user-info strong {
          color: #344054;

          font-size: 11px;
        }

        .admin-user-info span {
          max-width: 170px;

          overflow: hidden;

          text-overflow: ellipsis;

          white-space: nowrap;

          color: #98a2b3;

          font-size: 10px;
        }

        .admin-logout {
          width: 100%;

          height: 36px;

          border:
            1px solid #e1e5eb;

          border-radius: 6px;

          background: #ffffff;

          color: #667085;

          font-size: 11px;

          cursor: pointer;
        }

        .admin-logout:hover {
          background: #f8fafc;
        }

        /* CONTENT */

        .admin-content {
          width:
            calc(100% - 255px);

          min-height: 100vh;

          margin-left: 255px;

          padding:
            29px 25px 40px;

          overflow-x: hidden;
        }

        /* RESPONSIVE */

        @media (max-width: 900px) {

          .admin-sidebar {
            width: 235px;
          }

          .admin-content {
            width:
              calc(100% - 235px);

            margin-left: 235px;

            padding:
              24px 18px 35px;
          }

        }

      `}</style>
    </div>
  );
}